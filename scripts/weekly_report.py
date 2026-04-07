"""
Weekly Quote Report — Custom Rug Quote Tracker

Queries Supabase for open quotes and sends an HTML email summary:
  1. New Quotes & Inquiries needing sales outreach (urgent flag for stale inquiries)
  2. Quotes pending CAD or Swatch approval
  3. Open quotes summary by status

Triggered weekly via GitHub Actions (Monday 8 AM UTC).
"""

import html
import json
import os
import smtplib
import sys
import urllib.request
from datetime import datetime, timedelta, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

RECIPIENTS = [
    "customconsult@jaipurliving.com",
    "michael.schenck@jaipurliving.com",
]

# Jaipur Living brand colors
COLOR_PRIMARY = "#393939"      # jl-charcoal
COLOR_MUTED = "#8a8885"        # jl-muted
COLOR_BORDER = "#dddddd"       # jl-border
COLOR_BG = "#f6f5f4"           # jl-offwhite
COLOR_URGENT = "#dc2626"       # red-600
COLOR_ACCENT = "#c8a951"       # gold accent (matches GA dashboard)


def supabase_query(table, params=None):
    """Query Supabase REST API and return parsed JSON."""
    url = os.environ["SUPABASE_URL"].rstrip("/")
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

    query_url = f"{url}/rest/v1/{table}"
    if params:
        query_url += "?" + "&".join(f"{k}={v}" for k, v in params.items())

    req = urllib.request.Request(query_url, headers={
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    })
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())


def fetch_quotes():
    """Fetch all non-Complete quotes from Supabase."""
    return supabase_query("quotes", {
        "status": "neq.Complete",
        "order": "created_at.desc",
        "select": "quote_number,customer_name,customer_company,customer_number,"
                  "product_name,status,created_at,updated_at",
    })


def build_report(quotes):
    """Build the three report sections from the quote data."""
    now = datetime.now(timezone.utc)
    seven_days_ago = now - timedelta(days=7)

    # Section 1: New quotes (created in last 7 days) + all Inquiry-status quotes
    new_and_inquiry = []
    for q in quotes:
        created = datetime.fromisoformat(q["created_at"].replace("Z", "+00:00"))
        is_recent = created >= seven_days_ago
        is_inquiry = q["status"] == "Inquiry"
        if is_recent or is_inquiry:
            is_stale = is_inquiry and created < seven_days_ago
            new_and_inquiry.append({**q, "is_stale": is_stale, "created": created})

    # Sort: stale/urgent first, then by created date desc
    new_and_inquiry.sort(key=lambda x: (not x["is_stale"], -x["created"].timestamp()))

    # Section 2: Approval action items
    approval_pending = [q for q in quotes
                        if q["status"] in ("CAD Approval Pending", "Swatch Approval Pending")]

    # Section 3: Open quotes grouped by status (ordered by workflow position)
    status_order = [
        "Inquiry", "Accepted", "CAD Created", "CAD Approval Pending", "CAD Approved",
        "Swatch Ordered", "Swatch Creation", "Swatch Shipped", "Swatch Approval Pending",
        "Swatch Approved", "Order Created", "On Loom", "Finishing", "In Transit",
    ]
    status_groups = {}
    for q in quotes:
        status_groups.setdefault(q["status"], []).append(q)

    status_summary = [(s, status_groups[s]) for s in status_order if s in status_groups]

    return new_and_inquiry, approval_pending, status_summary


def format_date(iso_str):
    """Format ISO date string to readable format."""
    dt = datetime.fromisoformat(iso_str.replace("Z", "+00:00"))
    return dt.strftime("%b %d, %Y")


def esc(value):
    """Escape a value for safe HTML insertion."""
    return html.escape(str(value)) if value else "-"


def build_html(new_and_inquiry, approval_pending, status_summary, total_open):
    """Build the full HTML email body."""
    today = datetime.now(timezone.utc).strftime("%B %d, %Y")

    # --- Section 1: New Quotes & Inquiries ---
    if new_and_inquiry:
        rows_html = ""
        for q in new_and_inquiry:
            urgent_badge = ""
            if q["is_stale"]:
                urgent_badge = (
                    f'<span style="background:{COLOR_URGENT};color:#fff;padding:2px 8px;'
                    f'border-radius:3px;font-size:11px;font-weight:bold;margin-left:8px;">'
                    f'URGENT - No action taken</span>'
                )
            rows_html += f"""
            <tr>
              <td style="padding:8px 12px;border-bottom:1px solid {COLOR_BORDER};">{esc(q["quote_number"])}{urgent_badge}</td>
              <td style="padding:8px 12px;border-bottom:1px solid {COLOR_BORDER};">{esc(q["customer_name"])}</td>
              <td style="padding:8px 12px;border-bottom:1px solid {COLOR_BORDER};">{esc(q["customer_company"])}</td>
              <td style="padding:8px 12px;border-bottom:1px solid {COLOR_BORDER};">{esc(q.get("product_name"))}</td>
              <td style="padding:8px 12px;border-bottom:1px solid {COLOR_BORDER};">{esc(q["status"])}</td>
              <td style="padding:8px 12px;border-bottom:1px solid {COLOR_BORDER};">{format_date(q["created_at"])}</td>
            </tr>"""

        section1 = f"""
        <h2 style="color:{COLOR_PRIMARY};font-size:18px;margin:32px 0 12px;">New Quotes &amp; Inquiries</h2>
        <p style="color:{COLOR_MUTED};font-size:13px;margin:0 0 12px;">Quotes created in the last 7 days and all quotes still in Inquiry status. Reach out to these customers.</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <thead>
            <tr style="background:{COLOR_BG};">
              <th style="padding:8px 12px;text-align:left;border-bottom:2px solid {COLOR_BORDER};">Quote #</th>
              <th style="padding:8px 12px;text-align:left;border-bottom:2px solid {COLOR_BORDER};">Customer</th>
              <th style="padding:8px 12px;text-align:left;border-bottom:2px solid {COLOR_BORDER};">Company</th>
              <th style="padding:8px 12px;text-align:left;border-bottom:2px solid {COLOR_BORDER};">Product</th>
              <th style="padding:8px 12px;text-align:left;border-bottom:2px solid {COLOR_BORDER};">Status</th>
              <th style="padding:8px 12px;text-align:left;border-bottom:2px solid {COLOR_BORDER};">Created</th>
            </tr>
          </thead>
          <tbody>{rows_html}
          </tbody>
        </table>"""
    else:
        section1 = f"""
        <h2 style="color:{COLOR_PRIMARY};font-size:18px;margin:32px 0 12px;">New Quotes &amp; Inquiries</h2>
        <p style="color:{COLOR_MUTED};font-size:14px;">No new quotes or open inquiries this week.</p>"""

    # --- Section 2: Approval Action Items ---
    if approval_pending:
        rows_html = ""
        for q in approval_pending:
            approval_type = "CAD" if q["status"] == "CAD Approval Pending" else "Swatch"
            rows_html += f"""
            <tr>
              <td style="padding:8px 12px;border-bottom:1px solid {COLOR_BORDER};">{esc(q["quote_number"])}</td>
              <td style="padding:8px 12px;border-bottom:1px solid {COLOR_BORDER};">{esc(q["customer_name"])}</td>
              <td style="padding:8px 12px;border-bottom:1px solid {COLOR_BORDER};">{esc(q.get("product_name"))}</td>
              <td style="padding:8px 12px;border-bottom:1px solid {COLOR_BORDER};">{approval_type}</td>
              <td style="padding:8px 12px;border-bottom:1px solid {COLOR_BORDER};">{format_date(q["updated_at"])}</td>
            </tr>"""

        section2 = f"""
        <h2 style="color:{COLOR_PRIMARY};font-size:18px;margin:32px 0 12px;">Approval Action Items</h2>
        <p style="color:{COLOR_MUTED};font-size:13px;margin:0 0 12px;">Quotes waiting on customer approval for CAD or Swatch. Follow up to keep these moving.</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <thead>
            <tr style="background:{COLOR_BG};">
              <th style="padding:8px 12px;text-align:left;border-bottom:2px solid {COLOR_BORDER};">Quote #</th>
              <th style="padding:8px 12px;text-align:left;border-bottom:2px solid {COLOR_BORDER};">Customer</th>
              <th style="padding:8px 12px;text-align:left;border-bottom:2px solid {COLOR_BORDER};">Product</th>
              <th style="padding:8px 12px;text-align:left;border-bottom:2px solid {COLOR_BORDER};">Approval Type</th>
              <th style="padding:8px 12px;text-align:left;border-bottom:2px solid {COLOR_BORDER};">Last Updated</th>
            </tr>
          </thead>
          <tbody>{rows_html}
          </tbody>
        </table>"""
    else:
        section2 = f"""
        <h2 style="color:{COLOR_PRIMARY};font-size:18px;margin:32px 0 12px;">Approval Action Items</h2>
        <p style="color:{COLOR_MUTED};font-size:14px;">No quotes pending approval this week.</p>"""

    # --- Section 3: Open Quotes Summary ---
    groups_html = ""
    for status, quotes_in_status in status_summary:
        rows_html = ""
        for q in quotes_in_status:
            rows_html += f"""
              <tr>
                <td style="padding:6px 12px;border-bottom:1px solid {COLOR_BORDER};">{esc(q["quote_number"])}</td>
                <td style="padding:6px 12px;border-bottom:1px solid {COLOR_BORDER};">{esc(q["customer_name"])}</td>
                <td style="padding:6px 12px;border-bottom:1px solid {COLOR_BORDER};">{esc(q.get("product_name"))}</td>
                <td style="padding:6px 12px;border-bottom:1px solid {COLOR_BORDER};">{format_date(q["updated_at"])}</td>
              </tr>"""

        count = len(quotes_in_status)
        groups_html += f"""
        <h3 style="color:{COLOR_PRIMARY};font-size:15px;margin:20px 0 8px;">{esc(status)} ({count})</h3>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <thead>
            <tr style="background:{COLOR_BG};">
              <th style="padding:6px 12px;text-align:left;border-bottom:2px solid {COLOR_BORDER};">Quote #</th>
              <th style="padding:6px 12px;text-align:left;border-bottom:2px solid {COLOR_BORDER};">Customer</th>
              <th style="padding:6px 12px;text-align:left;border-bottom:2px solid {COLOR_BORDER};">Product</th>
              <th style="padding:6px 12px;text-align:left;border-bottom:2px solid {COLOR_BORDER};">Last Updated</th>
            </tr>
          </thead>
          <tbody>{rows_html}
          </tbody>
        </table>"""

    section3 = f"""
        <h2 style="color:{COLOR_PRIMARY};font-size:18px;margin:32px 0 12px;">All Open Quotes by Status</h2>
        <p style="color:{COLOR_MUTED};font-size:13px;margin:0 0 12px;">{total_open} open quote{"s" if total_open != 1 else ""} across all statuses.</p>
        {groups_html}"""

    # --- Full email ---
    html = f"""\
<html>
<body style="font-family:Arial,sans-serif;color:{COLOR_PRIMARY};max-width:720px;margin:0 auto;">
  <div style="border-bottom:3px solid {COLOR_ACCENT};padding:16px 0 12px;">
    <h1 style="margin:0;font-size:22px;color:{COLOR_PRIMARY};">Custom Rug Quote Tracker</h1>
    <p style="margin:4px 0 0;font-size:13px;color:{COLOR_MUTED};">Weekly Report &mdash; {today}</p>
  </div>
  {section1}
  {section2}
  {section3}
  <hr style="border:none;border-top:1px solid {COLOR_BORDER};margin:32px 0 16px;">
  <p style="font-size:12px;color:{COLOR_MUTED};">
    This is an automated weekly report from the Custom Rug Quote Tracker.
  </p>
</body>
</html>"""

    return html


def build_plain(new_and_inquiry, approval_pending, status_summary, total_open):
    """Build a plain-text fallback version of the report."""
    today = datetime.now(timezone.utc).strftime("%B %d, %Y")
    lines = [
        f"Custom Rug Quote Tracker - Weekly Report ({today})",
        "=" * 55,
        "",
        "NEW QUOTES & INQUIRIES",
        "-" * 30,
    ]

    if new_and_inquiry:
        for q in new_and_inquiry:
            urgent = " *** URGENT - No action taken ***" if q["is_stale"] else ""
            product = q.get("product_name") or "-"
            lines.append(
                f"  {q['quote_number']} | {q['customer_name']} | "
                f"{q['customer_company']} | {product} | "
                f"{q['status']} | {format_date(q['created_at'])}{urgent}"
            )
    else:
        lines.append("  No new quotes or open inquiries this week.")

    lines += ["", "APPROVAL ACTION ITEMS", "-" * 30]
    if approval_pending:
        for q in approval_pending:
            approval_type = "CAD" if q["status"] == "CAD Approval Pending" else "Swatch"
            product = q.get("product_name") or "-"
            lines.append(
                f"  {q['quote_number']} | {q['customer_name']} | "
                f"{product} | {approval_type} | "
                f"Updated: {format_date(q['updated_at'])}"
            )
    else:
        lines.append("  No quotes pending approval this week.")

    lines += ["", f"ALL OPEN QUOTES BY STATUS ({total_open} total)", "-" * 30]
    for status, quotes_in_status in status_summary:
        count = len(quotes_in_status)
        lines.append(f"\n  {status} ({count})")
        for q in quotes_in_status:
            product = q.get("product_name") or "-"
            lines.append(
                f"    {q['quote_number']} | {q['customer_name']} | "
                f"{product} | Updated: {format_date(q['updated_at'])}"
            )

    lines += ["", "---", "Automated report from the Custom Rug Quote Tracker."]
    return "\n".join(lines)


def send_email(subject, plain, html):
    """Send multipart email via Gmail SMTP."""
    gmail_user = os.environ["GMAIL_USER"]
    gmail_password = os.environ["GMAIL_APP_PASSWORD"]

    msg = MIMEMultipart("alternative")
    msg["From"] = f"Custom Rug Quote Tracker <{gmail_user}>"
    msg["To"] = ", ".join(RECIPIENTS)
    msg["Subject"] = subject

    msg.attach(MIMEText(plain, "plain"))
    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP("smtp.gmail.com", 587) as server:
        server.starttls()
        server.login(gmail_user, gmail_password)
        server.sendmail(gmail_user, RECIPIENTS, msg.as_string())


def main():
    # Validate required env vars
    required = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "GMAIL_USER", "GMAIL_APP_PASSWORD"]
    missing = [k for k in required if not os.environ.get(k)]
    if missing:
        print(f"ERROR: Missing environment variables: {', '.join(missing)}")
        sys.exit(1)

    print("Fetching open quotes from Supabase...")
    quotes = fetch_quotes()
    total_open = len(quotes)
    print(f"  Found {total_open} open quotes.")

    new_and_inquiry, approval_pending, status_summary = build_report(quotes)
    print(f"  New/Inquiry: {len(new_and_inquiry)}")
    print(f"  Approval pending: {len(approval_pending)}")
    print(f"  Status groups: {len(status_summary)}")

    today = datetime.now(timezone.utc).strftime("%b %d, %Y")
    subject = f"Custom Rug Quote Tracker - Weekly Report ({today})"

    html = build_html(new_and_inquiry, approval_pending, status_summary, total_open)
    plain = build_plain(new_and_inquiry, approval_pending, status_summary, total_open)

    print("Sending email...")
    send_email(subject, plain, html)
    print(f"Email sent to: {', '.join(RECIPIENTS)}")


if __name__ == "__main__":
    main()

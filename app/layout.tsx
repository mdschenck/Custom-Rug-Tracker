import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Custom Rug Quote Tracker',
  description: 'Track custom rug quotes for Jaipur Living',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-white text-jl-charcoal antialiased">
        {children}
      </body>
    </html>
  )
}

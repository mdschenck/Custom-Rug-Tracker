export default function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Minimal layout for iFrame embedding - no header/navigation
  return (
    <div className="min-h-screen bg-jl-offwhite">
      {children}
    </div>
  )
}

import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'

async function signOut() {
  'use server'
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/admin/login')
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-jl-offwhite">
      <header className="bg-jl-charcoal text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/admin/quotes">
                <Image
                  src="/images/jaipur-living-logo-white.svg"
                  alt="Jaipur Living"
                  width={180}
                  height={19}
                  priority
                />
              </Link>
            </div>
            {user && (
              <div className="flex items-center gap-6">
                <Link
                  href="/admin/activity-log"
                  className="text-sm text-gray-300 hover:text-white transition-colors"
                >
                  Activity Log
                </Link>
                <span className="text-sm text-gray-300">{user.email}</span>
                <form action={signOut}>
                  <button
                    type="submit"
                    className="text-sm text-gray-300 hover:text-white transition-colors"
                  >
                    Sign Out
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}

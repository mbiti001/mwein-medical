import Link from 'next/link'
import { ReactNode } from 'react'
import { redirect } from 'next/navigation'

import LogoutButton from '../../components/LogoutButton'
import { getAuthenticatedAdmin, hasRequiredRole } from '../../lib/authServer'
import type { AdminRole } from '../../lib/auth'

type NavItem = {
  href: string
  label: string
  roles: AdminRole[]
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Overview', roles: ['ADMIN', 'PHARMACY', 'CLINIC'] },
  { href: '/dashboard/orders', label: 'Orders', roles: ['ADMIN', 'PHARMACY'] },
  { href: '/dashboard/telehealth', label: 'Telehealth', roles: ['ADMIN', 'CLINIC'] }
]

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const admin = await getAuthenticatedAdmin()

  if (!admin) {
    redirect(`/login?redirect=${encodeURIComponent('/dashboard')}`)
  }

  const allowedNav = navItems.filter(item => hasRequiredRole(admin, item.roles))

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400">Mwein Medical</p>
            <h1 className="text-lg font-semibold text-white">Operations dashboard</h1>
            <p className="text-xs text-slate-400">Signed in as {admin.email} · Role: {admin.role}</p>
          </div>
          <LogoutButton />
        </div>
        <nav className="mx-auto flex max-w-7xl gap-3 px-6 pb-3">
          {allowedNav.map(item => (
            <Link key={item.href} href={item.href} className="rounded-full border border-slate-800 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-200 hover:border-primary hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-10">
        {children}
      </main>
    </div>
  )
}

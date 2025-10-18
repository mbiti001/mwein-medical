"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Menu, Phone, X } from 'lucide-react'

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/services', label: 'Services' },
  { href: '/cancer-screening', label: 'Cancer screening' },
  { href: '/mental-health', label: 'Mental health' },
  { href: '/providers', label: 'Providers' },
  { href: '/shop', label: 'Shop' },
  { href: '/contact', label: 'Contact' }
]

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    const root = document.documentElement
    if (isMenuOpen) {
      root.classList.add('overflow-hidden')
    } else {
      root.classList.remove('overflow-hidden')
    }
    return () => {
      root.classList.remove('overflow-hidden')
    }
  }, [isMenuOpen])

  const closeMenu = () => setIsMenuOpen(false)

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/90 backdrop-blur">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-2xl font-semibold text-slate-900">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">MS</span>
          <span className="leading-tight">
            Mwein Medical
            <span className="block text-sm font-normal text-slate-500">24/7 community clinic</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-primary/10 hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/donate" className="btn-outline">Support care</Link>
          <Link href="/contact" className="btn-primary">
            <Phone className="h-4 w-4" />
            Book visit
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white p-2 text-slate-600 transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lg:hidden"
          aria-label="Toggle menu"
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((prev) => !prev)}
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div
        className={`lg:hidden ${
          isMenuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        } transition-opacity duration-200`}
      >
        <div className="absolute inset-0 bg-slate-900/40" aria-hidden onClick={closeMenu} />
        <div className="relative bg-white px-6 pb-8 pt-4 shadow-lg">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-base font-semibold text-slate-900">Navigate</span>
            <button
              type="button"
              className="rounded-full border border-transparent p-2 text-slate-500 transition hover:border-slate-200 hover:text-slate-700"
              onClick={closeMenu}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="grid gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-base font-medium text-slate-600 shadow-sm transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="mt-6 grid gap-3">
            <Link href="/donate" onClick={closeMenu} className="btn-outline justify-center">Support care</Link>
            <Link href="/contact" onClick={closeMenu} className="btn-primary justify-center">
              <Phone className="h-4 w-4" />
              Book visit
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}

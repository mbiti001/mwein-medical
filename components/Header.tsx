"use client"

import Link from 'next/link'

export default function Header() {
  return (
    <header className="sticky top-0 bg-white/95 backdrop-blur z-20 border-b">
      <div className="container mx-auto px-4 flex items-center justify-between py-3">
        <h1 className="text-2xl font-semibold text-slate-900">Mwein Medical Services</h1>
        <nav className="flex items-center gap-2">
          <Link className="px-3 text-slate-700 hover:text-slate-900" href="/">Home</Link>
          <Link className="px-3 text-slate-700 hover:text-slate-900" href="/services">Services</Link>
          <Link className="px-3 text-slate-700 hover:text-slate-900" href="/providers">Providers</Link>
          <Link className="px-3 text-slate-700 hover:text-slate-900" href="/shop">Shop</Link>
          <Link className="px-3 text-slate-700 hover:text-slate-900" href="/contact">Contact</Link>
          <Link href="/donate" className="ml-3 inline-block bg-primary text-white px-3 py-2 rounded">Donate</Link>
          <Link href="/contact" className="ml-3 inline-block bg-primary text-white px-3 py-2 rounded">Book appointment</Link>
        </nav>
      </div>
    </header>
  )
}

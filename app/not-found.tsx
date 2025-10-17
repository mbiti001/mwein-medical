import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-16 text-center">
      <div className="card space-y-6">
        <span className="badge mx-auto w-max">404 · Page not found</span>
        <h1 className="text-3xl sm:text-4xl">We couldn’t locate that page</h1>
        <p className="text-slate-600">
          The link you followed may be outdated or the page might have moved. We’re here 24/7—use the quick links below or contact the triage team for immediate help.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link href="/" className="btn-primary justify-center">
            Go to homepage
          </Link>
          <Link href="/services" className="btn-outline justify-center">
            Explore services
          </Link>
          <Link href="/donate" className="btn-outline justify-center">
            Support our work
          </Link>
          <Link href="/contact" className="btn-outline justify-center">
            Contact the clinic
          </Link>
        </div>
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-left text-sm text-slate-600">
          <p className="font-semibold text-primary">Need urgent assistance?</p>
          <p className="mt-1">
            Call <a className="text-primary" href="tel:+254707711888">+254 707 711 888</a> or WhatsApp{' '}
            <a className="text-primary" href="https://wa.me/254707711888">+254 707 711 888</a> and our on-call clinician will coordinate the right support.
          </p>
        </div>
      </div>
    </main>
  )
}

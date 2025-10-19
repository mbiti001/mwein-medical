import Link from 'next/link'
import { ArrowLeft, ShieldAlert } from 'lucide-react'

import { AntifraudDeskForm } from '../../components/AntifraudDeskForm'
import { buildPageMetadata } from '../../lib/metadata'

export const metadata = buildPageMetadata({
	title: 'Antifraud desk',
	description: 'Confidentially report suspected staff fraud or misconduct so the admin team can investigate.',
	path: '/antifraud'
})

export default function AntifraudDeskPage() {
	return (
		<section className="min-h-screen bg-slate-950 py-16 text-slate-50">
			<div className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-4 sm:px-6">
				<header className="space-y-6">
					<Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-white">
						<ArrowLeft className="h-4 w-4" />
						Back to home
					</Link>
					<div className="flex items-center gap-3">
						<span className="inline-flex items-center gap-2 rounded-full bg-red-500/10 px-4 py-1 text-sm font-semibold text-red-200">
							<ShieldAlert className="h-4 w-4" />
							Antifraud desk
						</span>
						<span className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-wide text-slate-300">Confidential</span>
					</div>
					<div className="space-y-4">
						<h1 className="text-3xl font-semibold sm:text-4xl">Report suspected staff fraud or misconduct</h1>
						<p className="max-w-3xl text-base text-slate-300">
							Use this form if you suspect cash or a phone transfer won&apos;t reach the accounts department. Provide the exact amount, name, date, and reason you were told to pay via phone.
						</p>
						<div className="rounded-2xl border border-white/5 bg-white/5 p-6 text-sm text-slate-200 shadow-lg">
							<p className="font-medium text-white">Use this channel responsibly:</p>
							<ul className="mt-3 space-y-2 list-disc pl-5">
								<li>Share only genuine concerns so investigators can prioritise urgent issues.</li>
								<li>Quote the exact amount, the staff member or clinician, and the date of the transaction.</li>
								<li>Attach evidence or describe it clearly so the admin team can verify fast.</li>
							</ul>
						</div>
					</div>
				</header>

				<AntifraudDeskForm />
			</div>
		</section>
	)
}

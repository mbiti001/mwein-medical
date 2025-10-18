import { redirect } from 'next/navigation'

import { prisma } from '../../../lib/prisma'
import { buildPageMetadata } from '../../../lib/metadata'
import { getAuthenticatedAdmin, hasRequiredRole } from '../../../lib/authServer'
import type { AdminRole } from '../../../lib/auth'

export const metadata = buildPageMetadata({
	title: 'Visitor feedback insights',
	description: 'See what visitors searched for before leaving and how often they found answers.',
	path: '/dashboard/feedback'
})

function formatDate(value: Date) {
	return new Intl.DateTimeFormat('en-KE', {
		dateStyle: 'medium',
		timeStyle: 'short'
	}).format(value)
}

async function getFeedbackData() {
	const [total, foundCount, notFoundCount, otherCount, recentNeeds, pathBreakdown] = await Promise.all([
		prisma.exitFeedback.count(),
		prisma.exitFeedback.count({ where: { outcome: 'FOUND' } }),
		prisma.exitFeedback.count({ where: { outcome: 'NOT_FOUND' } }),
		prisma.exitFeedback.count({ where: { outcome: 'OTHER' } }),
		prisma.exitFeedback.findMany({
			where: { explanation: { not: null } },
			orderBy: [{ createdAt: 'desc' }],
			take: 20
		}),
		prisma.exitFeedback.groupBy({
			by: ['pagePath'],
			where: { pagePath: { not: null } },
			_count: { pagePath: true }
		})
	])

	const stillLookingCount = notFoundCount + otherCount
	const satisfactionRate = total > 0 ? Math.round((foundCount / total) * 100) : 0
	const unresolvedRate = total > 0 ? Math.round((stillLookingCount / total) * 100) : 0

	const topPaths = pathBreakdown
		.map((row) => ({
			pagePath: row.pagePath ?? 'Unknown',
			count: typeof row._count.pagePath === 'number' ? row._count.pagePath : 0
		}))
		.sort((a, b) => b.count - a.count)
		.slice(0, 5)

	return {
		total,
		foundCount,
		stillLookingCount,
		satisfactionRate,
		unresolvedRate,
		recentNeeds,
		pathBreakdown: topPaths
	}
}

const outcomeLabels: Record<string, string> = {
	FOUND: 'Found it',
	NOT_FOUND: 'Still looking',
	OTHER: 'Other'
}

export default async function FeedbackDashboard() {
	const admin = await getAuthenticatedAdmin()
	const allowedRoles: AdminRole[] = ['ADMIN', 'PHARMACY', 'CLINIC']

	if (!admin || !hasRequiredRole(admin, allowedRoles)) {
		redirect('/dashboard')
	}

	const {
		total,
		foundCount,
		stillLookingCount,
		satisfactionRate,
		unresolvedRate,
		recentNeeds,
		pathBreakdown
	} = await getFeedbackData()

	const foundWidth = total > 0 ? (foundCount / total) * 100 : 0
	const stillWidth = total > 0 ? 100 - foundWidth : 0

	return (
		<div className="space-y-10">
			<section className="section-spacing rounded-3xl bg-gradient-to-r from-slate-900 via-primary to-primary-dark text-white">
				<div className="space-y-3">
					<span className="badge bg-white/15 text-white">Visitor feedback</span>
					<h1 className="text-3xl font-semibold">How exits trend across the site</h1>
					<p className="text-sm text-white/80">
						Quick snapshot of who found the answers they needed before leaving versus who requested more help.
					</p>
				</div>
				<div className="mt-8 grid gap-4 sm:grid-cols-3">
					<div className="rounded-2xl border border-white/20 bg-white/10 p-5">
						<p className="text-xs uppercase tracking-wide text-white/70">Total exit surveys</p>
						<p className="mt-2 text-4xl font-semibold">{total}</p>
						<p className="text-xs text-white/70">Across all pages</p>
					</div>
					<div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/15 p-5">
						<p className="text-xs uppercase tracking-wide text-emerald-100">Found what they needed</p>
						<p className="mt-2 text-4xl font-semibold text-white">{foundCount}</p>
						<p className="text-xs text-emerald-100">{satisfactionRate}% of surveyed visitors</p>
					</div>
					<div className="rounded-2xl border border-amber-400/30 bg-amber-400/15 p-5">
						<p className="text-xs uppercase tracking-wide text-amber-100">Still looking for info</p>
						<p className="mt-2 text-4xl font-semibold text-white">{stillLookingCount}</p>
						<p className="text-xs text-amber-100">{unresolvedRate}% may need follow-up</p>
					</div>
				</div>
				<div className="mt-8 space-y-3">
					<div className="flex items-center justify-between text-xs uppercase tracking-wide text-white/70">
						<span>Found answers</span>
						<span>Still looking</span>
					</div>
					<div className="h-3 w-full overflow-hidden rounded-full bg-white/15">
						<div
							className="h-full bg-emerald-400"
							style={{ width: total > 0 ? `${foundWidth}%` : '0%' }}
						/>
						<div
							className="h-full bg-amber-400"
							style={{ width: total > 0 ? `${stillWidth}%` : '0%' }}
						/>
					</div>
					<p className="text-xs text-white/70">
						{foundCount} visitors left satisfied while {stillLookingCount} requested more detail.
					</p>
				</div>
			</section>

			<section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
				<div className="card border-slate-800 bg-slate-950">
					<div className="flex items-center justify-between border-b border-slate-800 pb-4">
						<div>
							<h2 className="text-xl font-semibold text-white">What visitors asked for</h2>
							<p className="text-sm text-slate-400">Latest notes from people who couldn’t find information before leaving.</p>
						</div>
						<span className="text-xs text-slate-500">{recentNeeds.length} recent insights</span>
					</div>
					{recentNeeds.length === 0 ? (
						<p className="py-10 text-center text-sm text-slate-500">No open-ended feedback captured yet.</p>
					) : (
						<ul className="divide-y divide-slate-800">
							{recentNeeds.map((item) => (
								<li key={item.id} className="space-y-2 px-4 py-5">
									<div className="flex flex-wrap items-center justify-between gap-3">
										<span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
											item.outcome === 'FOUND'
												? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200'
												: 'border-amber-400/40 bg-amber-400/10 text-amber-200'
										}`}>{outcomeLabels[item.outcome] ?? item.outcome}</span>
										<span className="text-xs text-slate-500">{formatDate(item.createdAt)}</span>
									</div>
									{item.explanation && (
										<p className="text-sm text-slate-200">{item.explanation}</p>
									)}
									<div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
										{item.pagePath && <span>Page: {item.pagePath}</span>}
										{item.email && <span>Requested follow-up: {item.email}</span>}
									</div>
								</li>
							))}
						</ul>
					)}
				</div>
				<div className="card border-slate-800 bg-slate-950">
					<h2 className="text-lg font-semibold text-white">Where exits happen most</h2>
					<p className="text-sm text-slate-400">Top pages triggering the survey in the last sample.</p>
					{pathBreakdown.length === 0 ? (
						<p className="mt-6 text-sm text-slate-500">Not enough data yet.</p>
					) : (
						<ul className="mt-6 space-y-3 text-sm text-slate-300">
							{pathBreakdown.map((row) => (
								<li key={row.pagePath} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
									<p className="font-semibold text-white">{row.pagePath}</p>
									<p className="text-xs text-slate-500">{row.count} survey{row.count === 1 ? '' : 's'} triggered</p>
								</li>
							))}
						</ul>
					)}
				</div>
			</section>
		</div>
	)
}

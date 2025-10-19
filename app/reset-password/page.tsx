import { Suspense } from 'react'
import ResetPasswordContent from './ResetPasswordContent'

function ResetPasswordLoading() {
  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-16">
      <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900/60 p-8 shadow-2xl backdrop-blur">
        <div className="text-center text-slate-200">
          <p className="text-sm">Preparing your secure reset link…</p>
        </div>
      </div>
    </section>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordLoading />}>
      <ResetPasswordContent />
    </Suspense>
  )
}

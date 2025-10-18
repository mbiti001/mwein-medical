'use client'

import { useMemo, useState } from 'react'

const QUESTIONS = [
  'Little interest or pleasure in doing things',
  'Feeling down, depressed, or hopeless',
  'Trouble falling or staying asleep, or sleeping too much',
  'Feeling tired or having little energy',
  'Poor appetite or overeating',
  'Feeling bad about yourself — or that you are a failure or have let yourself or your family down',
  'Trouble concentrating on things, such as reading the newspaper or watching television',
  'Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual',
  'Thoughts that you would be better off dead or of hurting yourself in some way'
] as const

const RESPONSE_OPTIONS = [
  { label: 'Not at all', value: 0 },
  { label: 'Several days', value: 1 },
  { label: 'More than half the days', value: 2 },
  { label: 'Nearly every day', value: 3 }
] as const

const SEVERITY_BANDS = [
  { max: 4, label: 'Minimal depression', guidance: 'Maintain healthy routines and keep monitoring.' },
  { max: 9, label: 'Mild depression', guidance: 'Share with your clinician; counselling strategies may help.' },
  { max: 14, label: 'Moderate depression', guidance: 'Discuss treatment options and follow-up schedule with the clinician.' },
  { max: 19, label: 'Moderately severe depression', guidance: 'Prioritise a mental health review. Medication or referral may be required.' },
  { max: 27, label: 'Severe depression', guidance: 'Seek urgent comprehensive assessment and safety planning.' }
] as const

function getSeverity(total: number) {
  return SEVERITY_BANDS.find(band => total <= band.max) ?? SEVERITY_BANDS[SEVERITY_BANDS.length - 1]
}

export default function Phq9Assessment() {
  const [responses, setResponses] = useState<number[]>(() => Array(QUESTIONS.length).fill(-1))

  const totalScore = useMemo(
    () => responses.reduce((sum, value) => sum + Math.max(0, value), 0),
    [responses]
  )

  const answeredCount = useMemo(
    () => responses.filter(value => value >= 0).length,
    [responses]
  )

  const severity = useMemo(() => getSeverity(totalScore), [totalScore])

  const resetForm = () => {
    setResponses(Array(QUESTIONS.length).fill(-1))
  }

  const handleResponseChange = (questionIndex: number, value: number) => {
    setResponses(prev => {
      const next = [...prev]
      next[questionIndex] = value
      return next
    })
  }

  return (
    <div className="space-y-5">
      <form className="space-y-4">
        {QUESTIONS.map((question, questionIndex) => (
          <fieldset key={question} className="rounded-2xl border border-slate-200 bg-white p-4">
            <legend className="text-sm font-medium text-slate-800">{questionIndex + 1}. {question}</legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {RESPONSE_OPTIONS.map(option => {
                const inputId = `phq9-q${questionIndex}-o${option.value}`
                return (
                  <label key={option.value} htmlFor={inputId} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 hover:border-primary focus-within:border-primary">
                    <input
                      id={inputId}
                      type="radio"
                      name={`phq9-${questionIndex}`}
                      value={option.value}
                      checked={responses[questionIndex] === option.value}
                      onChange={() => handleResponseChange(questionIndex, option.value)}
                      className="h-4 w-4 text-primary focus:ring-primary"
                    />
                    <span>{option.label} <span className="text-xs text-slate-500">({option.value})</span></span>
                  </label>
                )
              })}
            </div>
          </fieldset>
        ))}
      </form>

      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-wide text-primary/70">Total score</p>
            <p className="text-3xl font-semibold text-primary">{totalScore}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-primary">{severity.label}</p>
            <p className="text-xs text-primary/80 max-w-xs">{severity.guidance}</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          {answeredCount === QUESTIONS.length
            ? 'All questions completed. Share the total and any concerning answers with your clinician.'
            : `You have answered ${answeredCount} of ${QUESTIONS.length} questions. Complete the rest for an accurate score.`}
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          <button type="button" onClick={resetForm} className="btn-outline text-sm">
            Reset responses
          </button>
          <a
            className="btn-primary text-sm"
            href="mailto:mweinmedical@gmail.com?subject=Telehealth%20mental%20health%20check-in"
          >
            Email score to clinic
          </a>
        </div>
      </div>
    </div>
  )
}

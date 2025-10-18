export type CancerScreeningQuestion = {
	id: string
	type: 'breast' | 'cervical'
	prompt: string
	detail?: string
	category: 'symptom' | 'screening'
}


export const BREAST_QUESTIONS: readonly CancerScreeningQuestion[] = [
	{
		id: 'breast-lump',
		type: 'breast',
		prompt: 'Have you felt a new lump or thick area in your breast or underarm?',
		detail: 'A new lump that does not go away after your cycle needs a breast exam.',
		category: 'symptom'
	},
	{
		id: 'breast-skin',
		type: 'breast',
		prompt: 'Have you noticed skin changes on the breast, like dimpling, redness, or thickening?',
		detail: 'Skin changes can be a sign of inflammation or an underlying lump.',
		category: 'symptom'
	},
	{
		id: 'breast-nipple',
		type: 'breast',
		prompt: 'Is there nipple discharge (especially blood) when you are not breastfeeding?',
		detail: 'Unexpected nipple discharge should be reviewed by a clinician.',
		category: 'symptom'
	},
	{
		id: 'breast-shape',
		type: 'breast',
		prompt: 'Has the nipple pulled inward or has the breast shape changed recently?',
		detail: 'New pulling or changes in shape need a breast check.',
		category: 'symptom'
	},
	{
		id: 'breast-pain',
		type: 'breast',
		prompt: 'Do you have breast pain that does not settle after your menstrual cycle?',
		detail: 'Long-lasting pain should be checked, especially if on one side.',
		category: 'symptom'
	}
] as const

export const CERVICAL_QUESTIONS: readonly CancerScreeningQuestion[] = [
	{
		id: 'cervical-bleeding',
		type: 'cervical',
		prompt: 'Have you had bleeding between periods, after sex, or after menopause?',
		detail: 'Unexpected bleeding can be a sign that needs a cervical exam.',
		category: 'symptom'
	},
	{
		id: 'cervical-discharge',
		type: 'cervical',
		prompt: 'Do you have a change in vaginal discharge, especially with blood or a strong smell?',
		detail: 'New discharge with blood or smell should be reviewed.',
		category: 'symptom'
	},
	{
		id: 'cervical-pain',
		type: 'cervical',
		prompt: 'Do you feel pelvic pain or pain during sex that is new for you?',
		detail: 'Persistent pelvic or deep pain should be checked by a clinician.',
		category: 'symptom'
	},
	{
		id: 'cervical-history',
		type: 'cervical',
		prompt: 'Have you ever had an abnormal Pap or HPV result without a follow-up?',
		detail: 'Past abnormal results need follow-up testing to stay safe.',
		category: 'screening'
	},
	{
		id: 'cervical-overdue',
		type: 'cervical',
		prompt: 'Has it been more than three years since your last cervical screening (Pap or HPV test)?',
		detail: 'Regular screening finds changes early, even without symptoms.',
		category: 'screening'
	}
] as const

export type CancerScreeningAnswer = 'yes' | 'no'

export type ScreeningSummary = {
	type: 'breast' | 'cervical'
	totalQuestions: number
	answers: Record<string, CancerScreeningAnswer | undefined>
	positives: string[]
	needsEvaluation: boolean
	recommendation: string
}

const BREAST_RECOMMENDATIONS = {
	clear: 'No warning signs were noted. Keep doing monthly self-breast checks and book routine screening as advised by your clinician.',
	positive: 'Please book a breast examination with our team as soon as you can. If you live far away, visit a trusted clinic nearby and let us know how it goes so we can keep supporting you.'
}

const CERVICAL_RECOMMENDATIONS = {
	clear: 'No warning signs were noted. Keep up with routine cervical screening every three years or as advised by your clinician.',
	positive: 'Schedule a cervical screening with our clinic so we can evaluate these findings. If distance is a challenge, please visit the nearest facility for a Pap or HPV test and tell us if you need more help.'
}

export function buildScreeningSummary(
	type: 'breast' | 'cervical',
	questions: readonly CancerScreeningQuestion[],
	answers: Record<string, CancerScreeningAnswer | undefined>
): ScreeningSummary {
	const positives = questions
		.filter((question) => answers[question.id] === 'yes')
		.map((question) => question.prompt)

	const needsEvaluation = positives.length > 0

	const recommendation = type === 'breast'
		? needsEvaluation
			? BREAST_RECOMMENDATIONS.positive
			: BREAST_RECOMMENDATIONS.clear
		: needsEvaluation
			? CERVICAL_RECOMMENDATIONS.positive
			: CERVICAL_RECOMMENDATIONS.clear

	return {
		type,
		totalQuestions: questions.length,
		answers,
		positives,
		needsEvaluation,
		recommendation
	}

}





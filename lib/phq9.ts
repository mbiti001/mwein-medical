export type Phq9Option = {
	value: number
	label: string
	description: string
}

export type Phq9Question = {
	id: string
	prompt: string
	context?: string
}

export const PHQ9_OPTIONS: readonly Phq9Option[] = [
	{ value: 0, label: 'Not at all', description: '0 points' },
	{ value: 1, label: 'Several days', description: '1 point' },
	{ value: 2, label: 'More than half the days', description: '2 points' },
	{ value: 3, label: 'Nearly every day', description: '3 points' }
] as const

export const PHQ9_QUESTIONS: readonly Phq9Question[] = [
	{
		id: 'interest',
		prompt: 'In the past two weeks, how often have you lost interest or pleasure in things you usually enjoy?'
	},
	{
		id: 'mood',
		prompt: 'How often have you felt sad, low, or without hope?'
	},
	{
		id: 'sleep',
		prompt: 'How often have you struggled to fall asleep, stay asleep, or slept far more than usual?'
	},
	{
		id: 'energy',
		prompt: 'How often have you felt tired or short on energy?'
	},
	{
		id: 'appetite',
		prompt: 'How often have you eaten much less or much more than usual?'
	},
	{
		id: 'self',
		prompt: 'How often have you felt bad about yourself or felt that you let yourself or your family down?'
	},
	{
		id: 'concentration',
		prompt: 'How often have you found it hard to concentrate on things like reading or watching TV?'
	},
	{
		id: 'movement',
		prompt: 'How often have you moved or spoken much slower than normal, or felt very fidgety or restless?'
	},
	{
		id: 'harm',
		prompt: 'How often have you had thoughts about hurting yourself or that you would be better off not being here?',
		context: 'If you feel unsafe, please contact someone you trust or emergency services right away.'
	}
] as const

export type Phq9Severity =
	| 'minimal'
	| 'mild'
	| 'moderate'
	| 'moderately-severe'
	| 'severe'

export type Phq9Result = {
	score: number
	severity: Phq9Severity
	isPositiveScreen: boolean
	recommendation: string
}

export function scorePhq9(responses: number[]): number {
	return responses.reduce((total, current) => total + current, 0)
}

export function interpretPhq9(score: number): Phq9Result {
	let severity: Phq9Severity = 'minimal'
	let recommendation = 'Your responses suggest minimal depressive symptoms. Please continue caring for your wellbeing and reach out if things change.'

	if (score >= 5 && score <= 9) {
		severity = 'mild'
		recommendation = 'Your responses suggest mild depressive symptoms. Consider speaking with someone you trust, maintaining supportive routines, and checking in with a clinician if symptoms persist.'
	} else if (score >= 10 && score <= 14) {
		severity = 'moderate'
		recommendation = 'Your responses suggest moderate depressive symptoms. We recommend booking a telehealth session or clinic visit to create a care plan together.'
	} else if (score >= 15 && score <= 19) {
		severity = 'moderately-severe'
		recommendation = 'Your responses suggest moderately severe symptoms. Please contact our team via telehealth or present at the clinic soon so we can support you.'
	} else if (score >= 20) {
		severity = 'severe'
		recommendation = 'Your responses suggest severe symptoms. Please reach out for immediate support—call our clinic, visit a nearby emergency department, or contact crisis services right away.'
	}

	return {
		score,
		severity,
		isPositiveScreen: score >= 10,
		recommendation
	}
}

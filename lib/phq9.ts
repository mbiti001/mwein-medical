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
		prompt: 'How often have you had little interest or pleasure in doing things?',
		context: 'This helps us notice shifts in enjoyment or motivation.'
	},
	{
		id: 'mood',
		prompt: 'How often have you been feeling down, depressed, or hopeless?',
		context: 'Your emotional tone matters and deserves attention.'
	},
	{
		id: 'sleep',
		prompt: 'How often have you had trouble falling asleep, staying asleep, or sleeping too much?',
		context: 'Sleep changes can be an important signal from your body.'
	},
	{
		id: 'energy',
		prompt: 'How often have you felt tired or had little energy?',
		context: 'Energy levels affect how you move through your day.'
	},
	{
		id: 'appetite',
		prompt: 'How often have you had a poor appetite or been overeating?',
		context: 'We look for shifts in appetite because they often accompany mood changes.'
	},
	{
		id: 'self',
		prompt: 'How often have you felt bad about yourself—or that you are a failure or have let yourself or your family down?',
		context: 'Self-judgment can be heavy, and naming it can lighten the load.'
	},
	{
		id: 'concentration',
		prompt: 'How often have you had trouble concentrating on things, such as reading or watching television?',
		context: 'Focus and attention are part of how our brain copes with stress.'
	},
	{
		id: 'movement',
		prompt: 'How often have you been moving or speaking so slowly that other people could have noticed? Or the opposite—being so fidgety or restless that you have been moving around a lot more than usual?',
		context: 'Changes in pace can be a physical sign of how you are feeling inside.'
	},
	{
		id: 'harm',
		prompt: 'How often have you had thoughts that you would be better off dead or of hurting yourself in some way?',
		context: 'If you ever feel unsafe, please reach out for immediate help.'
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

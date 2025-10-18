import { buildPageMetadata } from '../../lib/metadata'
import MentalHealthAssistant from '../../components/MentalHealthAssistant'

export const metadata = buildPageMetadata({
	title: 'Mental health check-in',
	description: 'Private, compassionate PHQ-9 screening with instant guidance and optional telehealth follow-up.'
})

export default function MentalHealthPage() {
	return <MentalHealthAssistant />
}

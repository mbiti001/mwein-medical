import { buildPageMetadata } from '../../lib/metadata'
import CancerScreeningTool from '../../components/CancerScreeningTool'

export const metadata = buildPageMetadata({
	title: 'Breast and cervical screening guide',
	description: 'Answer simple breast and cervical health questions and get clear advice on when to seek care or schedule screening.'
})

export default function CancerScreeningPage() {
	return <CancerScreeningTool />
}

import { buildPageMetadata } from '../../lib/metadata'
import DonateExperience from '../../components/DonateExperience'

export const metadata = buildPageMetadata({
  title: 'Donate',
  description: 'Support community healthcare in Mungatsi by contributing to Mwein Medical Services operations.',
  path: '/donate'
})

export default function Donate() {
  return <DonateExperience />
}

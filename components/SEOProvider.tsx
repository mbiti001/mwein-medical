'use client'

import { DefaultSeo } from 'next-seo'
import defaultSeoConfig from '../next-seo.config'

export default function SEOProvider() {
  return <DefaultSeo {...defaultSeoConfig} />
}

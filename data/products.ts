export type Restriction = 'UNRESTRICTED' | 'RESTRICTED'

export type Product = {
  id: string
  slug: string
  name: string
  description: string
  price?: number
  restriction: Restriction
}

export const products: Product[] = [
  {
    id: 'p1',
    slug: 'deep-heat-spray',
    name: 'Deep Heat Spray 150ml',
    description: 'Fast-acting menthol spray for muscle relief and sports injuries.',
    price: 900,
    restriction: 'UNRESTRICTED',
  },
  {
    id: 'p2',
    slug: 'blood-pressure-cuff',
    name: 'Digital Blood Pressure Monitor',
    description: 'Home blood pressure monitor for routine checks.',
    price: 3500,
    restriction: 'UNRESTRICTED',
  },
  {
    id: 'p3',
    slug: 'antibiotic-xyz',
    name: 'Antibiotic XYZ (Prescription)',
    description: 'Prescription medicine — enquiry only.',
    restriction: 'RESTRICTED',
  },
  {
    id: 'p4',
    slug: 'glucometer-strips',
    name: 'Glucometer Test Strips (Pack)',
    description: 'Test strips for glucose monitoring (OTC).',
    price: 800,
    restriction: 'UNRESTRICTED',
  },
  {
    id: 'p5',
    slug: 'zkteco-fingerprint-scanner',
    name: 'ZKTeco Fingerprint Scanner Bundle',
    description: 'Includes biometric scanner, parcel delivery, and on-call tech support for setup.',
    price: 9000,
    restriction: 'UNRESTRICTED',
  }
]

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
    slug: 'paracetamol-500mg',
    name: 'Paracetamol 500mg (Pack)',
    description: 'Pain relief and fever reducer. OTC.' ,
    price: 120,
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
  }
]

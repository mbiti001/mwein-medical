'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Appointment = {
  id: string
  name: string
  email: string
  phone: string
  reason: string
  status: string
  createdAt: string
}

type Payment = {
  id: string
  phoneE164: string
  amountCents: number
  status: string
  createdAt: string
}

type Donation = {
  id: string
  name: string
  amountCents: number
  payment: Payment
  createdAt: string
}

export default function Dashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [donations, setDonations] = useState<Donation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [apptRes, payRes, donRes] = await Promise.all([
          fetch('/api/appointments'),
          fetch('/api/payments'),
          fetch('/api/donations')
        ])
        if (apptRes.status === 401 || payRes.status === 401 || donRes.status === 401) {
          router.push('/login')
          return
        }
        if (apptRes.ok) setAppointments(await apptRes.json())
        if (payRes.ok) setPayments(await payRes.json())
        if (donRes.ok) setDonations(await donRes.json())
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [router])

  if (loading) return <div className="p-8">Loading...</div>

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'appointments', label: 'Appointments' },
    { id: 'payments', label: 'Payments' },
    { id: 'supporters', label: 'Supporters' }
  ]

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <div className="flex space-x-4 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded ${activeTab === tab.id ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {activeTab === 'overview' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded shadow">
              <h3 className="font-bold">Total Appointments</h3>
              <p className="text-2xl">{appointments.length}</p>
            </div>
            <div className="bg-white p-4 rounded shadow">
              <h3 className="font-bold">Total Payments</h3>
              <p className="text-2xl">{payments.length}</p>
            </div>
            <div className="bg-white p-4 rounded shadow">
              <h3 className="font-bold">Total Donations</h3>
              <p className="text-2xl">{donations.length}</p>
            </div>
          </div>
        </div>
      )}
      {activeTab === 'appointments' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Recent Appointments</h2>
          <ul className="space-y-2">
            {appointments.map(a => (
              <li key={a.id} className="bg-white p-4 rounded shadow">
                {a.name} - {a.reason} - {a.status}
              </li>
            ))}
          </ul>
        </div>
      )}
      {activeTab === 'payments' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Recent Payments</h2>
          <ul className="space-y-2">
            {payments.map(p => (
              <li key={p.id} className="bg-white p-4 rounded shadow">
                {p.phoneE164} - {(p.amountCents / 100).toFixed(2)} KES - {p.status}
              </li>
            ))}
          </ul>
        </div>
      )}
      {activeTab === 'supporters' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Recent Donations</h2>
          <ul className="space-y-2">
            {donations.map(d => (
              <li key={d.id} className="bg-white p-4 rounded shadow">
                {d.name} - {(d.amountCents / 100).toFixed(2)} KES
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
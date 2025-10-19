'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function TestLoginPage() {
  const router = useRouter()
  const [status, setStatus] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const testLogin = async () => {
    setIsLoading(true)
    setStatus('Testing login...')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'admin@mweinmedical.co.ke',
          password: 'AdminPassword123!'
        })
      })

      const data = await response.text()
      setStatus(`Response: ${response.status} - ${data}`)

      if (response.ok) {
        setStatus('Login successful! Redirecting...')
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 1000)
      }
    } catch (error) {
      setStatus(`Error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Login Test</h1>
        
        <div className="space-y-4">
          <button
            onClick={testLogin}
            disabled={isLoading}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white py-2 px-4 rounded transition-colors"
          >
            {isLoading ? 'Testing...' : 'Test Login'}
          </button>
          
          {status && (
            <div className="p-3 bg-gray-100 rounded text-sm">
              <pre>{status}</pre>
            </div>
          )}

          <div className="text-xs text-gray-500">
            <p>Test credentials:</p>
            <p>Email: admin@mweinmedical.co.ke</p>
            <p>Password: AdminPassword123!</p>
          </div>
        </div>
      </div>
    </div>
  )
}
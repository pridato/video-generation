'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ROUTES } from '@/lib/constants'

export function Navbar() {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push(ROUTES.HOME)
  }

  return (
    <nav className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href={ROUTES.HOME} className="text-xl font-bold">
              VideoGen SaaS
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link 
              href={ROUTES.DASHBOARD}
              className="text-gray-700 hover:text-gray-900"
            >
              Dashboard
            </Link>
            <Link 
              href={ROUTES.PRICING}
              className="text-gray-700 hover:text-gray-900"
            >
              Pricing
            </Link>
            <Link 
              href={ROUTES.PROFILE}
              className="text-gray-700 hover:text-gray-900"
            >
              Profile
            </Link>
            <button
              onClick={handleSignOut}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ROUTES } from '@/lib/constants'
import { Navbar } from '@/components/layout/navbar'

export default async function DashboardPage() {
  const supabase = createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(ROUTES.AUTH.LOGIN)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Welcome to your Dashboard
              </h1>
              <p className="text-gray-600 mb-8">
                Start creating amazing videos with our AI-powered platform
              </p>
              <button className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700">
                Create New Video
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
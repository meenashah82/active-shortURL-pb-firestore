import { RealTimeDashboard } from "@/components/real-time-dashboard"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BarChart3 } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Purple header bar matching admin pages */}
      <div className="bg-purple-600 text-white py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-pink-500 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-semibold">Real-Time Dashboard</span>
            </div>
            <Link href="/">
              <Button
                variant="outline"
                size="sm"
                className="border-purple-300 text-white hover:bg-purple-700 hover:border-purple-400 bg-transparent"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <RealTimeDashboard />
      </main>
    </div>
  )
}

import { RealTimeDashboard } from "@/components/real-time-dashboard"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BarChart3 } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link href="/">
              <Button
                variant="outline"
                size="sm"
                className="border-purple-200 text-purple-700 hover:bg-purple-50 bg-transparent"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-purple-600" />
              <h1 className="text-2xl font-bold text-gray-900 font-inter">Real-Time Dashboard</h1>
            </div>
          </div>

          {/* Real-time Dashboard */}
          <RealTimeDashboard />
        </div>
      </div>
    </div>
  )
}

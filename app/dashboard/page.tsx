import { RealTimeDashboard } from "@/components/real-time-dashboard"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BarChart3 } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFFFFF" }}>
      {/* Purple header bar matching admin pages */}
      <div className="py-3" style={{ backgroundColor: "#833ADF", color: "#FFFFFF" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "#F22C7C" }}
              >
                <BarChart3 className="h-5 w-5" style={{ color: "#FFFFFF" }} />
              </div>
              <span className="text-lg font-semibold">Real-Time Dashboard</span>
            </div>
            <Link href="/">
              <Button
                variant="outline"
                size="sm"
                style={{
                  borderColor: "rgba(255, 255, 255, 0.3)",
                  color: "#FFFFFF",
                  backgroundColor: "transparent",
                }}
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

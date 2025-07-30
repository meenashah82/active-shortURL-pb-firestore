"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { migrateRemoveClickEvents } from "@/lib/analytics-clean"
import { CheckCircle, AlertTriangle, Loader2 } from "lucide-react"

export default function MigrateCleanClickEventsPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const runMigration = async () => {
    setIsRunning(true)
    setIsComplete(false)
    setError(null)
    setLogs([])

    try {
      addLog("🧹 Starting migration to remove clickEvents from analytics documents...")

      // Override console.log to capture migration logs
      const originalLog = console.log
      console.log = (...args) => {
        addLog(args.join(" "))
        originalLog(...args)
      }

      await migrateRemoveClickEvents()

      // Restore console.log
      console.log = originalLog

      addLog("✅ Migration completed successfully!")
      setIsComplete(true)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
      setError(errorMessage)
      addLog(`❌ Migration failed: ${errorMessage}`)
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">🧹 Remove ClickEvents Migration</CardTitle>
          <CardDescription>
            Remove redundant clickEvents arrays from analytics documents. Detailed click data will remain in
            shortcode_clicks subcollections.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>What this migration does:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>
                  • Removes the redundant <code>clickEvents</code> array from all analytics documents
                </li>
                <li>
                  • Keeps <code>totalClicks</code>, <code>createdAt</code>, and <code>lastClickAt</code> fields
                </li>
                <li>
                  • Detailed click data remains in <code>shortcode_clicks</code> subcollections
                </li>
                <li>• Reduces database storage and improves performance</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="flex gap-4">
            <Button onClick={runMigration} disabled={isRunning || isComplete} className="flex items-center gap-2">
              {isRunning && <Loader2 className="h-4 w-4 animate-spin" />}
              {isComplete ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Migration Complete
                </>
              ) : isRunning ? (
                "Running Migration..."
              ) : (
                "Start Migration"
              )}
            </Button>

            {isComplete && (
              <Button
                variant="outline"
                onClick={() => {
                  setIsComplete(false)
                  setLogs([])
                  setError(null)
                }}
              >
                Reset
              </Button>
            )}
          </div>

          {isRunning && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Migration in progress...</span>
              </div>
              <Progress value={undefined} className="w-full" />
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Migration Error:</strong> {error}
              </AlertDescription>
            </Alert>
          )}

          {isComplete && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Migration completed successfully!</strong> The clickEvents arrays have been removed from
                analytics documents. Your database is now more efficient and the redundant data has been eliminated.
              </AlertDescription>
            </Alert>
          )}

          {logs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Migration Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-100 p-3 rounded text-xs font-mono max-h-60 overflow-y-auto">
                  {logs.map((log, index) => (
                    <div key={index} className="mb-1">
                      {log}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">📋 Before Running Migration</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p>
                <strong>Current Structure:</strong>
              </p>
              <ul className="ml-4 space-y-1">
                <li>
                  • Analytics documents contain: totalClicks, createdAt, lastClickAt, <strong>clickEvents[]</strong>
                </li>
                <li>• Shortcode_clicks subcollections contain: individual click documents</li>
                <li>• Data is duplicated between analytics.clickEvents and subcollection documents</li>
              </ul>

              <p className="mt-4">
                <strong>After Migration:</strong>
              </p>
              <ul className="ml-4 space-y-1">
                <li>• Analytics documents contain: totalClicks, createdAt, lastClickAt</li>
                <li>• Shortcode_clicks subcollections contain: individual click documents (unchanged)</li>
                <li>• No data duplication - cleaner and more efficient</li>
              </ul>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}

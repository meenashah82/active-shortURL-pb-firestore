'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Download, CheckCircle, AlertCircle } from 'lucide-react'
import { restoreCollections, backupExistingData } from '@/scripts/restore-collections'

export default function RestoreCollectionsPage() {
  const [isRestoring, setIsRestoring] = useState(false)
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [restoreResult, setRestoreResult] = useState<any>(null)
  const [backupData, setBackupData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleBackup = async () => {
    setIsBackingUp(true)
    setError(null)
    
    try {
      const backup = await backupExistingData()
      setBackupData(backup)
      
      // Create downloadable backup file
      const dataStr = JSON.stringify(backup, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `firestore-backup-${new Date().toISOString().split('T')[0]}.json`
      link.click()
      URL.revokeObjectURL(url)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create backup')
    } finally {
      setIsBackingUp(false)
    }
  }

  const handleRestore = async () => {
    setIsRestoring(true)
    setError(null)
    
    try {
      const result = await restoreCollections()
      setRestoreResult(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore collections')
    } finally {
      setIsRestoring(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Database Collection Recovery</h1>
        <p className="text-muted-foreground">
          Restore missing Firestore collections and recover your URL shortener functionality.
        </p>
      </div>

      {error && (
        <Alert className="mb-6" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        {/* Backup Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Step 1: Backup Existing Data
            </CardTitle>
            <CardDescription>
              Create a backup of your current database before making any changes. This is a safety measure.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleBackup} 
              disabled={isBackingUp}
              className="w-full sm:w-auto"
            >
              {isBackingUp ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Backup...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Create & Download Backup
                </>
              )}
            </Button>
            
            {backupData && (
              <Alert className="mt-4">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Backup created successfully! Found {backupData.admins.length} admin users and {backupData.urls.length} URLs.
                  Backup file has been downloaded.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Restore Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Step 2: Restore Missing Collections
            </CardTitle>
            <CardDescription>
              This will recreate the missing 'urls' collection with sample data and restore full functionality.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-2">What this will do:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Check existing collections (admins, urls)</li>
                  <li>• Create missing 'urls' collection if needed</li>
                  <li>• Add sample URLs with proper structure</li>
                  <li>• Create clicks subcollections with placeholder documents</li>
                  <li>• Preserve all existing admin data</li>
                </ul>
              </div>
              
              <Button 
                onClick={handleRestore} 
                disabled={isRestoring}
                className="w-full sm:w-auto"
                variant="default"
              >
                {isRestoring ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Restoring Collections...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Restore Collections
                  </>
                )}
              </Button>
            </div>
            
            {restoreResult && (
              <Alert className="mt-4">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <div>
                    <p className="font-semibold">{restoreResult.message}</p>
                    <p className="text-sm mt-1">
                      Collections found: {restoreResult.details.admins} admins, {restoreResult.details.urls} URLs
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Next Steps */}
        {restoreResult && (
          <Card>
            <CardHeader>
              <CardTitle>✅ Next Steps</CardTitle>
              <CardDescription>
                Your collections have been restored. Here's what to do next:
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-primary">1.</span>
                  <span>Go to your homepage and try creating a new short URL</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-primary">2.</span>
                  <span>Visit /admin and try logging in with your admin credentials</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-primary">3.</span>
                  <span>Test the sample URLs: /sample1, /sample2, /sample3</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-primary">4.</span>
                  <span>Check analytics for the sample URLs to verify click tracking</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

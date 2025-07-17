"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Copy, ExternalLink, Trash2, History, Sparkles, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface HistoryEntry {
  shortCode: string
  shortUrl: string
  originalUrl: string
  isCustom: boolean
  createdAt: string
}

interface LinkHistoryProps {
  refreshTrigger?: number
}

export function LinkHistory({ refreshTrigger }: LinkHistoryProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const { toast } = useToast()

  const loadHistory = () => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("linkHistory")
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setHistory(parsed)
        } catch (err) {
          console.error("Error parsing history:", err)
          setHistory([])
        }
      }
    }
  }

  useEffect(() => {
    loadHistory()
  }, [refreshTrigger])

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copied!",
        description: "URL copied to clipboard",
      })
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Could not copy URL to clipboard",
        variant: "destructive",
      })
    }
  }

  const openUrl = (url: string) => {
    window.open(url, "_blank")
  }

  const deleteEntry = (shortCode: string) => {
    const updatedHistory = history.filter((entry) => entry.shortCode !== shortCode)
    setHistory(updatedHistory)
    localStorage.setItem("linkHistory", JSON.stringify(updatedHistory))
    toast({
      title: "Deleted",
      description: "Link removed from history",
    })
  }

  const clearAllHistory = () => {
    setHistory([])
    localStorage.removeItem("linkHistory")
    toast({
      title: "History cleared",
      description: "All links have been removed from history",
    })
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } catch {
      return "Unknown"
    }
  }

  if (history.length === 0) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <History className="h-5 w-5 text-gray-400" />
            Link History
          </CardTitle>
          <CardDescription>Your shortened URLs will appear here</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <History className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">No links created yet</p>
            <p className="text-gray-400 text-xs mt-1">Start by shortening your first URL above</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-blue-600" />
              Link History
              <Badge variant="secondary">{history.length}</Badge>
            </CardTitle>
            <CardDescription>Your recently created short URLs</CardDescription>
          </div>
          {history.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear all history?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all {history.length} links from your history. This action cannot be
                    undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={clearAllHistory} className="bg-red-600 hover:bg-red-700">
                    Clear All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {history.map((entry, index) => (
            <div
              key={`${entry.shortCode}-${entry.createdAt}`}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <code className="text-sm font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    /{entry.shortCode}
                  </code>
                  {entry.isCustom && (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Custom
                    </Badge>
                  )}
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    {formatDate(entry.createdAt)}
                  </div>
                </div>
                <p className="text-sm text-gray-600 truncate" title={entry.originalUrl}>
                  {entry.originalUrl}
                </p>
              </div>
              <div className="flex items-center gap-1 ml-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(entry.shortUrl)}
                  title="Copy short URL"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => openUrl(entry.shortUrl)} title="Open short URL">
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" title="Delete from history">
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete from history?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove /{entry.shortCode} from your history. The short URL will still work, but it
                        won't appear in your history anymore.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteEntry(entry.shortCode)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Copy, ExternalLink, Trash2, Clock, LinkIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
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

interface HistoryEntry {
  id: string
  shortUrl: string
  originalUrl: string
  shortCode: string
  createdAt: string
  isCustom?: boolean
}

export function LinkHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const { toast } = useToast()

  const loadHistory = () => {
    try {
      const stored = localStorage.getItem("linkHistory")
      if (stored) {
        setHistory(JSON.parse(stored))
      }
    } catch (error) {
      console.error("Failed to load history:", error)
    }
  }

  useEffect(() => {
    loadHistory()

    // Listen for history updates
    const handleHistoryUpdate = () => {
      loadHistory()
    }

    window.addEventListener("linkHistoryUpdated", handleHistoryUpdate)
    return () => {
      window.removeEventListener("linkHistoryUpdated", handleHistoryUpdate)
    }
  }, [])

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copied!",
        description: "Short URL copied to clipboard.",
      })
    } catch (error) {
      console.error("Failed to copy:", error)
      toast({
        title: "Error",
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      })
    }
  }

  const deleteEntry = (id: string) => {
    try {
      const updatedHistory = history.filter((entry) => entry.id !== id)
      setHistory(updatedHistory)
      localStorage.setItem("linkHistory", JSON.stringify(updatedHistory))

      toast({
        title: "Deleted",
        description: "Link removed from history.",
      })
    } catch (error) {
      console.error("Failed to delete entry:", error)
      toast({
        title: "Error",
        description: "Failed to delete entry.",
        variant: "destructive",
      })
    }
  }

  const clearAllHistory = () => {
    try {
      setHistory([])
      localStorage.removeItem("linkHistory")

      toast({
        title: "Cleared",
        description: "All history has been cleared.",
      })
    } catch (error) {
      console.error("Failed to clear history:", error)
      toast({
        title: "Error",
        description: "Failed to clear history.",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } catch {
      return "Unknown date"
    }
  }

  const truncateUrl = (url: string, maxLength = 50) => {
    if (url.length <= maxLength) return url
    return url.substring(0, maxLength) + "..."
  }

  if (history.length === 0) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Link History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <LinkIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No links created yet.</p>
            <p className="text-sm">Your shortened links will appear here.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Link History ({history.length})
          </CardTitle>
          {history.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  Clear All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear all history?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete all your link history.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={clearAllHistory}>Clear All</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {history.map((entry) => (
            <div key={entry.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <code className="text-sm font-mono bg-blue-50 px-2 py-1 rounded text-blue-700">
                      {entry.shortCode}
                    </code>
                    {entry.isCustom && (
                      <Badge variant="secondary" className="text-xs">
                        Custom
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">{formatDate(entry.createdAt)}</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground min-w-[60px]">Short:</span>
                      <code className="text-sm font-mono break-all">{entry.shortUrl}</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground min-w-[60px]">Original:</span>
                      <span className="text-sm text-muted-foreground break-all" title={entry.originalUrl}>
                        {truncateUrl(entry.originalUrl, 60)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(entry.shortUrl)}
                    title="Copy short URL"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(entry.shortUrl, "_blank")}
                    title="Open short URL"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" title="Delete from history">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this link?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove the link from your history. The short URL will still work.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteEntry(entry.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

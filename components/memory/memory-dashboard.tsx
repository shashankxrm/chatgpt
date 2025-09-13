"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, Brain, Clock, Star } from "lucide-react"

interface MemoryItem {
  key: string
  value: string
  importance: number
  createdAt: string
}

interface Memory {
  id: string
  conversationId: string
  summary: string
  keyPoints: MemoryItem[]
  totalTokens: number
  lastUpdated: string
  version: number
}

export function MemoryDashboard() {
  const [memories, setMemories] = useState<Memory[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCleaning, setIsCleaning] = useState(false)

  const loadMemories = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/memories')
      const data = await response.json()
      
      if (data.success) {
        setMemories(data.memories)
      }
    } catch (error) {
      console.error('Error loading memories:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const cleanupMemories = async () => {
    try {
      setIsCleaning(true)
      const response = await fetch('/api/memories/cleanup', {
        method: 'POST'
      })
      const data = await response.json()
      
      if (data.success) {
        await loadMemories() // Reload after cleanup
        alert(`Cleaned up ${data.deletedCount} old memories`)
      }
    } catch (error) {
      console.error('Error cleaning up memories:', error)
    } finally {
      setIsCleaning(false)
    }
  }

  useEffect(() => {
    loadMemories()
  }, [])

  const getImportanceColor = (importance: number) => {
    if (importance >= 8) return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    if (importance >= 6) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
    return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6" />
            Memory Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            AI conversation memory and context management
          </p>
        </div>
        <Button 
          onClick={cleanupMemories} 
          disabled={isCleaning}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Trash2 className="h-4 w-4" />
          {isCleaning ? 'Cleaning...' : 'Cleanup Old'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Memories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{memories.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Key Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {memories.reduce((total, memory) => total + memory.keyPoints.length, 0)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {memories.reduce((total, memory) => total + memory.totalTokens, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <ScrollArea className="h-[600px]">
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-gray-500">Loading memories...</div>
            </div>
          ) : memories.length === 0 ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-gray-500">No memories found</div>
            </div>
          ) : (
            memories.map((memory) => (
              <Card key={memory.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{memory.summary}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(memory.lastUpdated)}
                        <Badge variant="outline">v{memory.version}</Badge>
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">
                      {memory.keyPoints.length} points
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {memory.keyPoints.slice(0, 3).map((point, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <Badge 
                          className={`text-xs ${getImportanceColor(point.importance)}`}
                        >
                          <Star className="h-2 w-2 mr-1" />
                          {point.importance}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{point.key}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                            {point.value}
                          </div>
                        </div>
                      </div>
                    ))}
                    {memory.keyPoints.length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{memory.keyPoints.length - 3} more points
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

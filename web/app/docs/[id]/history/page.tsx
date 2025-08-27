"use client"
import useSWR from "swr"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useSession } from "next-auth/react"

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function PageHistory({ params }: { params: { id: string } }) {
  const { data: session } = useSession()
  const { data: doc } = useSWR(`/api/docs/${params.id}`, fetcher)
  const { data: revisions, mutate } = useSWR(`/api/docs/${params.id}/revisions`, fetcher)
  const router = useRouter()
  const [selectedRevision, setSelectedRevision] = useState<any>(null)
  const [isRestoring, setIsRestoring] = useState(false)

  const canRestore = session && (session.user as any)?.role !== 'GUEST'

  const handleRestore = async (revision: any) => {
    if (!confirm(`Are you sure you want to restore version ${revision.version}? This will create a new revision with the current content.`)) {
      return
    }

    setIsRestoring(true)
    try {
      await fetch(`/api/docs/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: revision.title,
          content: revision.content,
          createRevision: true
        })
      })
      
      alert('Document restored successfully!')
      router.push(`/docs/${params.id}`)
    } catch (error) {
      console.error('Failed to restore:', error)
      alert('Failed to restore document. Please try again.')
    } finally {
      setIsRestoring(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  if (!doc || !revisions) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Page History</h1>
          <p className="text-gray-600 mt-2">
            Revision history for "{doc.title}"
          </p>
        </div>
        <Link
          href={`/docs/${params.id}`}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Back to Document
        </Link>
      </div>

      {/* Current Version */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-blue-900">Current Version</h3>
            <p className="text-sm text-blue-700">
              Last updated by {doc.author?.name || doc.author?.email} on {formatDate(doc.updatedAt)}
            </p>
          </div>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            Current
          </span>
        </div>
      </div>

      {/* Revision History */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Revision History</h2>
        </div>
        
        {revisions.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            No previous revisions found.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {revisions.map((revision: any) => (
              <div key={revision.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                        v{revision.version}
                      </span>
                      <h4 className="font-medium text-gray-900">{revision.title}</h4>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      <p>
                        Edited by {revision.author?.name || revision.author?.email} on {formatDate(revision.createdAt)}
                      </p>
                      {revision.message && (
                        <p className="mt-1 italic">"{revision.message}"</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedRevision(selectedRevision?.id === revision.id ? null : revision)}
                      className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                    >
                      {selectedRevision?.id === revision.id ? 'Hide' : 'View'} Content
                    </button>
                    
                    {canRestore && (
                      <button
                        onClick={() => handleRestore(revision)}
                        disabled={isRestoring}
                        className="px-3 py-1 text-sm text-green-600 hover:text-green-800 hover:bg-green-50 rounded disabled:opacity-50"
                      >
                        {isRestoring ? 'Restoring...' : 'Restore'}
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Revision Content Preview */}
                {selectedRevision?.id === revision.id && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                    <div className="prose max-w-none">
                      <div className="text-sm text-gray-600 mb-2">Content Preview:</div>
                      <div className="bg-white p-3 rounded border">
                        {revision.content ? (
                          <pre className="text-xs text-gray-700 whitespace-pre-wrap overflow-auto max-h-64">
                            {revision.content}
                          </pre>
                        ) : (
                          <span className="text-gray-500 italic">No content</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
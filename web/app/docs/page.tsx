"use client"
import useSWR from "swr"
import Link from "next/link"
import { useState } from "react"
import { useSession } from "next-auth/react"

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function DocsPage() {
  const { data: session } = useSession()
  const { data, mutate } = useSWR<any[]>("/api/docs", fetcher)
  const [title, setTitle] = useState("")
  const [query, setQuery] = useState("")
  const { data: search } = useSWR(query ? `/api/search?q=${encodeURIComponent(query)}` : null, fetcher)
  const [isCreating, setIsCreating] = useState(false)

  const canCreate = session && (session.user as any)?.role !== 'GUEST'

  const handleCreate = async () => {
    if (!title.trim()) return
    
    setIsCreating(true)
    try {
      await fetch('/api/docs', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ title, content: '{}' }) 
      })
      setTitle("")
      mutate()
    } catch (error) {
      console.error('Failed to create document:', error)
      alert('Failed to create document. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Documentation</h1>
        <p className="text-gray-600">Browse and search through all available documentation.</p>
      </div>

      {/* Create New Document */}
      {canCreate && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New Document</h2>
          <div className="flex gap-3">
            <input
              className="input flex-1"
              placeholder="Enter document title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
            />
            <button
              className="btn bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
              onClick={handleCreate}
              disabled={isCreating || !title.trim()}
            >
              {isCreating ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Search Documents</h2>
        <div className="flex gap-3">
          <input
            className="input flex-1"
            placeholder="Search documents..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Search Results */}
      {query && search?.results && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Search Results</h2>
          <div className="space-y-4">
            {search.results.map((result: any) => (
              <div key={result.id} className="border-b border-gray-100 pb-4 last:border-b-0">
                <Link 
                  href={`/docs/${result.id}`}
                  className="text-lg font-medium text-blue-600 hover:text-blue-800 block mb-2"
                >
                  {result.title}
                </Link>
                <div 
                  className="text-sm text-gray-600"
                  dangerouslySetInnerHTML={{ __html: result.snippet }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Document List */}
      {!query && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">All Documents</h2>
          </div>
          
          {!data ? (
            <div className="p-6 text-center text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              Loading documents...
            </div>
          ) : data.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <p className="text-lg mb-2">No documents found</p>
              {canCreate && (
                <p className="text-sm">Create your first document using the form above.</p>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {data.map((doc) => (
                <div key={doc.id} className="px-6 py-4 hover:bg-gray-50">
                  <Link 
                    href={`/docs/${doc.id}`}
                    className="text-lg font-medium text-gray-900 hover:text-blue-600 block mb-1"
                  >
                    {doc.title}
                  </Link>
                  <div className="text-sm text-gray-500">
                    Last updated {new Date(doc.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
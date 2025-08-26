"use client"
import useSWR from "swr"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Editor from "@/components/Editor"
import { useRouter } from "next/navigation"

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function DocPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession()
  const { data, mutate } = useSWR(`/api/docs/${params.id}`, fetcher)
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState<any>({ type: 'doc', content: [{ type: 'paragraph' }] })
  const [originalTitle, setOriginalTitle] = useState("")
  const [originalContent, setOriginalContent] = useState<any>({ type: 'doc', content: [{ type: 'paragraph' }] })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (data) {
      setTitle(data.title)
      setOriginalTitle(data.title)
      try {
        const parsedContent = JSON.parse(data.content)
        setContent(parsedContent)
        setOriginalContent(parsedContent)
      } catch {
        const defaultContent = { type: 'doc', content: [{ type: 'paragraph' }] }
        setContent(defaultContent)
        setOriginalContent(defaultContent)
      }
    }
  }, [data])

  const canEdit = session && (session.user as any)?.role !== 'GUEST'

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    // Restore original content
    setTitle(originalTitle)
    setContent(originalContent)
    setIsEditing(false)
  }

  const handleSave = async () => {
    if (!title.trim()) return
    
    setIsSaving(true)
    try {
      await fetch(`/api/docs/${params.id}`, { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          title, 
          content: JSON.stringify(content),
          createRevision: true
        }) 
      })
      
      // Update original content
      setOriginalTitle(title)
      setOriginalContent(content)
      setIsEditing(false)
      mutate() // Refresh the data
    } catch (error) {
      console.error('Failed to save:', error)
      alert('Failed to save changes. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value)
  }

  if (!data) {
    return (
      <div className="container">
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
        <div className="flex-1">
          {isEditing ? (
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              className="text-3xl font-bold border-b-2 border-blue-500 focus:outline-none focus:border-blue-700 w-full"
              placeholder="Enter title..."
            />
          ) : (
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          )}
          
          {!isEditing && data.author && (
            <div className="text-sm text-gray-600 mt-2">
              Last edited by {data.author.name || data.author.email} on {new Date(data.updatedAt).toLocaleDateString()}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {!isEditing && canEdit && (
            <button
              onClick={handleEdit}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Edit
            </button>
          )}
          
          {!isEditing && (
            <div className="relative group">
              <button className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                ⋯
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                <div className="py-1">
                  <button
                    onClick={() => router.push(`/docs/${params.id}/history`)}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Page History
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-sm">
        <Editor
          content={content}
          onChange={setContent}
          onSave={handleSave}
          onCancel={handleCancel}
          isEditing={isEditing}
        />
      </div>

      {/* Save Status */}
      {isSaving && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
          Saving...
        </div>
      )}
    </div>
  )
}
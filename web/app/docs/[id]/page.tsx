"use client"
import useSWR from "swr"
import { useState, useEffect } from "react"
import Editor from "@/components/Editor"
import { useRouter } from "next/navigation"

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function DocPage({ params }: { params: { id: string } }) {
  const { data } = useSWR(`/api/docs/${params.id}`, fetcher)
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [content, setContent] = useState<any>({ type: 'doc', content: [{ type: 'paragraph' }] })

  useEffect(() => {
    if (data) {
      setTitle(data.title)
      try {
        setContent(JSON.parse(data.content))
      } catch {
        setContent({ type: 'doc', content: [{ type: 'paragraph' }] })
      }
    }
  }, [data])

  return (
    <div className="container">
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input className="input" value={title} onChange={e => setTitle(e.target.value)} />
        <button className="btn" onClick={async () => {
          await fetch(`/api/docs/${params.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, content: JSON.stringify(content) }) })
          router.refresh()
        }}>Save</button>
      </div>
      <div style={{ marginTop: 12 }}>
        <Editor content={content} onChange={setContent} />
      </div>
    </div>
  )
}
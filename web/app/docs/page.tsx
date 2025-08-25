"use client"
import useSWR from "swr"
import Link from "next/link"
import { useState } from "react"

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function DocsPage() {
  const { data, mutate } = useSWR<any[]>("/api/docs", fetcher)
  const [title, setTitle] = useState("")
  const [query, setQuery] = useState("")
  const { data: search } = useSWR(query ? `/api/search?q=${encodeURIComponent(query)}` : null, fetcher)

  return (
    <div className="container">
      <h2>Docs</h2>
      <div style={{ display: 'flex', gap: 8, margin: '8px 0' }}>
        <input className="input" placeholder="New title" value={title} onChange={e => setTitle(e.target.value)} />
        <button className="btn" onClick={async () => {
          if (!title) return
          await fetch('/api/docs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, content: '{}' }) })
          setTitle("")
          mutate()
        }}>Create</button>
        <input className="input" placeholder="Search..." value={query} onChange={e => setQuery(e.target.value)} />
      </div>

      {query ? (
        <div>
          <h3>Search results</h3>
          <ul>
            {search?.results?.map((r: any) => (
              <li key={r.id}>
                <Link href={`/docs/${r.id}`}>{r.title}</Link>
                <div dangerouslySetInnerHTML={{ __html: r.snippet }} />
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <ul>
          {data?.map((d) => (
            <li key={d.id}>
              <Link href={`/docs/${d.id}`}>{d.title}</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
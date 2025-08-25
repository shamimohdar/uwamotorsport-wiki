"use client"
import { signIn, signOut, useSession } from "next-auth/react"
import { useState } from "react"
import Link from "next/link"

export default function HomePage() {
  const { data: session } = useSession()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  return (
    <div className="container">
      <h1>Internal Docs</h1>
      {!session ? (
        <form onSubmit={async (e) => { e.preventDefault(); await signIn("credentials", { email, password, callbackUrl: "/docs" }) }}>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <input className="input" placeholder="email" value={email} onChange={e => setEmail(e.target.value)} />
            <input className="input" placeholder="password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
            <button className="btn" type="submit">Sign in</button>
          </div>
        </form>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div>Signed in as {session.user?.email} ({(session.user as any)?.role})</div>
          <button className="btn" onClick={() => signOut({ callbackUrl: "/" })}>Sign out</button>
          <Link className="btn" href="/docs">Go to Docs</Link>
        </div>
      )}
    </div>
  )
}
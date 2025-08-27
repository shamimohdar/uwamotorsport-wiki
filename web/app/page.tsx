"use client"
import { signIn, signOut, useSession } from "next-auth/react"
import { useState } from "react"
import Link from "next/link"

export default function HomePage() {
  const { data: session } = useSession()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSigningIn, setIsSigningIn] = useState(false)

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSigningIn(true)
    try {
      await signIn("credentials", { email, password, callbackUrl: "/docs" })
    } finally {
      setIsSigningIn(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">UWA Motorsport Wiki</h1>
          <p className="text-xl text-gray-600">Internal documentation and knowledge base</p>
        </div>

        {!session ? (
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">Sign In</h2>
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className="input w-full"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  className="input w-full"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isSigningIn}
                className="w-full btn bg-blue-600 text-white border-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSigningIn ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-blue-600">
                  {(session.user?.name || session.user?.email || 'U')[0].toUpperCase()}
                </span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Welcome back, {session.user?.name || session.user?.email}!
              </h2>
              <p className="text-gray-600">
                Role: {(session.user as any)?.role || 'User'}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/docs"
                className="btn bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
              >
                Go to Documentation
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="btn text-gray-700 hover:bg-gray-50"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}

        {!session && (
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>Access to internal documentation requires authentication.</p>
            <p className="mt-1">Contact your administrator for access credentials.</p>
          </div>
        )}
      </div>
    </div>
  )
}
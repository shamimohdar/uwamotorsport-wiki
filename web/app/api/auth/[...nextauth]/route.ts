import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

const handler = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const user = await prisma.user.findUnique({ where: { email: credentials.email } })
        if (!user) return null
        const ok = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!ok) return null
        return { id: user.id, name: user.name ?? user.email, email: user.email, role: user.role }
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // @ts-expect-error augment token
        token.role = (user as any).role || "USER"
        token.sub = (user as any).id
        token.email = (user as any).email
        token.name = (user as any).name
      }
      return token
    },
    async session({ session, token }) {
      // @ts-expect-error augment session
      session.user.role = (token as any).role || "USER"
      // @ts-expect-error set id
      session.user.id = token.sub as string
      return session
    },
  },
})

export { handler as GET, handler as POST }
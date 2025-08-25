import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"

export async function GET() {
  const docs = await prisma.doc.findMany({ orderBy: { updatedAt: "desc" }, select: { id: true, title: true, updatedAt: true } })
  return NextResponse.json(docs)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const { title, content } = body || {}
  if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 })
  const doc = await prisma.doc.create({ data: { title, content: content ?? "{}", authorId: (session.user as any).id } })
  return NextResponse.json(doc)
}
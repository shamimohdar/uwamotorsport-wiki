import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const doc = await prisma.doc.findUnique({ 
    where: { id: params.id },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  })
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(doc)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  
  const body = await req.json()
  const { title, content, createRevision } = body || {}
  
  if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 })
  
  try {
    // If revision tracking is requested, create a revision first
    if (createRevision) {
      const currentDoc = await prisma.doc.findUnique({ where: { id: params.id } })
      if (currentDoc) {
        // Get the latest version number
        const latestRevision = await prisma.revision.findFirst({
          where: { docId: params.id },
          orderBy: { version: 'desc' }
        })
        const nextVersion = (latestRevision?.version || 0) + 1
        
        // Create revision
        await prisma.revision.create({
          data: {
            docId: params.id,
            title: currentDoc.title,
            content: currentDoc.content,
            authorId: (session.user as any).id,
            version: nextVersion
          }
        })
      }
    }
    
    // Update the document
    const doc = await prisma.doc.update({ 
      where: { id: params.id }, 
      data: { 
        title, 
        content,
        authorId: (session.user as any).id
      } 
    })
    
    return NextResponse.json(doc)
  } catch (error) {
    console.error('Failed to update document:', error)
    return NextResponse.json({ error: "Failed to update document" }, { status: 500 })
  }
}
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const revisions = await prisma.revision.findMany({
      where: { docId: params.id },
      orderBy: { version: 'desc' },
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
    
    return NextResponse.json(revisions)
  } catch (error) {
    console.error('Failed to fetch revisions:', error)
    return NextResponse.json({ error: "Failed to fetch revisions" }, { status: 500 })
  }
}
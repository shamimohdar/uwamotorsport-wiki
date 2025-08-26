import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q")?.trim()
  if (!q) return NextResponse.json({ results: [] })

  // Use raw SQL to query FTS5
  const results = await prisma.$queryRawUnsafe<Array<{ id: string; title: string; snippet: string }>>(
    `SELECT d.id as id, d.title as title,
            snippet(DocSearch, 2, '<mark>', '</mark>', '...', 10) as snippet
     FROM DocSearch ds
     JOIN Doc d ON d.id = ds.docId
     WHERE DocSearch MATCH ?
     ORDER BY rank
     LIMIT 20`,
    q
  )

  return NextResponse.json({ results })
}
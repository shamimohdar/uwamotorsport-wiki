require('ts-node/register/transpile-only')
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  await prisma.$executeRawUnsafe(`CREATE VIRTUAL TABLE IF NOT EXISTS DocSearch USING fts5(
    docId UNINDEXED,
    title,
    content,
    tokenize = 'porter'
  )`)

  await prisma.$executeRawUnsafe(`CREATE TRIGGER IF NOT EXISTS doc_ai AFTER INSERT ON Doc BEGIN
    INSERT INTO DocSearch(rowid, docId, title, content)
    VALUES (new.rowid, new.id, new.title, new.content);
  END;`)

  await prisma.$executeRawUnsafe(`CREATE TRIGGER IF NOT EXISTS doc_ad AFTER DELETE ON Doc BEGIN
    INSERT INTO DocSearch(DocSearch, rowid, docId, title, content)
    VALUES ('delete', old.rowid, old.id, old.title, old.content);
  END;`)

  await prisma.$executeRawUnsafe(`CREATE TRIGGER IF NOT EXISTS doc_au AFTER UPDATE ON Doc BEGIN
    INSERT INTO DocSearch(DocSearch, rowid, docId, title, content)
    VALUES ('delete', old.rowid, old.id, old.title, old.content);
    INSERT INTO DocSearch(rowid, docId, title, content)
    VALUES (new.rowid, new.id, new.title, new.content);
  END;`)

  console.log("FTS5 initialized")
}

main().catch((e: any) => { console.error(e); process.exit(1) }).finally(async () => { await prisma.$disconnect() })
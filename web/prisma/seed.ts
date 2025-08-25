// Seed admin user and a sample doc
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function main() {
  const email = 'admin@example.com'
  const password = 'admin123'
  const passwordHash = await bcrypt.hash(password, 10)

  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name: 'Admin', role: 'ADMIN', passwordHash },
  })

  await prisma.doc.upsert({
    where: { id: 'sample-doc' },
    update: {},
    create: {
      id: 'sample-doc',
      title: 'Welcome',
      content: JSON.stringify({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Edit me with TipTap!' }] }] }),
      authorId: admin.id,
    },
  })

  console.log('Seeded admin@example.com / admin123 and sample doc')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
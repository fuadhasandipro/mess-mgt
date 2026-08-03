import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  const mess = await prisma.mess.create({
    data: {
      name: 'Test Mess',
    },
  })

  const passwordHash = await bcrypt.hash('admin1234', 10)

  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      name: 'Admin User',
      passwordHash,
      role: 'ADMIN',
      messId: mess.id,
    },
  })

  console.log({ mess, admin })
  console.log('Seeding successful!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })

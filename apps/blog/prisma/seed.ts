import prisma from "../src/services/prisma"

const main = async () => {
  try {
    await prisma.user.deleteMany()
    console.log("Deleted records in user table")

    await prisma.account.deleteMany()
    console.log("Deleted records in account table")

    const user = await prisma.user.create({
      data: {
        name: "Seed User",
        email: "seed@test.com",
      },
    })
    console.log("Added user data")

    await prisma.account.create({
      data: {
        type: "seed",
        provider: "seed",
        providerAccountId: "seed-id",
        userId: user.id,
      },
    })
    console.log("Added account data")
  } catch (e) {
    console.error(e)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

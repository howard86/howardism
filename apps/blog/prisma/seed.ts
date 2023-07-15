import prisma from "../src/services/prisma"

const main = async () => {
  try {
    const [existedUser, existedAccount] = await Promise.all([
      prisma.user.findFirst(),
      prisma.account.findFirst(),
    ])

    if (existedUser || existedAccount) {
      console.log("Skip creating user and account")
    } else {
      const user = await prisma.user.create({
        data: {
          name: "Seed User",
          email: "seed@test.com",
        },
      })

      console.log("User created: ", user)

      const account = await prisma.account.create({
        data: {
          type: "seed",
          provider: "seed",
          providerAccountId: "seed-id",
          userId: user.id,
        },
      })

      console.log("Account created: ", account)
    }

    const existedProduct = await prisma.commerceProduct.findFirst()

    if (existedProduct) {
      console.log("Skip creating products")
    } else {
      const products = await prisma.commerceProduct.createMany({
        data: [
          {
            id: "clk496ee1000008jia9426s1z",
            title: "Sunglasses",
            price: 32.99,
            color: "Brown",
            size: "Medium",
            imageUrl:
              "https://images.unsplash.com/photo-1658690299170-bf1c6f8e312f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxjb2xsZWN0aW9uLXBhZ2V8MnxPbTZONXJyV2Jia3x8ZW58MHx8fHx8&auto=format&fit=crop&w=160&h=160&q=60",
            imageAlt: "Brown Sunglasses",
          },
          {
            id: "clk49c27f000108ji35fm5crr",
            title: "Fashion Jumper",
            price: 58,
            color: "Black",
            size: "Large",
            imageUrl:
              "https://images.unsplash.com/photo-1639926784590-ff2ef4757bf3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxjb2xsZWN0aW9uLXBhZ2V8MTN8T202TjVycldiYmt8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=160&h=160&q=60",
            imageAlt: "Black Fashion Jumper",
          },
          {
            id: "clk49c86t000208ji9prlh4b1",
            title: "Classical Vase",
            price: 24.5,
            color: "White",
            size: "Small",
            imageUrl:
              "https://images.unsplash.com/photo-1648994517762-15aae4c01ce7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxjb2xsZWN0aW9uLXBhZ2V8Nzl8T202TjVycldiYmt8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=160&h=160&q=60",
            imageAlt: "White Classical Vase",
          },
        ],
      })

      console.log(`Created ${products.count} products`)
    }
  } catch (e) {
    console.error(e)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

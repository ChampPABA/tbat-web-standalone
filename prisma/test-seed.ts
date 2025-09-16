import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Testing Prisma connection...");

  try {
    // Test connection
    await prisma.$connect();
    console.log("✅ Connected to database");

    // List available models
    const models = Object.keys(prisma).filter(
      (key) => !key.startsWith("$") && !key.startsWith("_")
    );
    console.log("Available models:", models);

    // Count existing records
    const userCount = await prisma.user.count();
    console.log(`Users in database: ${userCount}`);
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/password";

const prisma = new PrismaClient();

function getAdminSeedConfig() {
  const username = process.env.ADMIN_USERNAME?.trim().toLowerCase();
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const nickname = process.env.ADMIN_NICKNAME?.trim() || "관리자";
  const region = process.env.ADMIN_REGION?.trim() || "Seoul";

  if (!username && !email && !password) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD must be set to seed an admin in production.",
      );
    }

    return null;
  }

  if (!username || !email || !password) {
    throw new Error(
      "ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD must be set together.",
    );
  }

  if (password.length < 12) {
    throw new Error("ADMIN_PASSWORD must be at least 12 characters.");
  }

  if (
    !/[A-Za-z]/.test(password) ||
    !/[0-9]/.test(password) ||
    !/[^A-Za-z0-9]/.test(password)
  ) {
    throw new Error(
      "ADMIN_PASSWORD must include letters, numbers, and special characters.",
    );
  }

  return {
    username,
    email,
    password,
    nickname,
    region,
  };
}

async function main() {
  const adminConfig = getAdminSeedConfig();

  if (adminConfig) {
    const adminPasswordHash = await hashPassword(adminConfig.password);

    await prisma.user.upsert({
      where: { username: adminConfig.username },
      update: {},
      create: {
        username: adminConfig.username,
        email: adminConfig.email,
        passwordHash: adminPasswordHash,
        role: "ADMIN",
        profile: {
          create: {
            nickname: adminConfig.nickname,
            region: adminConfig.region,
          },
        },
      },
    });
  }

}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

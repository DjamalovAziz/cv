import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { username },
    update: { password: hashedPassword, role: Role.ADMIN },
    create: {
      username,
      password: hashedPassword,
      role: Role.ADMIN,
      profile: {
        create: {
          name: "Admin",
          title: "Full Stack Developer",
        },
      },
    },
  });

  console.log(`Admin created: ${admin.id} (username: ${admin.username})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
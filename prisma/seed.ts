import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const telegramAdminId = process.env.TELEGRAM_ADMIN_IDS?.split(",")[0] || "123456789";

  const admin = await prisma.user.upsert({
    where: { telegramId: telegramAdminId },
    update: { role: Role.ADMIN },
    create: {
      telegramId: telegramAdminId,
      role: Role.ADMIN,
      profile: {
        create: {
          name: "Admin",
          title: "Full Stack Developer",
        },
      },
    },
  });

  console.log(`Admin created: ${admin.id} (telegramId: ${admin.telegramId})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
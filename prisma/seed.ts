import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("erick2101", 12);

  const user = await prisma.user.upsert({
    where: { email: "kontakt@erickbensel.de" },
    update: {},
    create: {
      email: "kontakt@erickbensel.de",
      name: "Erick Bensel",
      password,
      role: "ADMIN",
    },
  });

  console.log("✅ Benutzer erstellt:", user.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

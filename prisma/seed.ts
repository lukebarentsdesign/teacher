import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.SEED_TEACHER_EMAIL ?? "teacher@example.com";
  const password = process.env.SEED_TEACHER_PASSWORD ?? "changeme123";
  const name = process.env.SEED_TEACHER_NAME ?? "Teacher";

  const passwordHash = await bcrypt.hash(password, 10);

  const teacher = await prisma.teacher.upsert({
    where: { email },
    update: {},
    create: { name, email, passwordHash },
  });

  console.log(`Seeded teacher: ${teacher.email} (password: ${password})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

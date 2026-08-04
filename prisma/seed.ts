import "dotenv/config";
import {PrismaClient, Role, Status} from "../generated/prisma/client.js";
import {PrismaPg} from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcrypt";

const {Pool} = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.upsert({
    where: {
      email: "admin@gmail.com",
    },
    update: {},
    create: {
      employeeId: "ADM001",
      name: "Administrator",
      email: "admin@gmail.com",
      password: adminPassword,
      department: "IT",
      phone: "081234567890",
      role: Role.ADMIN,
      status: Status.ACTIVE,
    },
  });
}

main()
  .catch((error) => {
    console.error("Seeder gagal:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

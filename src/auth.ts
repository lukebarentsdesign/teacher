import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { authConfig } from "@/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }

        const teacher = await prisma.teacher.findUnique({ where: { email } });
        if (!teacher) return null;

        const passwordValid = await bcrypt.compare(password, teacher.passwordHash);
        if (!passwordValid) return null;

        return { id: teacher.id, name: teacher.name, email: teacher.email };
      },
    }),
  ],
});

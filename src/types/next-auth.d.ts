import type { DefaultSession } from "next-auth";
import type { Role } from "@prisma/client";

// Augment Auth.js types with TendX role + company linkage (Build Spec 3, 7.1).
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      companyId: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
    companyId: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: Role;
    companyId: string | null;
  }
}

// next-auth v5 sources the JWT interface from @auth/core/jwt as well.
declare module "@auth/core/jwt" {
  interface JWT {
    role: Role;
    companyId: string | null;
  }
}

import { DefaultSession } from "next-auth";
import { PackageType } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      thaiName?: string;
      packageType?: PackageType;
      isUpgraded?: boolean;
      school?: string | null;
      phone?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    thaiName?: string;
    packageType?: PackageType;
    isUpgraded?: boolean;
    school?: string | null;
    phone?: string | null;
  }
}
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // Database
  DATABASE_URL: z.string().url().optional(),
  POSTGRES_PRISMA_URL: z.string().url().optional(),
  POSTGRES_URL_NON_POOLING: z.string().url().optional(),

  // Authentication
  NEXTAUTH_SECRET: z.string().min(1).optional(),
  NEXTAUTH_URL: z.string().url().optional(),

  // Payments
  STRIPE_PUBLISHABLE_KEY: z.string().startsWith("pk_").optional(),
  STRIPE_SECRET_KEY: z.string().startsWith("sk_").optional(),

  // Email
  RESEND_API_KEY: z.string().startsWith("re_").optional(),

  // Redis
  REDIS_URL: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

// Validate environment variables
const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error("❌ Invalid environment variables:");
  console.error(result.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables");
}

export const env = result.data;

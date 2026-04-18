import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().int().min(1000).max(65_535).default(4000),
  WEB_ORIGIN: z.string().url().default("http://localhost:5173"),
  COOKIE_SECRET: z
    .string()
    .min(24, "COOKIE_SECRET 는 24자 이상의 난수 문자열이어야 합니다.")
    .default("replace-this-demo-cookie-secret-before-production"),
  SESSION_TTL_MINUTES: z.coerce.number().int().min(30).max(1_440).default(180),
  COOKIE_SECURE: z
    .union([z.literal("true"), z.literal("false"), z.boolean()])
    .transform((value) => value === true || value === "true")
    .default(false),
});

export type AppEnv = z.infer<typeof envSchema>;

export const loadEnv = (): AppEnv => envSchema.parse(process.env);

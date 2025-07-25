import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();
console.log("🧪 Supabase DB URL:", process.env.SUPABASE_DB_URL);

if (!process.env.SUPABASE_DB_URL) {
  throw new Error("Missing SUPABASE_DB_URL. Please define it in your .env file.");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.SUPABASE_DB_URL!,
  },
});
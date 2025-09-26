import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "@shared/schema";

// Use SUPABASE_DATABASE_URL first to avoid pooler DNS issues
const databaseUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("SUPABASE_DATABASE_URL or DATABASE_URL must be set");
}

// Create the database connection with better error handling
const sql = neon(databaseUrl);
export const db = drizzle(sql, { 
  schema,
  logger: false  // Disable logging to reduce noise
});
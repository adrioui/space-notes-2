import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "@shared/schema";

// Use DATABASE_URL first since pooler connection has DNS issues
const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL or SUPABASE_DATABASE_URL must be set");
}

// Create the database connection with better error handling
const sql = neon(databaseUrl);
export const db = drizzle(sql, { 
  schema,
  logger: false  // Disable logging to reduce noise
});
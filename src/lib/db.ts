import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@shared/schema";

// Use SUPABASE_DATABASE_URL first for better compatibility with Supabase
const databaseUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL or SUPABASE_DATABASE_URL must be set");
}

// Vercel-optimized database connection configuration
const isVercel = process.env.VERCEL === '1';

const sql = postgres(databaseUrl, {
  // Optimize for Vercel serverless functions
  max: isVercel ? 1 : 10, // Single connection per serverless function
  idle_timeout: isVercel ? 20 : 60, // Shorter timeout for serverless
  connect_timeout: isVercel ? 5 : 10, // Faster connection timeout
  // Disable prepared statements for better Vercel compatibility
  prepare: false,
  // Enable connection pooling
  connection: {
    application_name: isVercel ? 'vercel-serverless' : 'local-dev',
  },
});

export const db = drizzle(sql, {
  schema,
  logger: process.env.NODE_ENV === 'development' // Only log in development
});
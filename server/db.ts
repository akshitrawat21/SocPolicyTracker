import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "@shared/schema";
import dotenv from "dotenv";

dotenv.config(); // Load .env variables for local/dev environments

neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL must be set. Check your .env file.");
}

export const pool = new Pool({ connectionString });
export const db = drizzle({ client: pool, schema });

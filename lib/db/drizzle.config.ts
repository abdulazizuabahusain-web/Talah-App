import { defineConfig } from "drizzle-kit";
import path from "path";

const isGenerateCommand = process.argv.some((arg) => arg.includes("generate"));
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl && !isGenerateCommand) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  out: path.join(__dirname, "./drizzle"),
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl ?? "postgres://localhost:5432/talah_generate_only",
  },
});

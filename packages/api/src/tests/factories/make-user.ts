import { user } from "@api/db/auth-schema";
import { InferInsertModel } from "drizzle-orm";
import { LibSQLDatabase } from "drizzle-orm/libsql";
import { randomUUID } from "node:crypto";

export async function makeUser(
  db: LibSQLDatabase,
  overrides: Partial<InferInsertModel<typeof user>> = {},
) {
  const userId = randomUUID();
  const newUser = {
    id: userId,
    name: "Test User",
    email: `${userId}@test.com`,
    emailVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
  const [createdUser] = await db.insert(user).values(newUser).returning();

  return { createdUser };
}

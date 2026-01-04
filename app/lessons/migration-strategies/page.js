import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Migration Strategies - PostgreSQL Learning',
  description: 'Learn about migration strategies including schema migrations and data migrations',
};

export default function MigrationStrategies() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Migration Strategies</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Schema Migrations</h2>

          <CodeBlock
            title="SQL: Schema Migration Patterns"
            language="sql"
            code={`-- Migration 1: Add column (safe, non-breaking)
-- Step 1: Add column as nullable
ALTER TABLE users ADD COLUMN phone TEXT;

-- Step 2: Backfill data (if needed)
UPDATE users SET phone = 'default' WHERE phone IS NULL;

-- Step 3: Add NOT NULL constraint (if needed)
ALTER TABLE users ALTER COLUMN phone SET NOT NULL;

-- Migration 2: Remove column (requires downtime)
-- Step 1: Remove column from application code
-- Step 2: Wait for deployment
-- Step 3: Remove column
ALTER TABLE users DROP COLUMN old_column;

-- Migration 3: Rename column (zero-downtime)
-- Step 1: Add new column
ALTER TABLE users ADD COLUMN new_name TEXT;

-- Step 2: Copy data
UPDATE users SET new_name = old_name;

-- Step 3: Update application to use new column
-- Step 4: Remove old column
ALTER TABLE users DROP COLUMN old_name;

-- Migration 4: Change column type (requires care)
-- Step 1: Add new column with new type
ALTER TABLE users ADD COLUMN email_new VARCHAR(255);

-- Step 2: Copy and convert data
UPDATE users SET email_new = email::VARCHAR(255);

-- Step 3: Drop old column
ALTER TABLE users DROP COLUMN email;

-- Step 4: Rename new column
ALTER TABLE users RENAME COLUMN email_new TO email;

-- Migration 5: Add index (can be done concurrently)
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);

-- Migration 6: Add foreign key (requires lock)
ALTER TABLE posts 
ADD CONSTRAINT fk_posts_user_id 
FOREIGN KEY (user_id) REFERENCES users(id);

-- Migration 7: Add unique constraint
-- Step 1: Ensure data is unique
SELECT email, COUNT(*) 
FROM users 
GROUP BY email 
HAVING COUNT(*) > 1;

-- Step 2: Remove duplicates (if any)
-- Step 3: Add unique constraint
ALTER TABLE users ADD CONSTRAINT uk_users_email UNIQUE (email);

-- Migration 8: Add check constraint
ALTER TABLE products 
ADD CONSTRAINT ck_products_price_positive 
CHECK (price > 0);`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Zero-Downtime Migrations</h2>

          <CodeBlock
            title="SQL: Zero-Downtime Migration Strategy"
            language="sql"
            code={`-- Strategy: Expand, Migrate, Contract (EMC)

-- Example: Renaming a column (zero-downtime)

-- Step 1: EXPAND - Add new column alongside old
ALTER TABLE users ADD COLUMN email_address TEXT;

-- Step 2: MIGRATE - Copy data and keep in sync
-- Application writes to both columns
UPDATE users SET email_address = email;

-- Create trigger to keep columns in sync
CREATE OR REPLACE FUNCTION sync_user_email()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.email IS DISTINCT FROM OLD.email THEN
      NEW.email_address := NEW.email;
    END IF;
    IF NEW.email_address IS DISTINCT FROM OLD.email_address THEN
      NEW.email := NEW.email_address;
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    IF NEW.email IS NOT NULL THEN
      NEW.email_address := NEW.email;
    ELSIF NEW.email_address IS NOT NULL THEN
      NEW.email := NEW.email_address;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_user_email_trigger
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION sync_user_email();

-- Step 3: Update application to read from new column
-- Step 4: Update application to write to new column only
-- Step 5: CONTRACT - Remove old column
ALTER TABLE users DROP COLUMN email;
DROP TRIGGER sync_user_email_trigger ON users;
DROP FUNCTION sync_user_email();

-- Example: Changing column type (zero-downtime)
-- Step 1: EXPAND - Add new column
ALTER TABLE users ADD COLUMN status_new INTEGER;

-- Step 2: MIGRATE - Copy and convert data
UPDATE users SET status_new = 
  CASE status
    WHEN 'active' THEN 1
    WHEN 'inactive' THEN 0
    ELSE NULL
  END;

-- Step 3: Update application
-- Step 4: CONTRACT - Remove old column
ALTER TABLE users DROP COLUMN status;
ALTER TABLE users RENAME COLUMN status_new TO status;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Data Migrations</h2>

          <CodeBlock
            title="SQL: Data Migration Patterns"
            language="sql"
            code={`-- Data migration: Backfill missing data
UPDATE users
SET phone = COALESCE(phone, 'N/A')
WHERE phone IS NULL;

-- Data migration: Transform data
UPDATE products
SET price = price * 1.1  -- 10% increase
WHERE category_id = 1;

-- Data migration: Move data between tables
INSERT INTO archived_orders (id, user_id, total, created_at)
SELECT id, user_id, total, created_at
FROM orders
WHERE created_at < CURRENT_DATE - INTERVAL '1 year';

DELETE FROM orders
WHERE created_at < CURRENT_DATE - INTERVAL '1 year';

-- Data migration: Split data
UPDATE users
SET first_name = SPLIT_PART(full_name, ' ', 1),
    last_name = SPLIT_PART(full_name, ' ', 2)
WHERE full_name IS NOT NULL;

-- Data migration: Merge data
UPDATE users u1
SET email = u2.email
FROM users u2
WHERE u1.id = u2.duplicate_of_id;

-- Data migration: Clean data
UPDATE users
SET email = LOWER(TRIM(email))
WHERE email IS NOT NULL;

-- Data migration: Validate and fix
UPDATE orders
SET status = 'completed'
WHERE status = 'done'  -- Fix typo
  AND created_at < CURRENT_DATE - INTERVAL '30 days';

-- Data migration: Batch processing (for large tables)
DO $$
DECLARE
  batch_size INTEGER := 1000;
  offset_val INTEGER := 0;
  affected_rows INTEGER;
BEGIN
  LOOP
    UPDATE users
    SET updated_at = NOW()
    WHERE id IN (
      SELECT id FROM users
      ORDER BY id
      LIMIT batch_size OFFSET offset_val
    );
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    EXIT WHEN affected_rows = 0;
    
    offset_val := offset_val + batch_size;
    COMMIT;
  END LOOP;
END $$;

-- Data migration: Using transactions
BEGIN;

-- Step 1: Validate
SELECT COUNT(*) FROM orders WHERE total < 0;
-- Should return 0

-- Step 2: Migrate
UPDATE orders
SET total = ABS(total)
WHERE total < 0;

-- Step 3: Verify
SELECT COUNT(*) FROM orders WHERE total < 0;
-- Should return 0

COMMIT;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Rollback Strategies</h2>

          <CodeBlock
            title="SQL: Rollback Patterns"
            language="sql"
            code={`-- Rollback strategy: Keep migration reversible

-- Migration: Add column
-- Forward:
ALTER TABLE users ADD COLUMN phone TEXT;

-- Rollback:
ALTER TABLE users DROP COLUMN phone;

-- Migration: Rename column
-- Forward:
ALTER TABLE users RENAME COLUMN email TO email_address;

-- Rollback:
ALTER TABLE users RENAME COLUMN email_address TO email;

-- Migration: Add index
-- Forward:
CREATE INDEX idx_users_email ON users(email);

-- Rollback:
DROP INDEX idx_users_email;

-- Migration: Add foreign key
-- Forward:
ALTER TABLE posts 
ADD CONSTRAINT fk_posts_user_id 
FOREIGN KEY (user_id) REFERENCES users(id);

-- Rollback:
ALTER TABLE posts DROP CONSTRAINT fk_posts_user_id;

-- Migration: Change column type (with rollback)
-- Forward:
ALTER TABLE users ADD COLUMN status_new INTEGER;
UPDATE users SET status_new = 
  CASE status
    WHEN 'active' THEN 1
    WHEN 'inactive' THEN 0
  END;
ALTER TABLE users DROP COLUMN status;
ALTER TABLE users RENAME COLUMN status_new TO status;

-- Rollback:
ALTER TABLE users ADD COLUMN status_old TEXT;
UPDATE users SET status_old = 
  CASE status
    WHEN 1 THEN 'active'
    WHEN 0 THEN 'inactive'
  END;
ALTER TABLE users DROP COLUMN status;
ALTER TABLE users RENAME COLUMN status_old TO status;

-- Best practice: Test rollback in staging first`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Prisma: Migration Strategies</h2>

          <CodeBlock
            title="Prisma: Migration Patterns"
            language="prisma"
            code={`// Prisma migrations

// Create migration
// npx prisma migrate dev --name add_phone_column

// Migration file structure:
// migrations/
//   20240101000000_add_phone_column/
//     migration.sql

// Example migration.sql:
ALTER TABLE "User" ADD COLUMN "phone" TEXT;

// Rollback migration (manual)
// Create new migration to reverse changes
// npx prisma migrate dev --name remove_phone_column

// Rollback migration.sql:
ALTER TABLE "User" DROP COLUMN "phone";

// Zero-downtime migration with Prisma
// Step 1: Add new column
// migration.sql:
ALTER TABLE "User" ADD COLUMN "email_address" TEXT;

// Step 2: Update Prisma schema
// schema.prisma:
model User {
  id           Int    @id @default(autoincrement())
  email        String?  // Keep old column
  emailAddress String? @map("email_address")  // New column
}

// Step 3: Update application to write to both
// Step 4: Remove old column
// migration.sql:
ALTER TABLE "User" DROP COLUMN "email";

// Data migration with Prisma
// Use raw SQL in migration
// migration.sql:
UPDATE "User" SET "phone" = 'N/A' WHERE "phone" IS NULL;

// Or use Prisma Client in migration script
// migrate.ts:
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrate() {
  await prisma.user.updateMany({
    where: { phone: null },
    data: { phone: 'N/A' }
  });
}

migrate()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

// Batch data migration
async function batchMigrate() {
  const batchSize = 1000;
  let offset = 0;
  
  while (true) {
    const users = await prisma.user.findMany({
      skip: offset,
      take: batchSize
    });
    
    if (users.length === 0) break;
    
    await prisma.user.updateMany({
      where: {
        id: { in: users.map(u => u.id) }
      },
      data: {
        updatedAt: new Date()
      }
    });
    
    offset += batchSize;
  }
}

// Apply migrations
// npx prisma migrate deploy  // Production
// npx prisma migrate dev      // Development

// Check migration status
// npx prisma migrate status

// Reset database (development only)
// npx prisma migrate reset`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Plan migrations</strong> - understand impact before executing</li>
              <li><strong>Test in staging</strong> - verify migrations work correctly</li>
              <li><strong>Use transactions</strong> - for data migrations when possible</li>
              <li><strong>Make migrations reversible</strong> - plan rollback strategy</li>
              <li><strong>Use zero-downtime patterns</strong> - for production migrations</li>
              <li><strong>Batch large migrations</strong> - process in chunks</li>
              <li><strong>Monitor migrations</strong> - check for errors and performance</li>
              <li><strong>Backup before migrations</strong> - always have a rollback plan</li>
            </ul>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}


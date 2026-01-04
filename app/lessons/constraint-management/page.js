import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Constraint Management - PostgreSQL Learning',
  description: 'Learn about managing constraints in PostgreSQL including adding, dropping, and disabling constraints',
};

export default function ConstraintManagement() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Constraint Management</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Adding Constraints</h2>

          <CodeBlock
            title="SQL: Adding Constraints"
            language="sql"
            code={`-- Add NOT NULL constraint
ALTER TABLE users ALTER COLUMN email SET NOT NULL;

-- Add UNIQUE constraint
ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);

-- Add PRIMARY KEY constraint
ALTER TABLE customers ADD PRIMARY KEY (id);

-- Add FOREIGN KEY constraint
ALTER TABLE orders 
ADD CONSTRAINT orders_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id);

-- Add CHECK constraint
ALTER TABLE products 
ADD CONSTRAINT products_price_positive CHECK (price > 0);

-- Add EXCLUDE constraint
ALTER TABLE reservations 
ADD EXCLUDE USING gist (
  room_id WITH =,
  daterange(check_in, check_out) WITH &&
);

-- Add constraint with validation (PostgreSQL 9.2+)
ALTER TABLE products 
ADD CONSTRAINT products_price_positive 
CHECK (price > 0) NOT VALID;

-- Validate constraint later
ALTER TABLE products 
VALIDATE CONSTRAINT products_price_positive;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Dropping Constraints</h2>

          <CodeBlock
            title="SQL: Dropping Constraints"
            language="sql"
            code={`-- Drop constraint by name
ALTER TABLE users DROP CONSTRAINT users_email_unique;

-- Drop constraint if exists
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_unique;

-- Drop PRIMARY KEY
ALTER TABLE customers DROP CONSTRAINT customers_pkey;

-- Drop FOREIGN KEY
ALTER TABLE orders DROP CONSTRAINT orders_user_id_fkey;

-- Drop CHECK constraint
ALTER TABLE products DROP CONSTRAINT products_price_positive;

-- Drop NOT NULL (different syntax)
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;

-- Drop multiple constraints
ALTER TABLE products 
  DROP CONSTRAINT products_price_positive,
  DROP CONSTRAINT products_stock_positive;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Viewing Constraints</h2>

          <CodeBlock
            title="SQL: Viewing Constraints"
            language="sql"
            code={`-- List all constraints on a table
SELECT 
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'users'::regclass
ORDER BY contype, conname;

-- Constraint types:
-- p = PRIMARY KEY
-- u = UNIQUE
-- f = FOREIGN KEY
-- c = CHECK
-- x = EXCLUDE
-- t = TRIGGER
-- t = TRIGGER

-- View constraints with information_schema
SELECT 
  constraint_name,
  constraint_type,
  table_name
FROM information_schema.table_constraints
WHERE table_name = 'users'
ORDER BY constraint_type, constraint_name;

-- View CHECK constraint definitions
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'products'::regclass
  AND contype = 'c';

-- View FOREIGN KEY constraints
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'orders';`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Disabling Constraints</h2>

          <CodeBlock
            title="SQL: Disabling Constraints"
            language="sql"
            code={`-- Note: CHECK and NOT NULL constraints cannot be disabled
-- FOREIGN KEY constraints can be disabled using triggers

-- Disable all triggers (affects constraint triggers)
ALTER TABLE orders DISABLE TRIGGER ALL;

-- Re-enable triggers
ALTER TABLE orders ENABLE TRIGGER ALL;

-- For CHECK constraints, use NOT VALID to add without validation
-- Then validate later
ALTER TABLE products 
ADD CONSTRAINT products_price_positive 
CHECK (price > 0) NOT VALID;

-- Insert data that might violate constraint
INSERT INTO products (name, price) VALUES ('Test', -10);  -- Allowed

-- Validate constraint (will fail if violations exist)
ALTER TABLE products VALIDATE CONSTRAINT products_price_positive;
-- Error: constraint "products_price_positive" is violated by some row

-- Fix violations first
UPDATE products SET price = 0 WHERE price < 0;

-- Then validate
ALTER TABLE products VALIDATE CONSTRAINT products_price_positive;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Renaming Constraints</h2>

          <CodeBlock
            title="SQL: Renaming Constraints"
            language="sql"
            code={`-- Rename constraint
ALTER TABLE users 
RENAME CONSTRAINT users_email_unique TO users_email_uk;

-- Rename PRIMARY KEY
ALTER TABLE customers 
RENAME CONSTRAINT customers_pkey TO customers_id_pk;

-- Rename FOREIGN KEY
ALTER TABLE orders 
RENAME CONSTRAINT orders_user_id_fkey TO orders_fk_user_id;

-- Rename CHECK constraint
ALTER TABLE products 
RENAME CONSTRAINT products_price_positive TO products_chk_price_positive;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Prisma Constraint Management</h2>

          <CodeBlock
            title="Prisma: Constraint Management"
            language="prisma"
            code={`// Prisma manages constraints through schema changes

// schema.prisma
model User {
  id    Int    @id @default(autoincrement())
  email String @unique  // Creates UNIQUE constraint
  name  String
}

// Add constraint - update schema
model Product {
  id    Int     @id @default(autoincrement())
  name  String
  price Decimal @db.Decimal(10, 2)
  
  // Add CHECK constraint via migration
  // @@map("products")
}

// Generate migration
npx prisma migrate dev --name add_check_constraint

// In migration, add raw SQL:
// ALTER TABLE products ADD CONSTRAINT products_price_positive CHECK (price > 0);

// Drop constraint - remove from schema or use raw SQL
await prisma.$executeRaw\`
  ALTER TABLE products DROP CONSTRAINT IF EXISTS products_price_positive
\`;

// View constraints
const constraints = await prisma.$queryRaw\`
  SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS definition
  FROM pg_constraint
  WHERE conrelid = 'products'::regclass
\`;`}
          />
        </section>
      </div>
    </LessonLayout>
  );
}


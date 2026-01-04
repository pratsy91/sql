import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'CREATE TABLE - PostgreSQL Learning',
  description: 'Learn about creating tables in PostgreSQL including syntax, column definitions, table options, temporary and unlogged tables',
};

export default function CreateTable() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">CREATE TABLE</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Basic Syntax</h2>

          <CodeBlock
            title="SQL: Basic CREATE TABLE"
            language="sql"
            code={`-- Basic table creation
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table with constraints
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  price DECIMAL(10, 2) CHECK (price > 0),
  stock INTEGER DEFAULT 0 CHECK (stock >= 0),
  category_id INTEGER REFERENCES categories(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table with multiple constraints
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  total DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT orders_total_positive CHECK (total > 0),
  CONSTRAINT orders_status_valid CHECK (status IN ('pending', 'completed', 'cancelled'))
);`}
          />
          <CodeBlock
            title="Prisma: CREATE TABLE"
            language="prisma"
            code={`// schema.prisma
model User {
  id        Int      @id @default(autoincrement())
  username  String   @unique @db.VarChar(50)
  email     String   @db.VarChar(100)
  createdAt DateTime @default(now()) @map("created_at")
  
  @@map("users")
}

model Product {
  id         Int      @id @default(autoincrement())
  name       String   @db.VarChar(200)
  price      Decimal  @db.Decimal(10, 2)
  stock      Int      @default(0)
  categoryId Int      @map("category_id")
  category   Category @relation(fields: [categoryId], references: [id])
  createdAt  DateTime @default(now()) @map("created_at")
  
  @@map("products")
}

// Prisma generates CREATE TABLE statements when you run migrations
npx prisma migrate dev --name init`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Table Options</h2>

          <CodeBlock
            title="SQL: Table Options"
            language="sql"
            code={`-- Create table with tablespace
CREATE TABLE large_table (
  id BIGSERIAL PRIMARY KEY,
  data TEXT
) TABLESPACE fast_ssd;

-- Create table with storage parameters
CREATE TABLE optimized_table (
  id SERIAL PRIMARY KEY,
  data TEXT
) WITH (
  fillfactor = 80,
  autovacuum_enabled = true
);

-- Create table inheriting from another
CREATE TABLE child_table (
  additional_column VARCHAR(100)
) INHERITS (parent_table);

-- Create table with LIKE (copy structure)
CREATE TABLE new_table (LIKE existing_table INCLUDING ALL);

-- Create table with partition
CREATE TABLE partitioned_table (
  id SERIAL,
  created_at DATE
) PARTITION BY RANGE (created_at);

-- View table options
SELECT 
  tablename,
  tablespace,
  hasindexes,
  hasrules,
  hastriggers
FROM pg_tables
WHERE tablename = 'optimized_table';`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Temporary Tables</h2>

          <CodeBlock
            title="SQL: Temporary Tables"
            language="sql"
            code={`-- Create temporary table (session-scoped)
CREATE TEMPORARY TABLE temp_users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100)
);

-- Or using TEMP keyword
CREATE TEMP TABLE temp_products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100)
);

-- Temporary table with ON COMMIT
CREATE TEMPORARY TABLE session_data (
  id SERIAL PRIMARY KEY,
  data TEXT
) ON COMMIT PRESERVE ROWS;  -- Keep rows after transaction

CREATE TEMPORARY TABLE transaction_data (
  id SERIAL PRIMARY KEY,
  data TEXT
) ON COMMIT DELETE ROWS;  -- Delete rows after transaction

CREATE TEMPORARY TABLE temp_data (
  id SERIAL PRIMARY KEY,
  data TEXT
) ON COMMIT DROP;  -- Drop table after transaction

-- Global temporary table (visible to all sessions)
CREATE TEMP TABLE global_temp (
  id SERIAL PRIMARY KEY,
  data TEXT
);

-- Temporary tables are automatically dropped at end of session`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Unlogged Tables</h2>
          <p className="mb-4">
            Unlogged tables don't write to WAL (Write-Ahead Log), making them faster but not crash-safe.
          </p>

          <CodeBlock
            title="SQL: Unlogged Tables"
            language="sql"
            code={`-- Create unlogged table
CREATE UNLOGGED TABLE cache_table (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) UNIQUE,
  value TEXT,
  expires_at TIMESTAMP
);

-- Unlogged tables are faster for:
-- - Temporary data
-- - Cache tables
-- - Staging tables
-- - Data that can be regenerated

-- Convert to logged table
ALTER TABLE cache_table SET LOGGED;

-- Convert back to unlogged
ALTER TABLE cache_table SET UNLOGGED;

-- Note: Unlogged tables are truncated on crash
-- Use only for data that can be regenerated`}
          />
        </section>
      </div>
    </LessonLayout>
  );
}


import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Database Fundamentals - PostgreSQL Learning',
  description: 'Learn about databases, schemas, tables, system catalogs, and naming conventions',
};

export default function DatabaseFundamentals() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Database Fundamentals</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Databases</h2>
          <p className="mb-4">
            A database in PostgreSQL is a collection of schemas, which in turn contain tables, 
            functions, and other objects. Each database is isolated from others and has its own 
            set of system catalogs.
          </p>
          
          <h3 className="text-xl font-semibold mb-3">Creating a Database</h3>
          <CodeBlock
            title="SQL: Create Database"
            language="sql"
            code={`-- Create a new database
CREATE DATABASE mydatabase;

-- Create database with specific options
CREATE DATABASE mydatabase
  WITH 
  OWNER = myuser
  ENCODING = 'UTF8'
  LC_COLLATE = 'en_US.utf8'
  LC_CTYPE = 'en_US.utf8'
  TEMPLATE = template0;

-- List all databases
\\l

-- Or using SQL
SELECT datname FROM pg_database;

-- Connect to a database
\\c mydatabase

-- Drop a database (be careful!)
DROP DATABASE mydatabase;`}
          />
          <CodeBlock
            title="Prisma: Database Creation"
            language="bash"
            code={`# Prisma automatically creates the database when you run migrations
# First, set up your schema.prisma

# Then run:
npx prisma migrate dev --name init

# This will:
# 1. Create the database if it doesn't exist
# 2. Create all tables based on your schema
# 3. Generate Prisma Client`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Schemas</h2>
          <p className="mb-4">
            A schema is a namespace that contains named objects (tables, functions, types, etc.). 
            Schemas allow you to organize database objects into logical groups. The default schema 
            is called <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">public</code>.
          </p>
          
          <h3 className="text-xl font-semibold mb-3">Creating and Using Schemas</h3>
          <CodeBlock
            title="SQL: Schema Operations"
            language="sql"
            code={`-- Create a new schema
CREATE SCHEMA myschema;

-- Create schema with authorization
CREATE SCHEMA myschema AUTHORIZATION myuser;

-- List all schemas
\\dn

-- Or using SQL
SELECT schema_name FROM information_schema.schemata;

-- Set search path (order of schema lookup)
SET search_path TO myschema, public;

-- Show current search path
SHOW search_path;

-- Create table in specific schema
CREATE TABLE myschema.users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100)
);

-- Access table with schema prefix
SELECT * FROM myschema.users;

-- Drop schema (CASCADE removes all objects in schema)
DROP SCHEMA myschema CASCADE;`}
          />
          <CodeBlock
            title="Prisma: Schema Configuration"
            language="prisma"
            code={`// schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  schemas  = ["public", "myschema"]  // Specify schemas to use
}

// Models in default public schema
model User {
  id    Int    @id @default(autoincrement())
  name  String
  email String @unique
}

// Models in custom schema
model Product {
  id          Int    @id @default(autoincrement())
  name        String
  price       Float
  
  @@schema("myschema")  // Specify schema for this model
}`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Tables</h2>
          <p className="mb-4">
            Tables are the core structure in PostgreSQL. They consist of rows (records) and columns 
            (fields). Each column has a data type that defines what kind of data it can store.
          </p>
          
          <h3 className="text-xl font-semibold mb-3">Creating Tables</h3>
          <CodeBlock
            title="SQL: Create Table"
            language="sql"
            code={`-- Basic table creation
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table with multiple constraints
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) CHECK (price > 0),
  stock INTEGER DEFAULT 0 CHECK (stock >= 0),
  category_id INTEGER REFERENCES categories(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- List all tables
\\dt

-- Or using SQL
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Describe table structure
\\d users

-- Or using SQL
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'users';

-- Drop table
DROP TABLE users CASCADE;`}
          />
          <CodeBlock
            title="Prisma: Table Definition"
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
  id          Int      @id @default(autoincrement())
  name        String   @db.VarChar(200)
  description String?  @db.Text
  price       Decimal  @db.Decimal(10, 2)
  stock       Int      @default(0)
  categoryId  Int      @map("category_id")
  category    Category @relation(fields: [categoryId], references: [id])
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  
  @@map("products")
}

model Category {
  id        Int       @id @default(autoincrement())
  name      String
  products  Product[]
  
  @@map("categories")
}`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">System Catalogs</h2>
          <p className="mb-4">
            System catalogs are special tables that store metadata about the database. They contain 
            information about tables, columns, indexes, constraints, functions, and all other database objects.
          </p>
          
          <h3 className="text-xl font-semibold mb-3">Important System Catalogs</h3>
          <CodeBlock
            title="SQL: Querying System Catalogs"
            language="sql"
            code={`-- pg_class: Stores information about tables, indexes, sequences, views
SELECT 
  relname AS table_name,
  relkind AS object_type,
  reltuples AS estimated_rows
FROM pg_class
WHERE relkind = 'r'  -- 'r' = regular table
ORDER BY relname;

-- pg_attribute: Stores information about table columns
SELECT 
  attname AS column_name,
  atttypid::regtype AS data_type,
  attnotnull AS not_null,
  atthasdef AS has_default
FROM pg_attribute
WHERE attrelid = 'users'::regclass
  AND attnum > 0
ORDER BY attnum;

-- pg_index: Stores information about indexes
SELECT 
  indexrelid::regclass AS index_name,
  indrelid::regclass AS table_name,
  indisunique AS is_unique,
  indisprimary AS is_primary
FROM pg_index
WHERE indrelid = 'users'::regclass;

-- pg_constraint: Stores information about constraints
SELECT 
  conname AS constraint_name,
  contype AS constraint_type,
  conrelid::regclass AS table_name
FROM pg_constraint
WHERE conrelid = 'users'::regclass;

-- pg_type: Stores information about data types
SELECT 
  typname AS type_name,
  typtype AS type_category,
  typcategory AS type_class
FROM pg_type
WHERE typtype = 'b'  -- 'b' = base type
ORDER BY typname;

-- pg_proc: Stores information about functions
SELECT 
  proname AS function_name,
  proargtypes::regtype[] AS argument_types,
  prorettype::regtype AS return_type
FROM pg_proc
WHERE proname LIKE 'pg_%'
ORDER BY proname
LIMIT 10;

-- pg_database: Stores information about databases
SELECT 
  datname AS database_name,
  datdba::regrole AS owner,
  encoding AS character_encoding
FROM pg_database;

-- pg_namespace: Stores information about schemas
SELECT 
  nspname AS schema_name,
  nspowner::regrole AS owner
FROM pg_namespace
WHERE nspname NOT LIKE 'pg_%'
  AND nspname != 'information_schema';

-- information_schema: Standard SQL information schema views
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

SELECT 
  column_name,
  data_type,
  character_maximum_length,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users';`}
          />
          <CodeBlock
            title="Prisma: Accessing System Information"
            language="javascript"
            code={`// Using Prisma to query system information
import { Prisma } from '@prisma/client'

// Get table names using raw SQL
const tables = await prisma.$queryRaw\`
  SELECT table_name 
  FROM information_schema.tables 
  WHERE table_schema = 'public'
\`

// Get column information
const columns = await prisma.$queryRaw\`
  SELECT 
    column_name,
    data_type,
    is_nullable
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'users'
\`

// Get database size
const dbSize = await prisma.$queryRaw\`
  SELECT pg_size_pretty(pg_database_size(current_database())) as size
\`

// Get table sizes
const tableSizes = await prisma.$queryRaw\`
  SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
\``}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Object Identifiers (OIDs)</h2>
          <p className="mb-4">
            OIDs (Object Identifiers) are unique numeric identifiers assigned to database objects. 
            While OIDs are still used internally, user tables no longer have OIDs by default in modern 
            PostgreSQL versions (since 8.1).
          </p>
          
          <h3 className="text-xl font-semibold mb-3">Understanding OIDs</h3>
          <CodeBlock
            title="SQL: Working with OIDs"
            language="sql"
            code={`-- Get OID of a table
SELECT oid, relname 
FROM pg_class 
WHERE relname = 'users';

-- Get OID of a type
SELECT oid, typname 
FROM pg_type 
WHERE typname = 'integer';

-- Get OID of a function
SELECT oid, proname 
FROM pg_proc 
WHERE proname = 'now';

-- Using regclass, regtype, regproc for OID conversion
SELECT 'users'::regclass;  -- Returns OID of users table
SELECT 'integer'::regtype; -- Returns OID of integer type
SELECT 'now'::regproc;     -- Returns OID of now function

-- Get object name from OID
SELECT pg_class.oid::regclass 
FROM pg_class 
WHERE oid = 16384;

-- Check if table has OID column (usually false in modern PostgreSQL)
SELECT relhasoids 
FROM pg_class 
WHERE relname = 'users';

-- Create table with OID (not recommended, deprecated)
CREATE TABLE old_table WITH OIDS AS 
SELECT 1 AS id, 'test' AS name;`}
          />
          <CodeBlock
            title="Prisma: OID Information"
            language="javascript"
            code={`// Prisma doesn't directly expose OIDs, but you can query them
const tableOid = await prisma.$queryRaw\`
  SELECT oid, relname 
  FROM pg_class 
  WHERE relname = 'users'
\`

// Get OID for a type
const typeOid = await prisma.$queryRaw\`
  SELECT oid, typname 
  FROM pg_type 
  WHERE typname = 'text'
\``}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Naming Conventions</h2>
          <p className="mb-4">
            Following consistent naming conventions makes your database more maintainable and easier 
            to understand. Here are common PostgreSQL naming conventions:
          </p>
          
          <h3 className="text-xl font-semibold mb-3">Best Practices</h3>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h4 className="font-semibold mb-2">Tables:</h4>
            <ul className="list-disc pl-6 space-y-1">
              <li>Use plural nouns: <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">users</code>, <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">products</code></li>
              <li>Use lowercase with underscores: <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">user_profiles</code></li>
              <li>Avoid reserved words</li>
            </ul>
          </div>
          
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h4 className="font-semibold mb-2">Columns:</h4>
            <ul className="list-disc pl-6 space-y-1">
              <li>Use lowercase with underscores: <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">first_name</code>, <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">created_at</code></li>
              <li>Use descriptive names</li>
              <li>Foreign keys: <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">table_name_id</code> (e.g., <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">user_id</code>)</li>
            </ul>
          </div>
          
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h4 className="font-semibold mb-2">Indexes:</h4>
            <ul className="list-disc pl-6 space-y-1">
              <li>Prefix with <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">idx_</code> for regular indexes</li>
              <li>Prefix with <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">pk_</code> for primary keys</li>
              <li>Prefix with <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">fk_</code> for foreign keys</li>
              <li>Prefix with <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">uq_</code> for unique constraints</li>
            </ul>
          </div>
          
          <CodeBlock
            title="SQL: Naming Convention Examples"
            language="sql"
            code={`-- Good table naming
CREATE TABLE user_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Good index naming
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE UNIQUE INDEX uq_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_created_at ON user_profiles(created_at);

-- Good constraint naming
ALTER TABLE user_profiles 
ADD CONSTRAINT fk_user_profiles_user_id 
FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE user_profiles 
ADD CONSTRAINT chk_user_profiles_email_format 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$');

-- Good function naming
CREATE OR REPLACE FUNCTION get_user_full_name(user_id INTEGER)
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT first_name || ' ' || last_name FROM user_profiles WHERE id = user_id);
END;
$$ LANGUAGE plpgsql;`}
          />
          <CodeBlock
            title="Prisma: Naming Conventions"
            language="prisma"
            code={`// schema.prisma
// Prisma uses camelCase for model and field names
// But maps to snake_case in database

model UserProfile {
  id        Int      @id @default(autoincrement())
  userId    Int      @map("user_id")
  firstName String?  @map("first_name") @db.VarChar(50)
  lastName  String?  @map("last_name") @db.VarChar(50)
  email     String   @unique
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  
  user      User     @relation(fields: [userId], references: [id])
  
  @@index([userId], map: "idx_user_profiles_user_id")
  @@index([createdAt], map: "idx_user_profiles_created_at")
  @@map("user_profiles")
}

model User {
  id        Int           @id @default(autoincrement())
  username  String        @unique
  profiles  UserProfile[]
  
  @@map("users")
}`}
          />
        </section>
      </div>
    </LessonLayout>
  );
}


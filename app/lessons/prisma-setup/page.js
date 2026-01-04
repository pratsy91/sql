import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Prisma Setup - PostgreSQL Learning',
  description: 'Learn about Prisma setup including schema definition and migration system',
};

export default function PrismaSetup() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Prisma Setup</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">What is Prisma?</h2>
          <p className="mb-4">
            Prisma is a modern ORM (Object-Relational Mapping) tool for Node.js and TypeScript. 
            It provides type-safe database access, an intuitive query API, and automatic migrations. 
            Prisma works with PostgreSQL and many other databases.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Schema Definition</h2>

          <CodeBlock
            title="Prisma: Schema File (schema.prisma)"
            language="prisma"
            code={`// Prisma schema file: schema.prisma

// Data source
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Generator
generator client {
  provider = "prisma-client-js"
}

// Model definition
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  
  posts     Post[]
  
  @@map("users")
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String?
  published Boolean  @default(false)
  authorId  Int      @map("author_id")
  createdAt DateTime @default(now()) @map("created_at")
  
  author    User     @relation(fields: [authorId], references: [id])
  
  @@map("posts")
}

// Field types:
// String, Int, Float, Boolean, DateTime, Json, Bytes
// Decimal, BigInt (for PostgreSQL)

// Field attributes:
// @id - Primary key
// @default - Default value
// @unique - Unique constraint
// @map - Map to different column name
// @updatedAt - Auto-update timestamp
// @relation - Foreign key relationship

// Model attributes:
// @@map - Map to different table name
// @@unique - Composite unique constraint
// @@index - Create index
// @@id - Composite primary key`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Schema Relationships</h2>

          <CodeBlock
            title="Prisma: Relationships"
            language="prisma"
            code={`// One-to-Many relationship
model User {
  id    Int    @id @default(autoincrement())
  email String @unique
  posts Post[]  // One user has many posts
}

model Post {
  id       Int  @id @default(autoincrement())
  title    String
  authorId Int  @map("author_id")
  author   User @relation(fields: [authorId], references: [id])
}

// Many-to-Many relationship
model Post {
  id     Int    @id @default(autoincrement())
  title  String
  tags   Tag[]
}

model Tag {
  id    Int    @id @default(autoincrement())
  name  String @unique
  posts Post[]
}

// One-to-One relationship
model User {
  id      Int     @id @default(autoincrement())
  email   String  @unique
  profile Profile?
}

model Profile {
  id     Int    @id @default(autoincrement())
  bio    String?
  userId Int    @unique @map("user_id")
  user   User   @relation(fields: [userId], references: [id])
}

// Self-referencing relationship
model Category {
  id       Int       @id @default(autoincrement())
  name     String
  parentId Int?      @map("parent_id")
  parent   Category? @relation("CategoryToCategory", fields: [parentId], references: [id])
  children Category[] @relation("CategoryToCategory")
}

// Implicit many-to-many (Prisma creates join table)
model Post {
  id    Int    @id @default(autoincrement())
  title String
  tags  Tag[]
}

model Tag {
  id    Int    @id @default(autoincrement())
  name  String
  posts Post[]
}

// Explicit many-to-many (custom join table)
model Post {
  id         Int           @id @default(autoincrement())
  title      String
  postTags   PostTag[]
}

model Tag {
  id       Int       @id @default(autoincrement())
  name     String
  postTags PostTag[]
}

model PostTag {
  postId Int  @map("post_id")
  tagId  Int  @map("tag_id")
  post   Post @relation(fields: [postId], references: [id])
  tag    Tag  @relation(fields: [tagId], references: [id])
  
  @@id([postId, tagId])
}`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Migration System</h2>

          <CodeBlock
            title="Prisma: Migrations"
            language="prisma"
            code={`// Prisma Migrate commands:

// Initialize Prisma (creates schema.prisma)
// npx prisma init

// Create migration from schema changes
// npx prisma migrate dev --name add_users_table
// Creates migration file and applies it

// Apply pending migrations
// npx prisma migrate deploy
// (for production)

// Create migration without applying
// npx prisma migrate dev --create-only --name migration_name

// Reset database (drops and recreates)
// npx prisma migrate reset

// View migration status
// npx prisma migrate status

// Migration file structure:
// migrations/
//   20240101000000_add_users_table/
//     migration.sql

// Example migration.sql:
-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

// Generate Prisma Client
// npx prisma generate
// Creates type-safe client from schema

// Format schema
// npx prisma format

// Validate schema
// npx prisma validate

// Introspect existing database
// npx prisma db pull
// Generates schema from existing database`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">SQL: Equivalent Schema</h2>

          <CodeBlock
            title="SQL: Equivalent Schema Creation"
            language="sql"
            code={`-- Prisma schema equivalent in SQL:

-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Posts table
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  published BOOLEAN DEFAULT FALSE,
  author_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_posts_author_id ON posts(author_id);

-- Triggers for updated_at (if needed)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Many-to-many join table
CREATE TABLE post_tags (
  post_id INTEGER REFERENCES posts(id),
  tag_id INTEGER REFERENCES tags(id),
  PRIMARY KEY (post_id, tag_id)
);

-- One-to-one relationship
CREATE TABLE profiles (
  id SERIAL PRIMARY KEY,
  bio TEXT,
  user_id INTEGER UNIQUE REFERENCES users(id)
);`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Prisma Configuration</h2>

          <CodeBlock
            title="Prisma: Configuration Options"
            language="prisma"
            code={`// schema.prisma configuration

// Data source options
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // url      = "postgresql://user:password@localhost:5432/mydb"
  // directUrl = env("DIRECT_URL")  // For migrations
  // shadowDatabaseUrl = env("SHADOW_DATABASE_URL")  // For migrations
}

// Generator options
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["fullTextSearch", "postgresqlExtensions"]
  output          = "./generated/client"
}

// Model with PostgreSQL-specific types
model Product {
  id          Int      @id @default(autoincrement())
  name        String
  price       Decimal  @db.Decimal(10, 2)
  quantity    BigInt
  metadata    Json?
  tags        String[]
  createdAt   DateTime @default(now()) @db.Timestamptz
}

// Enums
enum UserRole {
  USER
  ADMIN
  MODERATOR
}

model User {
  id   Int      @id @default(autoincrement())
  role UserRole @default(USER)
}

// Composite unique constraint
model User {
  id    Int    @id @default(autoincrement())
  email String
  name  String
  
  @@unique([email, name])
}

// Composite index
model Post {
  id        Int      @id @default(autoincrement())
  title     String
  published Boolean
  createdAt DateTime @default(now())
  
  @@index([published, createdAt])
}

// Full-text search (PostgreSQL)
model Document {
  id      Int    @id @default(autoincrement())
  title   String
  content String
  
  @@index([title, content(ops: Raw("gin_trgm_ops"))], type: Gin)
}`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Use migrations</strong> - version control your schema</li>
              <li><strong>Name migrations clearly</strong> - describe what they do</li>
              <li><strong>Review migration SQL</strong> - before applying to production</li>
              <li><strong>Use environment variables</strong> - for database URLs</li>
              <li><strong>Generate client regularly</strong> - after schema changes</li>
              <li><strong>Use @@map for naming</strong> - control table/column names</li>
              <li><strong>Define relationships clearly</strong> - explicit is better</li>
              <li><strong>Test migrations</strong> - on staging before production</li>
            </ul>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}


import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'UNIQUE Constraint - PostgreSQL Learning',
  description: 'Learn about UNIQUE constraints in PostgreSQL including column-level, table-level, unique indexes, and Prisma examples',
};

export default function UniqueConstraint() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">UNIQUE Constraint</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Column-Level UNIQUE</h2>

          <CodeBlock
            title="SQL: Column-Level UNIQUE"
            language="sql"
            code={`-- Create table with column-level UNIQUE
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20) UNIQUE
);

-- Insert duplicate (will fail)
INSERT INTO users (username, email) VALUES ('johndoe', 'john@example.com');
INSERT INTO users (username, email) VALUES ('johndoe', 'jane@example.com');
-- Error: duplicate key value violates unique constraint "users_username_key"

-- NULL values are allowed (multiple NULLs are considered distinct)
INSERT INTO users (username, email) VALUES (NULL, 'test1@example.com');
INSERT INTO users (username, email) VALUES (NULL, 'test2@example.com');
-- Both succeed because NULL != NULL in UNIQUE constraint context`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Table-Level UNIQUE</h2>

          <CodeBlock
            title="SQL: Table-Level UNIQUE"
            language="sql"
            code={`-- Single column table-level UNIQUE
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  sku VARCHAR(50),
  name VARCHAR(200),
  CONSTRAINT products_sku_unique UNIQUE (sku)
);

-- Composite UNIQUE constraint (multiple columns)
CREATE TABLE user_roles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  role_id INTEGER NOT NULL,
  CONSTRAINT user_roles_unique UNIQUE (user_id, role_id)
);

-- Multiple UNIQUE constraints
CREATE TABLE accounts (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50),
  email VARCHAR(100),
  phone VARCHAR(20),
  CONSTRAINT accounts_username_unique UNIQUE (username),
  CONSTRAINT accounts_email_unique UNIQUE (email),
  CONSTRAINT accounts_phone_unique UNIQUE (phone)
);

-- Composite UNIQUE allows same values in different combinations
INSERT INTO user_roles (user_id, role_id) VALUES (1, 1);
INSERT INTO user_roles (user_id, role_id) VALUES (1, 2);  -- OK (different role)
INSERT INTO user_roles (user_id, role_id) VALUES (2, 1);  -- OK (different user)
INSERT INTO user_roles (user_id, role_id) VALUES (1, 1);  -- Fails (duplicate combination)`}
          />
          <CodeBlock
            title="Prisma: UNIQUE Constraint"
            language="prisma"
            code={`// schema.prisma
model User {
  id       Int     @id @default(autoincrement())
  username String  @unique  // Column-level unique
  email    String  @unique  // Column-level unique
  phone    String? @unique  // Nullable unique
  
  @@map("users")
}

model UserRole {
  id     Int @id @default(autoincrement())
  userId Int @map("user_id")
  roleId Int @map("role_id")
  
  user User @relation(fields: [userId], references: [id])
  
  @@unique([userId, roleId])  // Composite unique constraint
  @@map("user_roles")
}

model Product {
  id  Int    @id @default(autoincrement())
  sku String @unique @map("sku")
  name String
  
  @@map("products")
}

// Usage
const user = await prisma.user.create({
  data: {
    username: 'johndoe',
    email: 'john@example.com',
  },
});

// This will fail (duplicate username)
try {
  await prisma.user.create({
    data: {
      username: 'johndoe',  // Duplicate!
      email: 'another@example.com',
    },
  });
} catch (error) {
  console.error('Unique constraint violation:', error);
}

// Composite unique
const userRole = await prisma.userRole.create({
  data: {
    userId: 1,
    roleId: 1,
  },
});`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Unique Indexes</h2>

          <CodeBlock
            title="SQL: Unique Indexes"
            language="sql"
            code={`-- Create unique index (alternative to UNIQUE constraint)
CREATE UNIQUE INDEX idx_users_email_unique ON users(email);

-- Unique index on expression
CREATE UNIQUE INDEX idx_users_lower_email_unique ON users(LOWER(email));

-- Partial unique index
CREATE UNIQUE INDEX idx_active_users_email_unique ON users(email) 
WHERE status = 'active';

-- Composite unique index
CREATE UNIQUE INDEX idx_user_role_unique ON user_roles(user_id, role_id);

-- View unique constraints and indexes
SELECT 
  conname AS constraint_name,
  contype AS constraint_type,
  conrelid::regclass AS table_name
FROM pg_constraint
WHERE contype = 'u'
ORDER BY conrelid, conname;

SELECT 
  indexname AS index_name,
  indexdef AS index_definition
FROM pg_indexes
WHERE indexdef LIKE '%UNIQUE%'
ORDER BY tablename, indexname;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Adding UNIQUE Constraints</h2>

          <CodeBlock
            title="SQL: Adding UNIQUE Constraints"
            language="sql"
            code={`-- Add UNIQUE constraint to existing table
ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);

-- Add UNIQUE constraint without name (auto-generated)
ALTER TABLE users ADD UNIQUE (username);

-- Add composite UNIQUE constraint
ALTER TABLE user_roles ADD CONSTRAINT user_roles_unique UNIQUE (user_id, role_id);

-- Add UNIQUE constraint if column has duplicates (will fail)
-- First, remove duplicates
DELETE FROM users 
WHERE id NOT IN (
  SELECT MIN(id) 
  FROM users 
  GROUP BY email
);

-- Then add constraint
ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Use UNIQUE</strong> for columns that must be unique (emails, usernames, SKUs)</li>
              <li><strong>Composite UNIQUE</strong> for unique combinations of multiple columns</li>
              <li><strong>NULL handling</strong> - Multiple NULLs are allowed in UNIQUE columns</li>
              <li><strong>Unique indexes</strong> can be used instead of constraints for more flexibility</li>
              <li><strong>Partial unique indexes</strong> for conditional uniqueness</li>
            </ul>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}


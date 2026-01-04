import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'PRIMARY KEY Constraint - PostgreSQL Learning',
  description: 'Learn about PRIMARY KEY constraints in PostgreSQL including single column and composite primary keys',
};

export default function PrimaryKeyConstraint() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">PRIMARY KEY Constraint</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Single Column Primary Key</h2>

          <CodeBlock
            title="SQL: Single Column Primary Key"
            language="sql"
            code={`-- Create table with single column PRIMARY KEY
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE,
  email VARCHAR(100) UNIQUE NOT NULL
);

-- Equivalent syntax
CREATE TABLE products (
  id INTEGER,
  name VARCHAR(200),
  PRIMARY KEY (id)
);

-- PRIMARY KEY implies:
-- - NOT NULL
-- - UNIQUE
-- - Creates index automatically

-- Insert with duplicate primary key (will fail)
INSERT INTO users (username, email) VALUES ('user1', 'user1@example.com');
INSERT INTO users (id, username, email) VALUES (1, 'user2', 'user2@example.com');
-- Error: duplicate key value violates unique constraint "users_pkey"

-- Insert with NULL primary key (will fail)
INSERT INTO users (id, username, email) VALUES (NULL, 'user3', 'user3@example.com');
-- Error: null value in column "id" violates not-null constraint`}
          />
          <CodeBlock
            title="Prisma: Primary Key"
            language="prisma"
            code={`// schema.prisma
model User {
  id       Int     @id @default(autoincrement())  // Primary key
  username String  @unique
  email    String  @unique
  
  @@map("users")
}

// Composite primary key
model UserRole {
  userId Int @id @map("user_id")
  roleId Int @id @map("role_id")
  
  @@map("user_roles")
}

// Usage
const user = await prisma.user.create({
  data: {
    username: 'johndoe',
    email: 'john@example.com',
    // id is auto-generated
  },
});

// Composite primary key
const userRole = await prisma.userRole.create({
  data: {
    userId: 1,
    roleId: 2,
  },
});`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Composite Primary Keys</h2>

          <CodeBlock
            title="SQL: Composite Primary Keys"
            language="sql"
            code={`-- Create table with composite PRIMARY KEY
CREATE TABLE order_items (
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10, 2) NOT NULL,
  PRIMARY KEY (order_id, product_id)
);

-- Insert with composite primary key
INSERT INTO order_items (order_id, product_id, quantity, price)
VALUES (1, 100, 2, 29.99);

INSERT INTO order_items (order_id, product_id, quantity, price)
VALUES (1, 101, 1, 49.99);  -- OK (different product_id)

INSERT INTO order_items (order_id, product_id, quantity, price)
VALUES (2, 100, 3, 29.99);  -- OK (different order_id)

INSERT INTO order_items (order_id, product_id, quantity, price)
VALUES (1, 100, 5, 29.99);  -- Fails (duplicate combination)

-- Composite primary key with named constraint
CREATE TABLE user_sessions (
  user_id INTEGER NOT NULL,
  session_id VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT user_sessions_pkey PRIMARY KEY (user_id, session_id)
);`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Adding Primary Keys</h2>

          <CodeBlock
            title="SQL: Adding Primary Keys"
            language="sql"
            code={`-- Add PRIMARY KEY to existing table
CREATE TABLE customers (
  id INTEGER,
  name VARCHAR(100),
  email VARCHAR(100)
);

-- Ensure column is NOT NULL and unique
ALTER TABLE customers ALTER COLUMN id SET NOT NULL;

-- Remove any duplicates
DELETE FROM customers 
WHERE id NOT IN (
  SELECT MIN(id) 
  FROM customers 
  GROUP BY id
);

-- Add PRIMARY KEY
ALTER TABLE customers ADD PRIMARY KEY (id);

-- Add composite PRIMARY KEY
ALTER TABLE order_items ADD PRIMARY KEY (order_id, product_id);

-- Drop PRIMARY KEY
ALTER TABLE customers DROP CONSTRAINT customers_pkey;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Primary Key Characteristics</h2>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>NOT NULL:</strong> Primary key columns cannot be NULL</li>
              <li><strong>UNIQUE:</strong> Primary key values must be unique</li>
              <li><strong>Index:</strong> Automatically creates a unique index</li>
              <li><strong>One per table:</strong> A table can have only one PRIMARY KEY</li>
              <li><strong>Composite:</strong> Can consist of multiple columns</li>
              <li><strong>Foreign key reference:</strong> Other tables can reference PRIMARY KEY</li>
            </ul>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}


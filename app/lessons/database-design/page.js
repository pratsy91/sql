import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Database Design - PostgreSQL Learning',
  description: 'Learn about database design including normalization and denormalization',
};

export default function DatabaseDesign() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Database Design</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Normalization</h2>

          <CodeBlock
            title="SQL: Normalized Database Design"
            language="sql"
            code={`-- First Normal Form (1NF): Eliminate repeating groups
-- Each column contains atomic values, no repeating groups

-- Before 1NF (violates 1NF):
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_name TEXT,
  item1 TEXT,
  item2 TEXT,
  item3 TEXT  -- Repeating groups
);

-- After 1NF:
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER,
  order_date DATE
);

CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id),
  product_id INTEGER,
  quantity INTEGER,
  price NUMERIC
);

-- Second Normal Form (2NF): Remove partial dependencies
-- All non-key attributes fully depend on primary key

-- Before 2NF (violates 2NF):
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER,
  product_id INTEGER,
  product_name TEXT,  -- Depends on product_id, not order_id
  quantity INTEGER,
  price NUMERIC
);

-- After 2NF:
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id),
  product_id INTEGER REFERENCES products(id),
  quantity INTEGER,
  price NUMERIC
);

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name TEXT,
  description TEXT
);

-- Third Normal Form (3NF): Remove transitive dependencies
-- No non-key attribute depends on another non-key attribute

-- Before 3NF (violates 3NF):
CREATE TABLE employees (
  id SERIAL PRIMARY KEY,
  name TEXT,
  department_id INTEGER,
  department_name TEXT,  -- Depends on department_id
  department_location TEXT  -- Depends on department_id
);

-- After 3NF:
CREATE TABLE employees (
  id SERIAL PRIMARY KEY,
  name TEXT,
  department_id INTEGER REFERENCES departments(id)
);

CREATE TABLE departments (
  id SERIAL PRIMARY KEY,
  name TEXT,
  location TEXT
);

-- Boyce-Codd Normal Form (BCNF): Every determinant is a candidate key
-- Stronger than 3NF

-- Example: Fully normalized schema
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  title TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE post_categories (
  post_id INTEGER REFERENCES posts(id),
  category_id INTEGER REFERENCES categories(id),
  PRIMARY KEY (post_id, category_id)
);

-- Benefits of normalization:
-- 1. Reduces data redundancy
-- 2. Prevents update anomalies
-- 3. Prevents insertion anomalies
-- 4. Prevents deletion anomalies
-- 5. Ensures data integrity`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Denormalization</h2>

          <CodeBlock
            title="SQL: Denormalized Database Design"
            language="sql"
            code={`-- Denormalization: Intentionally adding redundancy for performance

-- Example: Denormalized order table
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER,
  customer_name TEXT,  -- Denormalized from customers table
  customer_email TEXT,  -- Denormalized from customers table
  order_date DATE,
  total_amount NUMERIC,
  status TEXT
);

-- Original normalized version:
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id),
  order_date DATE,
  total_amount NUMERIC,
  status TEXT
);

CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  name TEXT,
  email TEXT
);

-- Denormalized for read performance:
-- Trade-off: Faster reads, but need to update multiple places

-- Materialized views (denormalization technique)
CREATE MATERIALIZED VIEW order_summary AS
SELECT 
  o.id AS order_id,
  o.order_date,
  c.name AS customer_name,
  c.email AS customer_email,
  COUNT(oi.id) AS item_count,
  SUM(oi.quantity * oi.price) AS total_amount
FROM orders o
JOIN customers c ON o.customer_id = c.id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, o.order_date, c.name, c.email;

-- Refresh materialized view
REFRESH MATERIALIZED VIEW order_summary;

-- Computed columns (PostgreSQL 12+)
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name TEXT,
  price NUMERIC,
  discount NUMERIC,
  final_price NUMERIC GENERATED ALWAYS AS (price - discount) STORED
);

-- When to denormalize:
-- 1. Read-heavy workloads
-- 2. Complex joins that are frequently executed
-- 3. Reporting and analytics
-- 4. When normalization causes performance issues

-- When NOT to denormalize:
-- 1. Write-heavy workloads
-- 2. Data consistency is critical
-- 3. Storage is limited
-- 4. Data changes frequently`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Design Patterns</h2>

          <CodeBlock
            title="SQL: Common Design Patterns"
            language="sql"
            code={`-- Soft delete pattern
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  deleted_at TIMESTAMP,  -- Soft delete flag
  created_at TIMESTAMP DEFAULT NOW()
);

-- Query active users
SELECT * FROM users WHERE deleted_at IS NULL;

-- Audit trail pattern
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by INTEGER,
  updated_by INTEGER
);

CREATE TABLE audit_log (
  id SERIAL PRIMARY KEY,
  table_name TEXT,
  record_id INTEGER,
  action TEXT,  -- INSERT, UPDATE, DELETE
  old_values JSONB,
  new_values JSONB,
  changed_by INTEGER,
  changed_at TIMESTAMP DEFAULT NOW()
);

-- Polymorphic associations (avoid if possible, use explicit foreign keys)
CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  commentable_type TEXT,  -- 'Post' or 'Article'
  commentable_id INTEGER,
  content TEXT,
  user_id INTEGER REFERENCES users(id)
);

-- Better: Explicit foreign keys
CREATE TABLE post_comments (
  id SERIAL PRIMARY KEY,
  post_id INTEGER REFERENCES posts(id),
  content TEXT,
  user_id INTEGER REFERENCES users(id)
);

CREATE TABLE article_comments (
  id SERIAL PRIMARY KEY,
  article_id INTEGER REFERENCES articles(id),
  content TEXT,
  user_id INTEGER REFERENCES users(id)
);

-- Single Table Inheritance (STI)
CREATE TABLE vehicles (
  id SERIAL PRIMARY KEY,
  type TEXT,  -- 'Car', 'Truck', 'Motorcycle'
  make TEXT,
  model TEXT,
  year INTEGER,
  -- Car-specific fields
  doors INTEGER,
  -- Truck-specific fields
  cargo_capacity NUMERIC,
  -- Motorcycle-specific fields
  engine_cc INTEGER
);

-- Multi-table inheritance (PostgreSQL feature)
CREATE TABLE vehicles (
  id SERIAL PRIMARY KEY,
  make TEXT,
  model TEXT,
  year INTEGER
);

CREATE TABLE cars (
  doors INTEGER
) INHERITS (vehicles);

CREATE TABLE trucks (
  cargo_capacity NUMERIC
) INHERITS (vehicles);`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Prisma: Database Design</h2>

          <CodeBlock
            title="Prisma: Normalized Schema"
            language="prisma"
            code={`// Normalized Prisma schema

// Users table
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  
  posts     Post[]
  profile   Profile?
}

// Posts table
model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String?
  userId    Int      @map("user_id")
  createdAt DateTime @default(now())
  
  user      User     @relation(fields: [userId], references: [id])
  categories PostCategory[]
}

// Categories table
model Category {
  id    Int    @id @default(autoincrement())
  name  String @unique
  
  posts PostCategory[]
}

// Join table for many-to-many
model PostCategory {
  postId     Int @map("post_id")
  categoryId Int @map("category_id")
  
  post     Post     @relation(fields: [postId], references: [id])
  category Category @relation(fields: [categoryId], references: [id])
  
  @@id([postId, categoryId])
}

// Profile (one-to-one)
model Profile {
  id     Int    @id @default(autoincrement())
  bio    String?
  userId Int    @unique @map("user_id")
  
  user   User   @relation(fields: [userId], references: [id])
}

// Denormalized example (when needed for performance)
model Order {
  id           Int      @id @default(autoincrement())
  customerId   Int      @map("customer_id")
  customerName String   @map("customer_name")  // Denormalized
  customerEmail String  @map("customer_email")  // Denormalized
  orderDate    DateTime @default(now()) @map("order_date")
  totalAmount  Decimal  @map("total_amount")
  
  // Keep foreign key for consistency
  customer     Customer @relation(fields: [customerId], references: [id])
}

// Soft delete pattern
model User {
  id        Int       @id @default(autoincrement())
  email     String    @unique
  name      String?
  deletedAt DateTime? @map("deleted_at")
  createdAt DateTime  @default(now())
}

// Query active users
const activeUsers = await prisma.user.findMany({
  where: { deletedAt: null }
});

// Audit trail pattern
model User {
  id        Int       @id @default(autoincrement())
  email     String    @unique
  name      String?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  createdBy Int?      @map("created_by")
  updatedBy Int?      @map("updated_by")
}

model AuditLog {
  id         Int      @id @default(autoincrement())
  tableName  String   @map("table_name")
  recordId   Int      @map("record_id")
  action     String
  oldValues  Json?    @map("old_values")
  newValues  Json?    @map("new_values")
  changedBy  Int?     @map("changed_by")
  changedAt  DateTime @default(now()) @map("changed_at")
}`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Start normalized</strong> - normalize first, denormalize later if needed</li>
              <li><strong>Understand trade-offs</strong> - normalization vs performance</li>
              <li><strong>Use foreign keys</strong> - maintain referential integrity</li>
              <li><strong>Avoid polymorphic associations</strong> - use explicit foreign keys</li>
              <li><strong>Use soft deletes</strong> - when data retention is important</li>
              <li><strong>Add audit trails</strong> - for compliance and debugging</li>
              <li><strong>Consider materialized views</strong> - for read-heavy denormalized data</li>
              <li><strong>Document design decisions</strong> - explain normalization/denormalization choices</li>
            </ul>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}


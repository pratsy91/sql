import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'INSERT - PostgreSQL Learning',
  description: 'Learn about INSERT statements in PostgreSQL including single row, multiple rows, RETURNING, ON CONFLICT, and INSERT ... SELECT',
};

export default function Insert() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">INSERT</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Single Row INSERT</h2>

          <CodeBlock
            title="SQL: Single Row INSERT"
            language="sql"
            code={`-- Basic INSERT with all columns
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert single row with all columns
INSERT INTO users (id, username, email, created_at)
VALUES (1, 'johndoe', 'john@example.com', CURRENT_TIMESTAMP);

-- Insert with default values
INSERT INTO users (username, email)
VALUES ('janedoe', 'jane@example.com');

-- Insert with explicit NULL
INSERT INTO users (username, email, created_at)
VALUES ('bobsmith', 'bob@example.com', NULL);

-- Insert using DEFAULT keyword
INSERT INTO users (username, email, created_at)
VALUES ('alice', 'alice@example.com', DEFAULT);`}
          />
          <CodeBlock
            title="Prisma: Single Row INSERT"
            language="prisma"
            code={`// schema.prisma
model User {
  id        Int       @id @default(autoincrement())
  username  String    @unique
  email     String
  createdAt DateTime  @default(now()) @map("created_at")
  
  @@map("users")
}

// Insert single row
const user = await prisma.user.create({
  data: {
    username: 'johndoe',
    email: 'john@example.com',
    // createdAt is automatically set
  },
});

// Insert with explicit values
const user2 = await prisma.user.create({
  data: {
    username: 'janedoe',
    email: 'jane@example.com',
    createdAt: new Date(),
  },
});`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Multiple Rows INSERT</h2>

          <CodeBlock
            title="SQL: Multiple Rows INSERT"
            language="sql"
            code={`-- Insert multiple rows in single statement
INSERT INTO users (username, email)
VALUES 
  ('user1', 'user1@example.com'),
  ('user2', 'user2@example.com'),
  ('user3', 'user3@example.com');

-- Insert with different column sets
INSERT INTO users (username, email)
VALUES 
  ('alice', 'alice@example.com'),
  ('bob', 'bob@example.com'),
  ('charlie', 'charlie@example.com');

-- Insert many rows efficiently
INSERT INTO products (name, price, stock)
VALUES 
  ('Laptop', 999.99, 10),
  ('Mouse', 29.99, 50),
  ('Keyboard', 79.99, 30),
  ('Monitor', 299.99, 15);`}
          />
          <CodeBlock
            title="Prisma: Multiple Rows INSERT"
            language="prisma"
            code={`// Insert multiple rows
const users = await prisma.user.createMany({
  data: [
    { username: 'user1', email: 'user1@example.com' },
    { username: 'user2', email: 'user2@example.com' },
    { username: 'user3', email: 'user3@example.com' },
  ],
  skipDuplicates: true,  // Skip if unique constraint violation
});

// Note: createMany doesn't return created records
// Use create for individual records if you need the returned data

// Insert with transaction for multiple operations
const result = await prisma.$transaction([
  prisma.user.create({ data: { username: 'alice', email: 'alice@example.com' } }),
  prisma.user.create({ data: { username: 'bob', email: 'bob@example.com' } }),
  prisma.user.create({ data: { username: 'charlie', email: 'charlie@example.com' } }),
]);`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">INSERT ... RETURNING</h2>

          <CodeBlock
            title="SQL: INSERT ... RETURNING"
            language="sql"
            code={`-- Return inserted row
INSERT INTO users (username, email)
VALUES ('newuser', 'newuser@example.com')
RETURNING *;

-- Return specific columns
INSERT INTO users (username, email)
VALUES ('anotheruser', 'another@example.com')
RETURNING id, username, created_at;

-- Return with expressions
INSERT INTO products (name, price, stock)
VALUES ('Tablet', 499.99, 20)
RETURNING id, name, price, stock, price * stock AS total_value;

-- Return multiple inserted rows
INSERT INTO users (username, email)
VALUES 
  ('user1', 'user1@example.com'),
  ('user2', 'user2@example.com')
RETURNING id, username;

-- Use RETURNING in CTE
WITH inserted_user AS (
  INSERT INTO users (username, email)
  VALUES ('cteuser', 'cte@example.com')
  RETURNING id, username
)
SELECT * FROM inserted_user;`}
          />
          <CodeBlock
            title="Prisma: INSERT ... RETURNING"
            language="prisma"
            code={`// Prisma automatically returns inserted data
const user = await prisma.user.create({
  data: {
    username: 'newuser',
    email: 'newuser@example.com',
  },
  // Returns: { id: 1, username: 'newuser', email: 'newuser@example.com', createdAt: ... }
});

// Select specific fields to return
const user = await prisma.user.create({
  data: {
    username: 'anotheruser',
    email: 'another@example.com',
  },
  select: {
    id: true,
    username: true,
    createdAt: true,
  },
});

// Use raw SQL for complex RETURNING
const result = await prisma.$queryRaw\`
  INSERT INTO products (name, price, stock)
  VALUES ('Tablet', 499.99, 20)
  RETURNING id, name, price * stock AS total_value
\`;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">INSERT ... ON CONFLICT</h2>

          <CodeBlock
            title="SQL: INSERT ... ON CONFLICT"
            language="sql"
            code={`-- ON CONFLICT DO NOTHING
INSERT INTO users (username, email)
VALUES ('johndoe', 'john@example.com')
ON CONFLICT (username) DO NOTHING;

-- ON CONFLICT DO UPDATE (UPSERT)
INSERT INTO users (username, email)
VALUES ('johndoe', 'john@example.com')
ON CONFLICT (username) 
DO UPDATE SET 
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

-- ON CONFLICT with multiple columns
INSERT INTO user_roles (user_id, role_id)
VALUES (1, 1)
ON CONFLICT (user_id, role_id) DO NOTHING;

-- ON CONFLICT with WHERE clause
INSERT INTO products (sku, name, price)
VALUES ('SKU-001', 'Product Name', 99.99)
ON CONFLICT (sku) 
DO UPDATE SET 
  price = EXCLUDED.price
WHERE products.price != EXCLUDED.price;`}
          />
          <CodeBlock
            title="Prisma: INSERT ... ON CONFLICT"
            language="prisma"
            code={`// Prisma handles upserts with upsert method
const user = await prisma.user.upsert({
  where: {
    username: 'johndoe',  // Unique field
  },
  update: {
    email: 'newemail@example.com',
  },
  create: {
    username: 'johndoe',
    email: 'john@example.com',
  },
});

// For composite unique constraints
const userRole = await prisma.userRole.upsert({
  where: {
    userId_roleId: {
      userId: 1,
      roleId: 1,
    },
  },
  update: {},
  create: {
    userId: 1,
    roleId: 1,
  },
});

// Use raw SQL for complex ON CONFLICT
await prisma.$executeRaw\`
  INSERT INTO products (sku, name, price)
  VALUES ('SKU-001', 'Product', 99.99)
  ON CONFLICT (sku) 
  DO UPDATE SET price = EXCLUDED.price
  WHERE products.price != EXCLUDED.price
\`;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">INSERT ... SELECT</h2>

          <CodeBlock
            title="SQL: INSERT ... SELECT"
            language="sql"
            code={`-- Insert from another table
INSERT INTO users_backup (username, email)
SELECT username, email
FROM users
WHERE created_at < '2024-01-01';

-- Insert with transformations
INSERT INTO user_summary (user_id, username_length, email_domain)
SELECT 
  id,
  LENGTH(username),
  SPLIT_PART(email, '@', 2)
FROM users;

-- Insert from multiple tables (JOIN)
INSERT INTO order_summary (user_id, total_orders, total_amount)
SELECT 
  u.id,
  COUNT(o.id),
  COALESCE(SUM(o.total), 0)
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id;

-- Insert with subquery
INSERT INTO top_users (user_id, order_count)
SELECT user_id, COUNT(*)
FROM orders
GROUP BY user_id
HAVING COUNT(*) > 10
ORDER BY COUNT(*) DESC
LIMIT 10;`}
          />
          <CodeBlock
            title="Prisma: INSERT ... SELECT"
            language="prisma"
            code={`// Use raw SQL for INSERT ... SELECT
await prisma.$executeRaw\`
  INSERT INTO users_backup (username, email)
  SELECT username, email
  FROM users
  WHERE created_at < '2024-01-01'
\`;

// Or use Prisma queries and createMany
const oldUsers = await prisma.user.findMany({
  where: {
    createdAt: {
      lt: new Date('2024-01-01'),
    },
  },
  select: {
    username: true,
    email: true,
  },
});

await prisma.userBackup.createMany({
  data: oldUsers,
});

// Complex INSERT ... SELECT with raw SQL
await prisma.$executeRaw\`
  INSERT INTO order_summary (user_id, total_orders, total_amount)
  SELECT 
    u.id,
    COUNT(o.id),
    COALESCE(SUM(o.total), 0)
  FROM users u
  LEFT JOIN orders o ON u.id = o.user_id
  GROUP BY u.id
\`;`}
          />
        </section>
      </div>
    </LessonLayout>
  );
}


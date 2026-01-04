import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Basic SELECT - PostgreSQL Learning',
  description: 'Learn about basic SELECT statements including selecting columns, SELECT *, and DISTINCT',
};

export default function BasicSelect() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Basic SELECT</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">SELECT Columns</h2>

          <CodeBlock
            title="SQL: SELECT Columns"
            language="sql"
            code={`-- Select specific columns
SELECT id, username, email FROM users;

-- Select with table alias
SELECT u.id, u.username, u.email FROM users u;

-- Select with column aliases
SELECT 
  id AS user_id,
  username AS name,
  email AS email_address
FROM users;

-- Select with expressions
SELECT 
  id,
  username,
  email,
  LENGTH(username) AS username_length,
  UPPER(email) AS email_upper
FROM users;

-- Select with calculations
SELECT 
  name,
  price,
  stock,
  price * stock AS total_value
FROM products;`}
          />
          <CodeBlock
            title="Prisma: SELECT Columns"
            language="prisma"
            code={`// Select all fields (default)
const users = await prisma.user.findMany();

// Select specific fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    username: true,
    email: true,
  },
});

// Select with nested relations
const users = await prisma.user.findMany({
  select: {
    id: true,
    username: true,
    posts: {
      select: {
        id: true,
        title: true,
      },
    },
  },
});

// Use raw SQL for complex expressions
const users = await prisma.$queryRaw\`
  SELECT 
    id,
    username,
    LENGTH(username) AS username_length,
    UPPER(email) AS email_upper
  FROM users
\`;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">SELECT *</h2>

          <CodeBlock
            title="SQL: SELECT *"
            language="sql"
            code={`-- Select all columns
SELECT * FROM users;

-- Select all with table alias
SELECT u.* FROM users u;

-- Select all from multiple tables
SELECT u.*, p.* 
FROM users u
JOIN profiles p ON u.id = p.user_id;

-- Note: Avoid SELECT * in production code
-- Explicitly list columns for better performance and maintainability`}
          />
          <CodeBlock
            title="Prisma: SELECT *"
            language="prisma"
            code={`// Prisma returns all fields by default (like SELECT *)
const users = await prisma.user.findMany();

// To get all fields explicitly
const users = await prisma.user.findMany({
  select: {
    id: true,
    username: true,
    email: true,
    createdAt: true,
    // ... all fields
  },
});

// Or just omit select (defaults to all)
const users = await prisma.user.findMany();`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">DISTINCT</h2>

          <CodeBlock
            title="SQL: DISTINCT"
            language="sql"
            code={`-- Select distinct values
SELECT DISTINCT status FROM users;

-- Select distinct combinations
SELECT DISTINCT user_id, status FROM orders;

-- DISTINCT ON (PostgreSQL specific)
SELECT DISTINCT ON (status) 
  id, username, email, status
FROM users
ORDER BY status, created_at DESC;

-- Count distinct values
SELECT COUNT(DISTINCT status) FROM users;

-- Distinct with expressions
SELECT DISTINCT LOWER(email) FROM users;`}
          />
          <CodeBlock
            title="Prisma: DISTINCT"
            language="prisma"
            code={`// Prisma doesn't have direct DISTINCT support
// Use raw SQL or process in application

// Using raw SQL
const distinctStatuses = await prisma.$queryRaw\`
  SELECT DISTINCT status FROM users
\`;

// Or use groupBy (similar effect)
const statuses = await prisma.user.groupBy({
  by: ['status'],
});

// Count distinct
const distinctCount = await prisma.$queryRaw\`
  SELECT COUNT(DISTINCT status) AS count FROM users
\`;

// Process in application
const users = await prisma.user.findMany();
const distinctStatuses = [...new Set(users.map(u => u.status))];`}
          />
        </section>
      </div>
    </LessonLayout>
  );
}


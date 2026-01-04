import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Mapping SQL Concepts to Prisma - PostgreSQL Learning',
  description: 'Learn how to map SQL concepts to Prisma equivalents with examples',
};

export default function MappingSQLToPrisma() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Mapping SQL Concepts to Prisma</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">SELECT Queries</h2>

          <CodeBlock
            title="SQL to Prisma: SELECT"
            language="sql"
            code={`-- SQL: Basic SELECT
SELECT * FROM users;
-- Prisma:
const users = await prisma.user.findMany();

-- SQL: SELECT with WHERE
SELECT * FROM users WHERE status = 'active';
-- Prisma:
const users = await prisma.user.findMany({
  where: { status: 'active' }
});

-- SQL: SELECT specific columns
SELECT id, name, email FROM users;
-- Prisma:
const users = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    email: true
  }
});

-- SQL: SELECT with ORDER BY
SELECT * FROM users ORDER BY created_at DESC;
-- Prisma:
const users = await prisma.user.findMany({
  orderBy: { createdAt: 'desc' }
});

-- SQL: SELECT with LIMIT/OFFSET
SELECT * FROM users LIMIT 10 OFFSET 20;
-- Prisma:
const users = await prisma.user.findMany({
  take: 10,
  skip: 20
});

-- SQL: SELECT DISTINCT
SELECT DISTINCT status FROM users;
-- Prisma: Use groupBy or raw SQL
const statuses = await prisma.user.groupBy({
  by: ['status']
});

-- SQL: SELECT with JOIN
SELECT u.name, p.title 
FROM users u 
JOIN posts p ON u.id = p.author_id;
-- Prisma:
const users = await prisma.user.findMany({
  include: {
    posts: {
      select: {
        title: true
      }
    }
  }
});`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">INSERT, UPDATE, DELETE</h2>

          <CodeBlock
            title="SQL to Prisma: DML Operations"
            language="sql"
            code={`-- SQL: INSERT
INSERT INTO users (email, name) VALUES ('user@example.com', 'John');
-- Prisma:
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    name: 'John'
  }
});

-- SQL: INSERT multiple
INSERT INTO users (email, name) VALUES 
  ('user1@example.com', 'User 1'),
  ('user2@example.com', 'User 2');
-- Prisma:
const users = await prisma.user.createMany({
  data: [
    { email: 'user1@example.com', name: 'User 1' },
    { email: 'user2@example.com', name: 'User 2' }
  ]
});

-- SQL: UPDATE
UPDATE users SET name = 'Updated' WHERE id = 1;
-- Prisma:
const user = await prisma.user.update({
  where: { id: 1 },
  data: { name: 'Updated' }
});

-- SQL: UPDATE multiple
UPDATE users SET status = 'active' WHERE status = 'inactive';
-- Prisma:
const result = await prisma.user.updateMany({
  where: { status: 'inactive' },
  data: { status: 'active' }
});

-- SQL: DELETE
DELETE FROM users WHERE id = 1;
-- Prisma:
const user = await prisma.user.delete({
  where: { id: 1 }
});

-- SQL: DELETE multiple
DELETE FROM users WHERE status = 'inactive';
-- Prisma:
const result = await prisma.user.deleteMany({
  where: { status: 'inactive' }
});

-- SQL: UPSERT (INSERT ... ON CONFLICT)
INSERT INTO users (email, name) 
VALUES ('user@example.com', 'John')
ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name;
-- Prisma:
const user = await prisma.user.upsert({
  where: { email: 'user@example.com' },
  update: { name: 'John' },
  create: {
    email: 'user@example.com',
    name: 'John'
  }
});`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Aggregations and Grouping</h2>

          <CodeBlock
            title="SQL to Prisma: Aggregations"
            language="sql"
            code={`-- SQL: COUNT
SELECT COUNT(*) FROM users;
-- Prisma:
const count = await prisma.user.count();

-- SQL: COUNT with WHERE
SELECT COUNT(*) FROM users WHERE status = 'active';
-- Prisma:
const count = await prisma.user.count({
  where: { status: 'active' }
});

-- SQL: SUM, AVG, MIN, MAX
SELECT 
  SUM(price) AS total,
  AVG(price) AS average,
  MIN(price) AS minimum,
  MAX(price) AS maximum
FROM products;
-- Prisma:
const stats = await prisma.product.aggregate({
  _sum: { price: true },
  _avg: { price: true },
  _min: { price: true },
  _max: { price: true }
});

-- SQL: GROUP BY
SELECT status, COUNT(*) 
FROM users 
GROUP BY status;
-- Prisma:
const grouped = await prisma.user.groupBy({
  by: ['status'],
  _count: { id: true }
});

-- SQL: GROUP BY with HAVING
SELECT status, COUNT(*) 
FROM users 
GROUP BY status 
HAVING COUNT(*) > 10;
-- Prisma: Use raw SQL or filter after groupBy
const grouped = await prisma.user.groupBy({
  by: ['status'],
  _count: { id: true }
});
const filtered = grouped.filter(g => g._count.id > 10);

-- SQL: Complex aggregation
SELECT 
  category,
  COUNT(*) AS count,
  AVG(price) AS avg_price
FROM products
GROUP BY category;
-- Prisma:
const stats = await prisma.product.groupBy({
  by: ['category'],
  _count: { id: true },
  _avg: { price: true }
});`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Joins and Relations</h2>

          <CodeBlock
            title="SQL to Prisma: Joins"
            language="sql"
            code={`-- SQL: INNER JOIN
SELECT u.name, p.title 
FROM users u 
INNER JOIN posts p ON u.id = p.author_id;
-- Prisma:
const users = await prisma.user.findMany({
  include: {
    posts: {
      select: {
        title: true
      }
    }
  }
});

-- SQL: LEFT JOIN
SELECT u.name, COUNT(p.id) as post_count
FROM users u
LEFT JOIN posts p ON u.id = p.author_id
GROUP BY u.id, u.name;
-- Prisma:
const users = await prisma.user.findMany({
  include: {
    posts: {
      select: {
        id: true
      }
    }
  }
});
// Then count in application or use raw SQL

-- SQL: Multiple JOINs
SELECT u.name, p.title, t.name as tag
FROM users u
JOIN posts p ON u.id = p.author_id
JOIN post_tags pt ON p.id = pt.post_id
JOIN tags t ON pt.tag_id = t.id;
-- Prisma:
const users = await prisma.user.findMany({
  include: {
    posts: {
      include: {
        tags: true
      }
    }
  }
});

-- SQL: Self JOIN
SELECT u1.name, u2.name as manager
FROM users u1
LEFT JOIN users u2 ON u1.manager_id = u2.id;
-- Prisma: Define self-referencing relation in schema
const users = await prisma.user.findMany({
  include: {
    manager: true
  }
});`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Subqueries and CTEs</h2>

          <CodeBlock
            title="SQL to Prisma: Subqueries"
            language="sql"
            code={`-- SQL: Subquery in WHERE
SELECT * FROM users 
WHERE id IN (SELECT user_id FROM orders WHERE total > 1000);
-- Prisma: Use raw SQL or multiple queries
const orderUserIds = await prisma.order.findMany({
  where: { total: { gt: 1000 } },
  select: { userId: true }
});
const userIds = orderUserIds.map(o => o.userId);
const users = await prisma.user.findMany({
  where: { id: { in: userIds } }
});

-- Or use raw SQL:
const users = await prisma.$queryRaw\`
  SELECT * FROM "User"
  WHERE id IN (SELECT user_id FROM "Order" WHERE total > 1000)
\`;

-- SQL: EXISTS subquery
SELECT * FROM users u
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id);
-- Prisma: Use relation filter
const users = await prisma.user.findMany({
  where: {
    orders: {
      some: {}
    }
  }
});

-- SQL: CTE (Common Table Expression)
WITH user_stats AS (
  SELECT user_id, COUNT(*) as order_count
  FROM orders
  GROUP BY user_id
)
SELECT u.name, us.order_count
FROM users u
JOIN user_stats us ON u.id = us.user_id;
-- Prisma: Use raw SQL
const result = await prisma.$queryRaw\`
  WITH user_stats AS (
    SELECT user_id, COUNT(*) as order_count
    FROM "Order"
    GROUP BY user_id
  )
  SELECT u.name, us.order_count
  FROM "User" u
  JOIN user_stats us ON u.id = us.user_id
\`;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Window Functions and Advanced Queries</h2>

          <CodeBlock
            title="SQL to Prisma: Advanced SQL"
            language="sql"
            code={`-- SQL: Window functions
SELECT 
  id,
  name,
  RANK() OVER (ORDER BY score DESC) AS rank
FROM users;
-- Prisma: Use raw SQL
const users = await prisma.$queryRaw\`
  SELECT 
    id,
    name,
    RANK() OVER (ORDER BY score DESC) AS rank
  FROM "User"
\`;

-- SQL: UNION
SELECT name FROM users
UNION
SELECT name FROM admins;
-- Prisma: Use raw SQL or combine in application
const users = await prisma.user.findMany({ select: { name: true } });
const admins = await prisma.admin.findMany({ select: { name: true } });
const allNames = [...users, ...admins].map(u => u.name);

-- SQL: CASE expression
SELECT 
  name,
  CASE 
    WHEN age < 18 THEN 'Minor'
    WHEN age < 65 THEN 'Adult'
    ELSE 'Senior'
  END AS age_group
FROM users;
-- Prisma: Process in application or use raw SQL
const users = await prisma.user.findMany();
const processed = users.map(u => ({
  ...u,
  ageGroup: u.age < 18 ? 'Minor' : u.age < 65 ? 'Adult' : 'Senior'
}));

-- SQL: Full-text search
SELECT * FROM documents
WHERE to_tsvector('english', content) @@ to_tsquery('english', 'search');
-- Prisma: Use raw SQL
const docs = await prisma.$queryRaw\`
  SELECT * FROM "Document"
  WHERE to_tsvector('english', content) @@ to_tsquery('english', $1)
\`, 'search';

-- SQL: JSON operations
SELECT * FROM documents
WHERE data->>'status' = 'active';
-- Prisma: Use raw SQL or filter in application
const docs = await prisma.document.findMany();
const filtered = docs.filter(d => d.data.status === 'active');

// Or use raw SQL:
const docs = await prisma.$queryRaw\`
  SELECT * FROM "Document"
  WHERE data->>'status' = $1
\`, 'active';`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Use Prisma for simple queries</strong> - type-safe and convenient</li>
              <li><strong>Use raw SQL for complex queries</strong> - window functions, CTEs, etc.</li>
              <li><strong>Map SQL patterns to Prisma</strong> - understand equivalents</li>
              <li><strong>Use include/select</strong> - control what data is fetched</li>
              <li><strong>Combine Prisma and raw SQL</strong> - use best tool for each task</li>
              <li><strong>Process in application</strong> - when Prisma doesn't support SQL feature</li>
              <li><strong>Use transactions</strong> - for multiple related operations</li>
              <li><strong>Monitor query performance</strong> - Prisma generates SQL, check it</li>
            </ul>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}


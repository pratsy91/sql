import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'DELETE - PostgreSQL Learning',
  description: 'Learn about DELETE statements in PostgreSQL including basic DELETE, DELETE with JOIN, and DELETE ... RETURNING',
};

export default function Delete() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">DELETE</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Basic DELETE</h2>

          <CodeBlock
            title="SQL: Basic DELETE"
            language="sql"
            code={`-- Delete single row
DELETE FROM users
WHERE id = 1;

-- Delete with conditions
DELETE FROM products
WHERE stock = 0 AND discontinued = true;

-- Delete all rows (be very careful!)
DELETE FROM temp_table;

-- Delete with subquery
DELETE FROM orders
WHERE user_id IN (
  SELECT id FROM users WHERE status = 'deleted'
);

-- Delete with date conditions
DELETE FROM logs
WHERE created_at < CURRENT_DATE - INTERVAL '1 year';

-- Delete with LIMIT (PostgreSQL 9.5+)
DELETE FROM users
WHERE status = 'inactive'
ORDER BY created_at ASC
LIMIT 100;`}
          />
          <CodeBlock
            title="Prisma: Basic DELETE"
            language="prisma"
            code={`// Delete single record
const user = await prisma.user.delete({
  where: { id: 1 },
});

// Delete many records
const result = await prisma.user.deleteMany({
  where: {
    status: 'inactive',
  },
});

// Delete with conditions
const result = await prisma.product.deleteMany({
  where: {
    stock: 0,
    discontinued: true,
  },
});

// Delete all records (be careful!)
const result = await prisma.tempTable.deleteMany({});

// Delete with date conditions
const result = await prisma.log.deleteMany({
  where: {
    createdAt: {
      lt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),  // 1 year ago
    },
  },
});`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">DELETE with JOIN</h2>

          <CodeBlock
            title="SQL: DELETE with JOIN"
            language="sql"
            code={`-- DELETE with USING clause (PostgreSQL syntax)
DELETE FROM orders o
USING users u
WHERE o.user_id = u.id
  AND u.status = 'deleted';

-- DELETE with subquery (more portable)
DELETE FROM orders
WHERE user_id IN (
  SELECT id FROM users WHERE status = 'deleted'
);

-- DELETE with EXISTS
DELETE FROM order_items oi
WHERE EXISTS (
  SELECT 1 FROM orders o
  WHERE o.id = oi.order_id
    AND o.status = 'cancelled'
);

-- DELETE with multiple JOINs
DELETE FROM order_items oi
USING orders o
JOIN users u ON o.user_id = u.id
WHERE oi.order_id = o.id
  AND u.email = 'admin@example.com'
  AND o.status = 'pending';

-- DELETE with CTE
WITH orders_to_delete AS (
  SELECT o.id
  FROM orders o
  JOIN users u ON o.user_id = u.id
  WHERE u.status = 'deleted'
)
DELETE FROM orders
WHERE id IN (SELECT id FROM orders_to_delete);`}
          />
          <CodeBlock
            title="Prisma: DELETE with JOIN"
            language="prisma"
            code={`// Prisma doesn't support DELETE with JOIN directly
// Use raw SQL or multiple queries

// Using raw SQL
await prisma.$executeRaw\`
  DELETE FROM orders o
  USING users u
  WHERE o.user_id = u.id
    AND u.status = 'deleted'
\`;

// Or use Prisma queries
const deletedUsers = await prisma.user.findMany({
  where: { status: 'deleted' },
  select: { id: true },
});

const deletedUserIds = deletedUsers.map(u => u.id);

await prisma.order.deleteMany({
  where: {
    userId: {
      in: deletedUserIds,
    },
  },
});

// Complex DELETE with raw SQL
await prisma.$executeRaw\`
  DELETE FROM order_items oi
  USING orders o
  JOIN users u ON o.user_id = u.id
  WHERE oi.order_id = o.id
    AND u.email = 'admin@example.com'
    AND o.status = 'pending'
\`;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">DELETE ... RETURNING</h2>

          <CodeBlock
            title="SQL: DELETE ... RETURNING"
            language="sql"
            code={`-- Return deleted row
DELETE FROM users
WHERE id = 1
RETURNING *;

-- Return specific columns
DELETE FROM products
WHERE discontinued = true
RETURNING id, name, price;

-- Return with expressions
DELETE FROM orders
WHERE status = 'cancelled'
RETURNING id, user_id, total, created_at, AGE(created_at) AS order_age;

-- Return multiple deleted rows
DELETE FROM users
WHERE status = 'inactive'
  AND last_login < CURRENT_DATE - INTERVAL '1 year'
RETURNING id, username, email, last_login;

-- Use RETURNING in CTE
WITH deleted_users AS (
  DELETE FROM users
  WHERE status = 'inactive'
  RETURNING id, username, email
)
INSERT INTO users_archive (user_id, username, email, archived_at)
SELECT id, username, email, CURRENT_TIMESTAMP
FROM deleted_users;`}
          />
          <CodeBlock
            title="Prisma: DELETE ... RETURNING"
            language="prisma"
            code={`// Prisma automatically returns deleted data
const user = await prisma.user.delete({
  where: { id: 1 },
  // Returns deleted user object
});

// Select specific fields
const user = await prisma.user.delete({
  where: { id: 1 },
  select: {
    id: true,
    username: true,
    email: true,
  },
});

// deleteMany doesn't return records
const result = await prisma.user.deleteMany({
  where: {
    status: 'inactive',
    lastLogin: {
      lt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
    },
  },
});
// result.count = number of deleted rows

// Use raw SQL for complex RETURNING
const deleted = await prisma.$queryRaw\`
  DELETE FROM orders
  WHERE status = 'cancelled'
  RETURNING id, user_id, total, created_at, AGE(created_at) AS order_age
\`;

// Delete and archive in transaction
const result = await prisma.$transaction(async (tx) => {
  const deletedUsers = await tx.$queryRaw\`
    DELETE FROM users
    WHERE status = 'inactive'
    RETURNING id, username, email
  \`;
  
  if (deletedUsers.length > 0) {
    await tx.userArchive.createMany({
      data: deletedUsers.map(u => ({
        userId: u.id,
        username: u.username,
        email: u.email,
        archivedAt: new Date(),
      })),
    });
  }
  
  return deletedUsers;
});`}
          />
        </section>
      </div>
    </LessonLayout>
  );
}


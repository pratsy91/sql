import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Query Patterns - PostgreSQL Learning',
  description: 'Learn about common query patterns and anti-patterns to avoid',
};

export default function QueryPatterns() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Query Patterns</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Common Patterns</h2>

          <CodeBlock
            title="SQL: Common Query Patterns"
            language="sql"
            code={`-- Pattern 1: Pagination
SELECT * FROM users
ORDER BY id
LIMIT 10 OFFSET 20;

-- Better: Cursor-based pagination
SELECT * FROM users
WHERE id > 20
ORDER BY id
LIMIT 10;

-- Pattern 2: Existence check
-- Good: Use EXISTS
SELECT EXISTS(
  SELECT 1 FROM orders 
  WHERE user_id = 1
);

-- Pattern 3: Conditional aggregation
SELECT 
  COUNT(*) FILTER (WHERE status = 'active') AS active_count,
  COUNT(*) FILTER (WHERE status = 'inactive') AS inactive_count
FROM users;

-- Pattern 4: Latest record per group
SELECT DISTINCT ON (user_id) *
FROM orders
ORDER BY user_id, created_at DESC;

-- Pattern 5: Running totals
SELECT 
  id,
  amount,
  SUM(amount) OVER (ORDER BY id) AS running_total
FROM transactions;

-- Pattern 6: Rank within groups
SELECT 
  user_id,
  amount,
  RANK() OVER (PARTITION BY user_id ORDER BY amount DESC) AS rank
FROM orders;

-- Pattern 7: Self-join for hierarchy
SELECT 
  e.id,
  e.name,
  m.name AS manager_name
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.id;

-- Pattern 8: Soft delete filtering
SELECT * FROM users
WHERE deleted_at IS NULL;

-- Pattern 9: Date range queries
SELECT * FROM orders
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
  AND created_at < CURRENT_DATE;

-- Pattern 10: Case-insensitive search
SELECT * FROM users
WHERE LOWER(email) = LOWER('user@example.com');`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Anti-patterns to Avoid</h2>

          <CodeBlock
            title="SQL: Anti-patterns"
            language="sql"
            code={`-- Anti-pattern 1: SELECT * (when not needed)
-- Bad:
SELECT * FROM users WHERE id = 1;

-- Good:
SELECT id, email, name FROM users WHERE id = 1;

-- Anti-pattern 2: N+1 queries
-- Bad: Multiple queries in loop
-- SELECT * FROM users;
-- For each user: SELECT * FROM posts WHERE user_id = ?

-- Good: Single query with JOIN
SELECT u.*, p.*
FROM users u
LEFT JOIN posts p ON u.id = p.user_id;

-- Anti-pattern 3: Functions in WHERE clause
-- Bad: Can't use index
SELECT * FROM users
WHERE LOWER(email) = 'user@example.com';

-- Good: Use index-friendly query
SELECT * FROM users
WHERE email = 'user@example.com';

-- Or create expression index:
CREATE INDEX idx_users_email_lower ON users(LOWER(email));

-- Anti-pattern 4: LIKE without index
-- Bad: Full table scan
SELECT * FROM users
WHERE name LIKE '%john%';

-- Good: Use full-text search or prefix search
SELECT * FROM users
WHERE name LIKE 'john%';  -- Can use index

-- Or use full-text search:
SELECT * FROM users
WHERE to_tsvector('english', name) @@ to_tsquery('english', 'john');

-- Anti-pattern 5: Subquery instead of JOIN
-- Bad:
SELECT * FROM users
WHERE id IN (SELECT user_id FROM orders WHERE total > 1000);

-- Good:
SELECT DISTINCT u.*
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE o.total > 1000;

-- Anti-pattern 6: COUNT(*) when checking existence
-- Bad:
SELECT COUNT(*) FROM orders WHERE user_id = 1;
-- Returns 0 or > 0

-- Good:
SELECT EXISTS(SELECT 1 FROM orders WHERE user_id = 1);

-- Anti-pattern 7: ORDER BY with non-indexed column
-- Bad: Slow for large tables
SELECT * FROM users
ORDER BY created_at DESC
LIMIT 10;

-- Good: Ensure index exists
CREATE INDEX idx_users_created_at ON users(created_at);
SELECT * FROM users
ORDER BY created_at DESC
LIMIT 10;

-- Anti-pattern 8: Multiple OR conditions
-- Bad: May not use index efficiently
SELECT * FROM users
WHERE status = 'active' OR status = 'pending' OR status = 'review';

-- Good: Use IN
SELECT * FROM users
WHERE status IN ('active', 'pending', 'review');

-- Anti-pattern 9: Implicit type conversion
-- Bad: May prevent index usage
SELECT * FROM users
WHERE id = '1';  -- String instead of integer

-- Good: Use correct type
SELECT * FROM users
WHERE id = 1;

-- Anti-pattern 10: Missing indexes on foreign keys
-- Bad: Slow JOINs
SELECT u.*, p.*
FROM users u
JOIN posts p ON u.id = p.user_id;  -- No index on p.user_id

-- Good: Index foreign keys
CREATE INDEX idx_posts_user_id ON posts(user_id);`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Performance Patterns</h2>

          <CodeBlock
            title="SQL: Performance Optimization Patterns"
            language="sql"
            code={`-- Pattern 1: Use EXPLAIN ANALYZE
EXPLAIN ANALYZE
SELECT * FROM users WHERE email = 'user@example.com';

-- Pattern 2: Use covering indexes
CREATE INDEX idx_users_email_covering 
ON users(email) 
INCLUDE (name, created_at);

SELECT email, name, created_at
FROM users
WHERE email = 'user@example.com';
-- Can use index-only scan

-- Pattern 3: Batch operations
-- Bad: Multiple INSERTs
INSERT INTO users (email) VALUES ('user1@example.com');
INSERT INTO users (email) VALUES ('user2@example.com');

-- Good: Single INSERT with multiple values
INSERT INTO users (email) VALUES 
  ('user1@example.com'),
  ('user2@example.com');

-- Pattern 4: Use CTEs for complex queries
WITH recent_orders AS (
  SELECT * FROM orders
  WHERE created_at > CURRENT_DATE - INTERVAL '30 days'
),
user_totals AS (
  SELECT user_id, SUM(total) AS total_amount
  FROM recent_orders
  GROUP BY user_id
)
SELECT u.name, ut.total_amount
FROM users u
JOIN user_totals ut ON u.id = ut.user_id;

-- Pattern 5: Use materialized views for expensive queries
CREATE MATERIALIZED VIEW user_order_stats AS
SELECT 
  u.id,
  u.name,
  COUNT(o.id) AS order_count,
  SUM(o.total) AS total_spent
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id, u.name;

-- Refresh periodically
REFRESH MATERIALIZED VIEW user_order_stats;

-- Pattern 6: Use partial indexes
CREATE INDEX idx_users_active_email 
ON users(email) 
WHERE is_active = TRUE;

-- Pattern 7: Use prepared statements
PREPARE get_user AS
SELECT * FROM users WHERE id = $1;

EXECUTE get_user(1);

-- Pattern 8: Limit result sets
SELECT * FROM users
ORDER BY created_at DESC
LIMIT 100;  -- Don't fetch more than needed`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Prisma: Query Patterns</h2>

          <CodeBlock
            title="Prisma: Common Patterns"
            language="prisma"
            code={`// Pattern 1: Pagination
const users = await prisma.user.findMany({
  skip: 20,
  take: 10,
  orderBy: { id: 'asc' }
});

// Cursor-based pagination
const users = await prisma.user.findMany({
  take: 10,
  cursor: { id: 20 },
  orderBy: { id: 'asc' }
});

// Pattern 2: Existence check
const exists = await prisma.order.findFirst({
  where: { userId: 1 },
  select: { id: true }
}) !== null;

// Better: Use count
const exists = (await prisma.order.count({
  where: { userId: 1 }
})) > 0;

// Pattern 3: Conditional aggregation
const stats = await prisma.user.groupBy({
  by: ['status'],
  _count: { id: true }
});

// Pattern 4: Latest record per group
const latestOrders = await prisma.$queryRaw\`
  SELECT DISTINCT ON (user_id) *
  FROM orders
  ORDER BY user_id, created_at DESC
\`;

// Pattern 5: Include relations
const users = await prisma.user.findMany({
  include: {
    posts: true,
    profile: true
  }
});

// Pattern 6: Select specific fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
    name: true
  }
});

// Pattern 7: Complex filtering
const users = await prisma.user.findMany({
  where: {
    OR: [
      { email: { contains: 'admin' } },
      { role: 'ADMIN' }
    ],
    AND: [
      { isActive: true },
      { createdAt: { gte: new Date('2024-01-01') } }
    ]
  }
});

// Pattern 8: Soft delete
const activeUsers = await prisma.user.findMany({
  where: { deletedAt: null }
});

// Pattern 9: Batch operations
const users = await prisma.user.createMany({
  data: [
    { email: 'user1@example.com', name: 'User 1' },
    { email: 'user2@example.com', name: 'User 2' }
  ],
  skipDuplicates: true
});

// Pattern 10: Transactions
const result = await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({
    data: { email: 'user@example.com' }
  });
  
  const post = await tx.post.create({
    data: {
      title: 'Post',
      userId: user.id
    }
  });
  
  return { user, post };
});

// Anti-pattern: N+1 queries
// Bad:
const users = await prisma.user.findMany();
for (const user of users) {
  const posts = await prisma.post.findMany({
    where: { userId: user.id }
  });
}

// Good: Use include
const users = await prisma.user.findMany({
  include: {
    posts: true
  }
});

// Anti-pattern: SELECT * equivalent
// Bad: Fetching all fields
const users = await prisma.user.findMany();

// Good: Select only needed fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true
  }
});`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Avoid SELECT *</strong> - select only needed columns</li>
              <li><strong>Use indexes</strong> - on frequently queried columns</li>
              <li><strong>Use EXISTS</strong> - instead of COUNT(*) for existence checks</li>
              <li><strong>Avoid N+1 queries</strong> - use JOINs or include</li>
              <li><strong>Use prepared statements</strong> - for repeated queries</li>
              <li><strong>Limit result sets</strong> - use LIMIT/pagination</li>
              <li><strong>Use EXPLAIN ANALYZE</strong> - to understand query performance</li>
              <li><strong>Avoid functions in WHERE</strong> - unless indexed</li>
            </ul>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}


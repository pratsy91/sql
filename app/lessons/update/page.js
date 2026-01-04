import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'UPDATE - PostgreSQL Learning',
  description: 'Learn about UPDATE statements in PostgreSQL including basic UPDATE, UPDATE with JOIN, RETURNING, and FROM clause',
};

export default function Update() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">UPDATE</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Basic UPDATE</h2>

          <CodeBlock
            title="SQL: Basic UPDATE"
            language="sql"
            code={`-- Update single row
UPDATE users
SET email = 'newemail@example.com'
WHERE id = 1;

-- Update multiple columns
UPDATE users
SET 
  email = 'newemail@example.com',
  username = 'newusername',
  updated_at = CURRENT_TIMESTAMP
WHERE id = 1;

-- Update all rows (be careful!)
UPDATE products
SET price = price * 1.1;  -- Increase all prices by 10%

-- Update with conditions
UPDATE products
SET stock = stock - 1
WHERE id = 100 AND stock > 0;

-- Update with expressions
UPDATE orders
SET total = (
  SELECT SUM(quantity * price)
  FROM order_items
  WHERE order_id = orders.id
)
WHERE id = 1;`}
          />
          <CodeBlock
            title="Prisma: Basic UPDATE"
            language="prisma"
            code={`// Update single record
const user = await prisma.user.update({
  where: { id: 1 },
  data: {
    email: 'newemail@example.com',
  },
});

// Update multiple fields
const user = await prisma.user.update({
  where: { id: 1 },
  data: {
    email: 'newemail@example.com',
    username: 'newusername',
  },
});

// Update many records
const result = await prisma.user.updateMany({
  where: {
    status: 'inactive',
  },
  data: {
    status: 'active',
  },
});

// Update with increment/decrement
const product = await prisma.product.update({
  where: { id: 100 },
  data: {
    stock: {
      decrement: 1,
    },
  },
});`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">UPDATE with JOIN</h2>

          <CodeBlock
            title="SQL: UPDATE with JOIN"
            language="sql"
            code={`-- UPDATE with INNER JOIN
UPDATE orders o
SET status = 'completed'
FROM users u
WHERE o.user_id = u.id
  AND u.email = 'admin@example.com';

-- UPDATE with explicit JOIN syntax
UPDATE orders o
SET total = oi.sum_total
FROM (
  SELECT order_id, SUM(quantity * price) AS sum_total
  FROM order_items
  GROUP BY order_id
) oi
WHERE o.id = oi.order_id;

-- UPDATE with multiple JOINs
UPDATE order_items oi
SET price = p.base_price
FROM orders o
JOIN products p ON oi.product_id = p.id
WHERE oi.order_id = o.id
  AND o.status = 'pending';

-- UPDATE using subquery
UPDATE users
SET last_login = CURRENT_TIMESTAMP
WHERE id IN (
  SELECT user_id
  FROM orders
  WHERE created_at > CURRENT_DATE - INTERVAL '1 day'
);`}
          />
          <CodeBlock
            title="Prisma: UPDATE with JOIN"
            language="prisma"
            code={`// Prisma doesn't support UPDATE with JOIN directly
// Use raw SQL or multiple queries

// Using raw SQL
await prisma.$executeRaw\`
  UPDATE orders o
  SET status = 'completed'
  FROM users u
  WHERE o.user_id = u.id
    AND u.email = 'admin@example.com'
\`;

// Or use Prisma queries
const adminUsers = await prisma.user.findMany({
  where: {
    email: 'admin@example.com',
  },
  select: { id: true },
});

const adminUserIds = adminUsers.map(u => u.id);

await prisma.order.updateMany({
  where: {
    userId: {
      in: adminUserIds,
    },
  },
  data: {
    status: 'completed',
  },
});

// Complex UPDATE with raw SQL
await prisma.$executeRaw\`
  UPDATE order_items oi
  SET price = p.base_price
  FROM orders o
  JOIN products p ON oi.product_id = p.id
  WHERE oi.order_id = o.id
    AND o.status = 'pending'
\`;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">UPDATE ... RETURNING</h2>

          <CodeBlock
            title="SQL: UPDATE ... RETURNING"
            language="sql"
            code={`-- Return updated row
UPDATE users
SET email = 'newemail@example.com'
WHERE id = 1
RETURNING *;

-- Return specific columns
UPDATE users
SET status = 'active'
WHERE id = 1
RETURNING id, username, email, status;

-- Return with expressions
UPDATE products
SET price = price * 1.1
WHERE category_id = 1
RETURNING id, name, price, price / 1.1 AS old_price;

-- Return multiple updated rows
UPDATE users
SET last_login = CURRENT_TIMESTAMP
WHERE status = 'active'
RETURNING id, username, last_login;

-- Use RETURNING in CTE
WITH updated_users AS (
  UPDATE users
  SET status = 'inactive'
  WHERE last_login < CURRENT_DATE - INTERVAL '1 year'
  RETURNING id, username
)
SELECT * FROM updated_users;`}
          />
          <CodeBlock
            title="Prisma: UPDATE ... RETURNING"
            language="prisma"
            code={`// Prisma automatically returns updated data
const user = await prisma.user.update({
  where: { id: 1 },
  data: {
    email: 'newemail@example.com',
  },
  // Returns updated user object
});

// Select specific fields
const user = await prisma.user.update({
  where: { id: 1 },
  data: {
    status: 'active',
  },
  select: {
    id: true,
    username: true,
    email: true,
    status: true,
  },
});

// Update many doesn't return records
const result = await prisma.user.updateMany({
  where: { status: 'active' },
  data: { lastLogin: new Date() },
});
// result.count = number of updated rows

// Use raw SQL for complex RETURNING
const updated = await prisma.$queryRaw\`
  UPDATE products
  SET price = price * 1.1
  WHERE category_id = 1
  RETURNING id, name, price, price / 1.1 AS old_price
\`;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">UPDATE with FROM Clause</h2>

          <CodeBlock
            title="SQL: UPDATE with FROM"
            language="sql"
            code={`-- UPDATE with FROM clause
UPDATE orders
SET total = order_totals.sum_total
FROM (
  SELECT order_id, SUM(quantity * price) AS sum_total
  FROM order_items
  GROUP BY order_id
) AS order_totals
WHERE orders.id = order_totals.order_id;

-- UPDATE with FROM and WHERE
UPDATE products p
SET category_name = c.name
FROM categories c
WHERE p.category_id = c.id
  AND p.category_name IS NULL;

-- UPDATE with multiple FROM tables
UPDATE order_items oi
SET 
  product_name = p.name,
  category_name = c.name
FROM products p
JOIN categories c ON p.category_id = c.id
WHERE oi.product_id = p.id;

-- UPDATE with FROM and subquery
UPDATE users
SET order_count = (
  SELECT COUNT(*)
  FROM orders
  WHERE orders.user_id = users.id
)
FROM (
  SELECT DISTINCT user_id
  FROM orders
  WHERE created_at > CURRENT_DATE - INTERVAL '30 days'
) recent_orders
WHERE users.id = recent_orders.user_id;`}
          />
        </section>
      </div>
    </LessonLayout>
  );
}


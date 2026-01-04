import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Subqueries - PostgreSQL Learning',
  description: 'Learn about subqueries in PostgreSQL including scalar, correlated, EXISTS, IN, and ANY/ALL operators',
};

export default function Subqueries() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Subqueries</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Scalar Subqueries</h2>
          <p className="mb-4">
            Scalar subqueries return a single value and can be used in SELECT, WHERE, and other clauses.
          </p>

          <CodeBlock
            title="SQL: Scalar Subqueries"
            language="sql"
            code={`-- Scalar subquery in SELECT
SELECT 
  name,
  price,
  (SELECT AVG(price) FROM products) AS avg_price,
  price - (SELECT AVG(price) FROM products) AS price_diff
FROM products;

-- Scalar subquery in WHERE
SELECT * FROM products
WHERE price > (SELECT AVG(price) FROM products);

-- Scalar subquery in UPDATE
UPDATE products
SET discount = (SELECT AVG(price) * 0.1 FROM products)
WHERE id = 1;

-- Multiple scalar subqueries
SELECT 
  name,
  (SELECT COUNT(*) FROM orders) AS total_orders,
  (SELECT SUM(total) FROM orders) AS total_revenue,
  (SELECT AVG(total) FROM orders) AS avg_order_value
FROM products
LIMIT 1;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Correlated Subqueries</h2>
          <p className="mb-4">
            Correlated subqueries reference columns from the outer query.
          </p>

          <CodeBlock
            title="SQL: Correlated Subqueries"
            language="sql"
            code={`-- Correlated subquery in SELECT
SELECT 
  u.id,
  u.username,
  (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) AS order_count,
  (SELECT SUM(total) FROM orders o WHERE o.user_id = u.id) AS total_spent
FROM users u;

-- Correlated subquery in WHERE
SELECT * FROM users u
WHERE (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) > 5;

-- Correlated subquery with comparison
SELECT * FROM products p1
WHERE p1.price > (
  SELECT AVG(price) 
  FROM products p2 
  WHERE p2.category_id = p1.category_id
);`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">EXISTS and NOT EXISTS</h2>

          <CodeBlock
            title="SQL: EXISTS / NOT EXISTS"
            language="sql"
            code={`-- EXISTS (returns true if subquery returns any rows)
SELECT * FROM users u
WHERE EXISTS (
  SELECT 1 FROM orders o 
  WHERE o.user_id = u.id AND o.total > 100
);

-- NOT EXISTS
SELECT * FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM orders o WHERE o.user_id = u.id
);

-- EXISTS with multiple conditions
SELECT * FROM products p
WHERE EXISTS (
  SELECT 1 FROM order_items oi
  JOIN orders o ON oi.order_id = o.id
  WHERE oi.product_id = p.id
    AND o.status = 'completed'
    AND o.created_at > CURRENT_DATE - INTERVAL '30 days'
);`}
          />
          <CodeBlock
            title="Prisma: EXISTS"
            language="prisma"
            code={`// Prisma handles EXISTS through relation filters
const users = await prisma.user.findMany({
  where: {
    orders: {
      some: {
        total: { gt: 100 },
      },
    },
  },
});

// NOT EXISTS
const usersWithoutOrders = await prisma.user.findMany({
  where: {
    orders: {
      none: {},
    },
  },
});

// Complex EXISTS with raw SQL
const users = await prisma.$queryRaw\`
  SELECT * FROM users u
  WHERE EXISTS (
    SELECT 1 FROM orders o 
    WHERE o.user_id = u.id AND o.total > 100
  )
\`;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">IN and NOT IN Subqueries</h2>

          <CodeBlock
            title="SQL: IN / NOT IN Subqueries"
            language="sql"
            code={`-- IN subquery
SELECT * FROM users
WHERE id IN (SELECT user_id FROM orders WHERE total > 100);

-- NOT IN subquery
SELECT * FROM users
WHERE id NOT IN (SELECT user_id FROM orders);

-- IN with multiple columns
SELECT * FROM order_items
WHERE (order_id, product_id) IN (
  SELECT order_id, product_id 
  FROM order_items_backup
);

-- NULL handling in NOT IN
-- Note: NOT IN returns no rows if subquery contains NULL
SELECT * FROM users
WHERE id NOT IN (
  SELECT user_id FROM orders WHERE user_id IS NOT NULL
);`}
          />
          <CodeBlock
            title="Prisma: IN Subqueries"
            language="prisma"
            code={`// Prisma handles IN through relation filters
const users = await prisma.user.findMany({
  where: {
    orders: {
      some: {
        total: { gt: 100 },
      },
    },
  },
});

// Or use raw SQL
const users = await prisma.$queryRaw\`
  SELECT * FROM users
  WHERE id IN (SELECT user_id FROM orders WHERE total > 100)
\`;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">ANY and ALL Operators</h2>

          <CodeBlock
            title="SQL: ANY / ALL"
            language="sql"
            code={`-- ANY (true if any value matches)
SELECT * FROM products
WHERE price > ANY (SELECT price FROM products WHERE category_id = 1);

-- Equivalent to:
SELECT * FROM products
WHERE price > (SELECT MIN(price) FROM products WHERE category_id = 1);

-- ALL (true if all values match)
SELECT * FROM products
WHERE price > ALL (SELECT price FROM products WHERE category_id = 1);

-- Equivalent to:
SELECT * FROM products
WHERE price > (SELECT MAX(price) FROM products WHERE category_id = 1);

-- ANY with operators
SELECT * FROM products
WHERE price = ANY (ARRAY[10, 20, 30]);

-- ALL with comparison
SELECT * FROM orders
WHERE total >= ALL (
  SELECT total FROM orders WHERE user_id = 1
);`}
          />
        </section>
      </div>
    </LessonLayout>
  );
}


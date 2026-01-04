import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'JOINs - PostgreSQL Learning',
  description: 'Learn about JOINs in PostgreSQL including INNER, LEFT, RIGHT, FULL OUTER, CROSS joins, self joins, and multiple joins',
};

export default function Joins() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">JOINs</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">INNER JOIN</h2>
          <p className="mb-4">
            Returns only rows that have matching values in both tables.
          </p>

          <CodeBlock
            title="SQL: INNER JOIN"
            language="sql"
            code={`-- Basic INNER JOIN
SELECT u.id, u.username, p.bio, p.avatar
FROM users u
INNER JOIN profiles p ON u.id = p.user_id;

-- INNER JOIN with WHERE
SELECT u.username, o.total, o.created_at
FROM users u
INNER JOIN orders o ON u.id = o.user_id
WHERE o.total > 100;

-- Multiple INNER JOINs
SELECT 
  u.username,
  o.order_number,
  oi.quantity,
  p.name AS product_name
FROM users u
INNER JOIN orders o ON u.id = o.user_id
INNER JOIN order_items oi ON o.id = oi.order_id
INNER JOIN products p ON oi.product_id = p.id;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">LEFT JOIN / LEFT OUTER JOIN</h2>
          <p className="mb-4">
            Returns all rows from the left table and matching rows from the right table. NULLs for non-matching rows.
          </p>

          <CodeBlock
            title="SQL: LEFT JOIN"
            language="sql"
            code={`-- LEFT JOIN (returns all users, even without orders)
SELECT u.username, o.total, o.created_at
FROM users u
LEFT JOIN orders o ON u.id = o.user_id;

-- LEFT JOIN with WHERE (filters NULLs, effectively INNER JOIN)
SELECT u.username, o.total
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE o.id IS NOT NULL;

-- LEFT JOIN to find users without orders
SELECT u.username
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE o.id IS NULL;

-- Multiple LEFT JOINs
SELECT 
  u.username,
  p.bio,
  o.total
FROM users u
LEFT JOIN profiles p ON u.id = p.user_id
LEFT JOIN orders o ON u.id = o.user_id;`}
          />
          <CodeBlock
            title="Prisma: LEFT JOIN"
            language="prisma"
            code={`// Prisma's include creates LEFT JOINs
const users = await prisma.user.findMany({
  include: {
    profile: true,  // LEFT JOIN profiles
    orders: true,   // LEFT JOIN orders
  },
});

// Filter users with orders
const usersWithOrders = await prisma.user.findMany({
  where: {
    orders: {
      some: {},  // Has at least one order
    },
  },
  include: {
    orders: true,
  },
});

// Users without orders
const usersWithoutOrders = await prisma.user.findMany({
  where: {
    orders: {
      none: {},  // Has no orders
    },
  },
});`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">RIGHT JOIN / RIGHT OUTER JOIN</h2>
          <p className="mb-4">
            Returns all rows from the right table and matching rows from the left table. Less commonly used.
          </p>

          <CodeBlock
            title="SQL: RIGHT JOIN"
            language="sql"
            code={`-- RIGHT JOIN (returns all orders, even without users)
SELECT u.username, o.total, o.created_at
FROM users u
RIGHT JOIN orders o ON u.id = o.user_id;

-- RIGHT JOIN to find orphaned orders
SELECT o.id, o.total
FROM users u
RIGHT JOIN orders o ON u.id = o.user_id
WHERE u.id IS NULL;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">FULL OUTER JOIN</h2>
          <p className="mb-4">
            Returns all rows from both tables, with NULLs where there's no match.
          </p>

          <CodeBlock
            title="SQL: FULL OUTER JOIN"
            language="sql"
            code={`-- FULL OUTER JOIN
SELECT u.username, o.total
FROM users u
FULL OUTER JOIN orders o ON u.id = o.user_id;

-- FULL OUTER JOIN to find all mismatches
SELECT 
  u.username,
  o.total,
  CASE 
    WHEN u.id IS NULL THEN 'Orphaned order'
    WHEN o.id IS NULL THEN 'User without orders'
    ELSE 'Matched'
  END AS match_status
FROM users u
FULL OUTER JOIN orders o ON u.id = o.user_id;`}
          />
          <CodeBlock
            title="Prisma: FULL OUTER JOIN"
            language="prisma"
            code={`// Prisma doesn't support FULL OUTER JOIN directly
// Use raw SQL

const result = await prisma.$queryRaw\`
  SELECT u.username, o.total
  FROM users u
  FULL OUTER JOIN orders o ON u.id = o.user_id
\`;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">CROSS JOIN</h2>
          <p className="mb-4">
            Returns the Cartesian product of both tables (every row from first table combined with every row from second).
          </p>

          <CodeBlock
            title="SQL: CROSS JOIN"
            language="sql"
            code={`-- CROSS JOIN (all combinations)
SELECT u.username, p.name AS product_name
FROM users u
CROSS JOIN products p;

-- Equivalent syntax
SELECT u.username, p.name
FROM users u, products p;

-- CROSS JOIN with WHERE (behaves like INNER JOIN)
SELECT u.username, p.name
FROM users u
CROSS JOIN products p
WHERE u.id = p.owner_id;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Self Joins</h2>

          <CodeBlock
            title="SQL: Self Joins"
            language="sql"
            code={`-- Self join (table joined with itself)
SELECT 
  e1.id,
  e1.name AS employee_name,
  e2.name AS manager_name
FROM employees e1
LEFT JOIN employees e2 ON e1.manager_id = e2.id;

-- Self join for hierarchical data
SELECT 
  c1.name AS category,
  c2.name AS parent_category
FROM categories c1
LEFT JOIN categories c2 ON c1.parent_id = c2.id;

-- Self join for comparisons
SELECT 
  p1.name AS product1,
  p2.name AS product2,
  p1.price - p2.price AS price_difference
FROM products p1
CROSS JOIN products p2
WHERE p1.category_id = p2.category_id
  AND p1.id < p2.id;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Multiple Joins</h2>

          <CodeBlock
            title="SQL: Multiple Joins"
            language="sql"
            code={`-- Chain multiple JOINs
SELECT 
  u.username,
  o.order_number,
  oi.quantity,
  p.name AS product_name,
  c.name AS category_name
FROM users u
INNER JOIN orders o ON u.id = o.user_id
INNER JOIN order_items oi ON o.id = oi.order_id
INNER JOIN products p ON oi.product_id = p.id
LEFT JOIN categories c ON p.category_id = c.id;

-- Mix different JOIN types
SELECT 
  u.username,
  p.bio,
  o.total
FROM users u
LEFT JOIN profiles p ON u.id = p.user_id
INNER JOIN orders o ON u.id = o.user_id
WHERE o.total > 100;`}
          />
          <CodeBlock
            title="Prisma: Multiple Joins"
            language="prisma"
            code={`// Prisma handles multiple joins through nested includes
const users = await prisma.user.findMany({
  include: {
    profile: true,
    orders: {
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    },
  },
});

// Complex joins with raw SQL
const result = await prisma.$queryRaw\`
  SELECT 
    u.username,
    o.order_number,
    oi.quantity,
    p.name AS product_name
  FROM users u
  INNER JOIN orders o ON u.id = o.user_id
  INNER JOIN order_items oi ON o.id = oi.order_id
  INNER JOIN products p ON oi.product_id = p.id
\`;`}
          />
        </section>
      </div>
    </LessonLayout>
  );
}


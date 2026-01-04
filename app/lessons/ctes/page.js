import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Common Table Expressions (CTEs) - PostgreSQL Learning',
  description: 'Learn about CTEs in PostgreSQL including basic CTEs, multiple CTEs, and recursive CTEs',
};

export default function CTEs() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Common Table Expressions (CTEs)</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Basic CTEs</h2>
          <p className="mb-4">
            Common Table Expressions (CTEs) create temporary named result sets that can be referenced in the main query.
          </p>

          <CodeBlock
            title="SQL: Basic CTEs"
            language="sql"
            code={`-- Simple CTE
WITH active_users AS (
  SELECT * FROM users WHERE status = 'active'
)
SELECT * FROM active_users;

-- CTE with alias
WITH user_stats AS (
  SELECT 
    user_id,
    COUNT(*) AS order_count,
    SUM(total) AS total_spent
  FROM orders
  GROUP BY user_id
)
SELECT u.username, us.order_count, us.total_spent
FROM users u
JOIN user_stats us ON u.id = us.user_id;

-- CTE for readability
WITH expensive_products AS (
  SELECT * FROM products WHERE price > 100
),
recent_orders AS (
  SELECT * FROM orders WHERE created_at > CURRENT_DATE - INTERVAL '30 days'
)
SELECT ep.name, COUNT(ro.id) AS order_count
FROM expensive_products ep
LEFT JOIN order_items oi ON ep.id = oi.product_id
LEFT JOIN recent_orders ro ON oi.order_id = ro.id
GROUP BY ep.id, ep.name;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Multiple CTEs</h2>

          <CodeBlock
            title="SQL: Multiple CTEs"
            language="sql"
            code={`-- Multiple CTEs in sequence
WITH 
  active_users AS (
    SELECT * FROM users WHERE status = 'active'
  ),
  recent_orders AS (
    SELECT * FROM orders 
    WHERE created_at > CURRENT_DATE - INTERVAL '7 days'
  ),
  user_order_stats AS (
    SELECT 
      u.id,
      u.username,
      COUNT(o.id) AS recent_order_count,
      SUM(o.total) AS recent_total
    FROM active_users u
    LEFT JOIN recent_orders o ON u.id = o.user_id
    GROUP BY u.id, u.username
  )
SELECT * FROM user_order_stats
ORDER BY recent_total DESC;

-- CTEs can reference previous CTEs
WITH 
  base_data AS (SELECT * FROM users),
  filtered_data AS (SELECT * FROM base_data WHERE status = 'active'),
  aggregated_data AS (
    SELECT status, COUNT(*) FROM filtered_data GROUP BY status
  )
SELECT * FROM aggregated_data;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Recursive CTEs</h2>
          <p className="mb-4">
            Recursive CTEs allow queries to reference themselves, useful for hierarchical data.
          </p>

          <CodeBlock
            title="SQL: Recursive CTEs"
            language="sql"
            code={`-- Recursive CTE structure
WITH RECURSIVE category_tree AS (
  -- Base case (anchor)
  SELECT id, name, parent_id, 0 AS level, ARRAY[id] AS path
  FROM categories 
  WHERE parent_id IS NULL
  
  UNION ALL
  
  -- Recursive case
  SELECT 
    c.id,
    c.name,
    c.parent_id,
    ct.level + 1,
    ct.path || c.id
  FROM categories c
  JOIN category_tree ct ON c.parent_id = ct.id
)
SELECT * FROM category_tree
ORDER BY path;

-- Employee hierarchy
WITH RECURSIVE employee_hierarchy AS (
  -- Top-level employees (no manager)
  SELECT id, name, manager_id, 0 AS level
  FROM employees
  WHERE manager_id IS NULL
  
  UNION ALL
  
  -- Subordinates
  SELECT 
    e.id,
    e.name,
    e.manager_id,
    eh.level + 1
  FROM employees e
  JOIN employee_hierarchy eh ON e.manager_id = eh.id
)
SELECT * FROM employee_hierarchy
ORDER BY level, name;

-- Prevent infinite loops with depth limit
WITH RECURSIVE category_tree AS (
  SELECT id, name, parent_id, 0 AS level
  FROM categories WHERE parent_id IS NULL
  
  UNION ALL
  
  SELECT 
    c.id,
    c.name,
    c.parent_id,
    ct.level + 1
  FROM categories c
  JOIN category_tree ct ON c.parent_id = ct.id
  WHERE ct.level < 10  -- Prevent infinite recursion
)
SELECT * FROM category_tree;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">CTEs in DML Statements</h2>

          <CodeBlock
            title="SQL: CTEs with DML"
            language="sql"
            code={`-- CTE with UPDATE
WITH top_users AS (
  SELECT id FROM users ORDER BY created_at DESC LIMIT 10
)
UPDATE users
SET status = 'vip'
WHERE id IN (SELECT id FROM top_users);

-- CTE with DELETE
WITH old_orders AS (
  SELECT id FROM orders 
  WHERE created_at < CURRENT_DATE - INTERVAL '1 year'
)
DELETE FROM orders
WHERE id IN (SELECT id FROM old_orders);

-- CTE with INSERT
WITH new_users AS (
  SELECT username, email FROM temp_users WHERE validated = true
)
INSERT INTO users (username, email)
SELECT username, email FROM new_users;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Prisma: CTEs</h2>

          <CodeBlock
            title="Prisma: CTEs"
            language="prisma"
            code={`// Prisma doesn't support CTEs directly
// Use raw SQL for all CTE operations

// Basic CTE
const result = await prisma.$queryRaw\`
  WITH active_users AS (
    SELECT * FROM users WHERE status = 'active'
  )
  SELECT * FROM active_users
\`;

// Multiple CTEs
const stats = await prisma.$queryRaw\`
  WITH 
    active_users AS (SELECT * FROM users WHERE status = 'active'),
    recent_orders AS (SELECT * FROM orders WHERE created_at > CURRENT_DATE - INTERVAL '7 days')
  SELECT 
    u.username,
    COUNT(o.id) AS order_count
  FROM active_users u
  LEFT JOIN recent_orders o ON u.id = o.user_id
  GROUP BY u.id, u.username
\`;

// Recursive CTE
const hierarchy = await prisma.$queryRaw\`
  WITH RECURSIVE category_tree AS (
    SELECT id, name, parent_id, 0 AS level
    FROM categories WHERE parent_id IS NULL
    UNION ALL
    SELECT c.id, c.name, c.parent_id, ct.level + 1
    FROM categories c
    JOIN category_tree ct ON c.parent_id = ct.id
  )
  SELECT * FROM category_tree
\`;

// CTE with UPDATE
await prisma.$executeRaw\`
  WITH top_users AS (
    SELECT id FROM users ORDER BY created_at DESC LIMIT 10
  )
  UPDATE users
  SET status = 'vip'
  WHERE id IN (SELECT id FROM top_users)
\`;`}
          />
        </section>
      </div>
    </LessonLayout>
  );
}


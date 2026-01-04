import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';

export const metadata = {
  title: 'PostgreSQL-Specific Features - Interview Cheatsheet',
  description: 'PostgreSQL-specific features and interview questions',
};

export default function PostgreSQLSpecificFeatures() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">PostgreSQL-Specific Features - Interview Cheatsheet</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">JSON/JSONB Support</h2>
          
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">JSON vs JSONB</h3>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Feature</th>
                  <th className="text-left p-2">JSON</th>
                  <th className="text-left p-2">JSONB</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-2">Storage</td>
                  <td className="p-2">Text format (exact copy)</td>
                  <td className="p-2">Binary format (parsed)</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">Indexing</td>
                  <td className="p-2">Limited</td>
                  <td className="p-2">Full GIN index support</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">Query Performance</td>
                  <td className="p-2">Slower (parses each time)</td>
                  <td className="p-2">Faster (pre-parsed)</td>
                </tr>
                <tr>
                  <td className="p-2">Use Case</td>
                  <td className="p-2">When exact formatting matters</td>
                  <td className="p-2">When querying/indexing needed (recommended)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <CodeBlock
            title="JSONB Operations"
            language="sql"
            code={`-- Create table with JSONB
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  metadata JSONB
);

-- Insert JSONB data
INSERT INTO products (name, metadata) VALUES (
  'Laptop',
  '{"brand": "Dell", "price": 999, "specs": {"ram": "16GB", "storage": "512GB"}}'::jsonb
);

-- Query JSONB
SELECT * FROM products WHERE metadata->>'brand' = 'Dell';
SELECT * FROM products WHERE metadata->'specs'->>'ram' = '16GB';
SELECT * FROM products WHERE metadata @> '{"brand": "Dell"}'::jsonb;

-- Update JSONB
UPDATE products 
SET metadata = jsonb_set(metadata, '{price}', '1099')
WHERE id = 1;

-- GIN index for JSONB
CREATE INDEX idx_products_metadata ON products USING GIN(metadata);`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Array Support</h2>
          
          <CodeBlock
            title="Array Operations"
            language="sql"
            code={`-- Create table with array
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  hobbies TEXT[],
  scores INTEGER[]
);

-- Insert arrays
INSERT INTO users (name, hobbies, scores) VALUES (
  'John',
  ARRAY['reading', 'swimming'],
  ARRAY[95, 87, 92]
);

-- Query arrays
SELECT * FROM users WHERE 'reading' = ANY(hobbies);
SELECT * FROM users WHERE hobbies @> ARRAY['reading'];
SELECT * FROM users WHERE 100 > ALL(scores);

-- Array functions
SELECT array_length(hobbies, 1) FROM users;
SELECT unnest(hobbies) FROM users WHERE id = 1;
SELECT array_agg(name) FROM users;

-- GIN index for arrays
CREATE INDEX idx_users_hobbies ON users USING GIN(hobbies);`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Full-Text Search</h2>
          
          <CodeBlock
            title="Full-Text Search"
            language="sql"
            code={`-- Create table with text search vector
CREATE TABLE articles (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200),
  content TEXT,
  search_vector tsvector
);

-- Generate search vector
CREATE INDEX idx_articles_search ON articles USING GIN(search_vector);

-- Insert with search vector
INSERT INTO articles (title, content, search_vector) VALUES (
  'PostgreSQL Guide',
  'Learn PostgreSQL database',
  to_tsvector('english', title || ' ' || content)
);

-- Search
SELECT * FROM articles 
WHERE search_vector @@ to_tsquery('english', 'postgresql & database');

-- Ranking
SELECT 
  title,
  ts_rank(search_vector, to_tsquery('english', 'postgresql')) AS rank
FROM articles
WHERE search_vector @@ to_tsquery('english', 'postgresql')
ORDER BY rank DESC;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Window Functions</h2>
          
          <CodeBlock
            title="Advanced Window Functions"
            language="sql"
            code={`-- Window frame specifications
SELECT 
  date,
  amount,
  SUM(amount) OVER (
    ORDER BY date
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS running_total,
  AVG(amount) OVER (
    ORDER BY date
    ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
  ) AS moving_avg_3day
FROM sales;

-- Multiple window functions
SELECT 
  employee_id,
  department,
  salary,
  RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS dept_rank,
  RANK() OVER (ORDER BY salary DESC) AS overall_rank,
  LAG(salary) OVER (PARTITION BY department ORDER BY employee_id) AS prev_salary
FROM employees;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Common Table Expressions (CTEs) and Recursion</h2>
          
          <CodeBlock
            title="Recursive CTE Patterns"
            language="sql"
            code={`-- Hierarchical data (employees and managers)
WITH RECURSIVE employee_tree AS (
  -- Anchor: CEO (no manager)
  SELECT id, name, manager_id, 1 AS level, name AS path
  FROM employees
  WHERE manager_id IS NULL
  
  UNION ALL
  
  -- Recursive: Subordinates
  SELECT e.id, e.name, e.manager_id, et.level + 1, et.path || ' > ' || e.name
  FROM employees e
  JOIN employee_tree et ON e.manager_id = et.id
)
SELECT * FROM employee_tree;

-- Number series
WITH RECURSIVE numbers AS (
  SELECT 1 AS n
  UNION ALL
  SELECT n + 1 FROM numbers WHERE n < 100
)
SELECT * FROM numbers;

-- Graph traversal (shortest path)
WITH RECURSIVE graph_path AS (
  SELECT node, ARRAY[node] AS path, 0 AS depth
  FROM graph WHERE node = 'start'
  
  UNION ALL
  
  SELECT g.target, gp.path || g.target, gp.depth + 1
  FROM graph g
  JOIN graph_path gp ON g.source = gp.node
  WHERE NOT g.target = ANY(gp.path)  -- Prevent cycles
  AND gp.depth < 10
)
SELECT * FROM graph_path WHERE node = 'end' ORDER BY depth LIMIT 1;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Extensions</h2>
          
          <CodeBlock
            title="Popular Extensions"
            language="sql"
            code={`-- Enable extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- Trigram similarity
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";  -- Query statistics
CREATE EXTENSION IF NOT EXISTS "hstore";  -- Key-value pairs

-- UUID generation
SELECT uuid_generate_v4();

-- Trigram similarity (fuzzy text search)
CREATE INDEX idx_name_trgm ON users USING GIN(name gin_trgm_ops);
SELECT * FROM users WHERE name % 'john';  -- Similarity search

-- hstore (simple key-value)
CREATE TABLE settings (id SERIAL, config HSTORE);
INSERT INTO settings (config) VALUES ('"key1"=>"value1", "key2"=>"value2"');
SELECT config->'key1' FROM settings;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Advanced Features</h2>
          
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">UPSERT (INSERT ... ON CONFLICT)</h3>
            <CodeBlock
              title="UPSERT Pattern"
              language="sql"
              code={`-- Insert or update on conflict
INSERT INTO users (email, name)
VALUES ('test@example.com', 'John')
ON CONFLICT (email) 
DO UPDATE SET name = EXCLUDED.name, updated_at = NOW();

-- Insert or do nothing
INSERT INTO users (email, name)
VALUES ('test@example.com', 'John')
ON CONFLICT (email) DO NOTHING;

-- Multiple conflict targets
INSERT INTO user_settings (user_id, setting_key, value)
VALUES (1, 'theme', 'dark')
ON CONFLICT (user_id, setting_key) 
DO UPDATE SET value = EXCLUDED.value;`}
            />
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">RETURNING Clause</h3>
            <CodeBlock
              title="RETURNING Usage"
              language="sql"
              code={`-- INSERT with RETURNING
INSERT INTO users (name, email)
VALUES ('John', 'john@example.com')
RETURNING id, created_at;

-- UPDATE with RETURNING
UPDATE users SET name = 'Jane'
WHERE id = 1
RETURNING id, name, updated_at;

-- DELETE with RETURNING
DELETE FROM users WHERE id = 1
RETURNING id, name;`}
            />
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">LATERAL Joins</h3>
            <CodeBlock
              title="LATERAL Join"
              language="sql"
              code={`-- LATERAL allows subquery to reference previous tables
SELECT u.name, recent_orders.*
FROM users u
CROSS JOIN LATERAL (
  SELECT * FROM orders 
  WHERE user_id = u.id 
  ORDER BY created_at DESC 
  LIMIT 3
) recent_orders;

-- Equivalent to correlated subquery but more flexible
-- Can return multiple rows and columns`}
            />
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Common Interview Questions</h2>
          
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Q: What are advantages of PostgreSQL over MySQL?</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>ACID compliant by default (MySQL InnoDB supports it, but not default)</li>
              <li>Better JSON/JSONB support with indexing</li>
              <li>More advanced data types (arrays, custom types, ranges)</li>
              <li>Better support for complex queries (CTEs, window functions)</li>
              <li>MVCC for better concurrency</li>
              <li>Extensible (custom functions, operators, types)</li>
              <li>Better compliance with SQL standards</li>
            </ul>
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Q: When would you use JSONB vs a normalized table?</h3>
            <p className="text-sm mb-2"><strong>Use JSONB when:</strong></p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>Schema is flexible/changing frequently</li>
              <li>Data structure varies per row</li>
              <li>Partial data access is common</li>
              <li>You don't need complex JOINs on JSON data</li>
              <li>Document-based use cases</li>
            </ul>
            <p className="text-sm mt-2"><strong>Use normalized tables when:</strong></p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>Schema is stable</li>
              <li>You need foreign keys and constraints</li>
              <li>Complex JOINs are required</li>
              <li>Strong data integrity needed</li>
              <li>Reporting/analytics on all fields</li>
            </ul>
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Q: Explain PostgreSQL's MVCC implementation</h3>
            <p className="text-sm mb-2">
              PostgreSQL uses Multi-Version Concurrency Control where each row version has xmin (creation transaction ID) 
              and xmax (deletion transaction ID). Transactions see only rows valid for their snapshot. Old versions are 
              cleaned up by VACUUM. This allows:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>Readers don't block writers</li>
              <li>Writers don't block readers</li>
              <li>Consistent snapshots for each transaction</li>
            </ul>
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Q: What is a materialized view and when to use it?</h3>
            <p className="text-sm mb-2">
              A materialized view stores query results physically. Unlike regular views, it doesn't re-execute the query 
              each time. Must be refreshed manually.
            </p>
            <CodeBlock
              title="Materialized View Example"
              language="sql"
              code={`CREATE MATERIALIZED VIEW sales_summary AS
SELECT 
  DATE_TRUNC('month', created_at) AS month,
  SUM(amount) AS total_sales,
  COUNT(*) AS order_count
FROM orders
GROUP BY DATE_TRUNC('month', created_at);

-- Create index on materialized view
CREATE INDEX idx_sales_summary_month ON sales_summary(month);

-- Refresh when needed
REFRESH MATERIALIZED VIEW sales_summary;
-- Or: REFRESH MATERIALIZED VIEW CONCURRENTLY sales_summary;`}
            />
            <p className="text-sm mt-2"><strong>Use when:</strong> Expensive aggregations, reporting queries, data doesn't change frequently</p>
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Q: How does PostgreSQL handle transactions?</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>Each transaction gets unique transaction ID (xid)</li>
              <li>WAL (Write-Ahead Logging) ensures durability</li>
              <li>MVCC provides isolation</li>
              <li>ACID properties guaranteed</li>
              <li>Nested transactions via savepoints</li>
              <li>Two-phase commit for distributed transactions</li>
            </ul>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}


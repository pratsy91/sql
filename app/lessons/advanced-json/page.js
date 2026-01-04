import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Advanced JSON - PostgreSQL Learning',
  description: 'Learn about advanced PostgreSQL JSON operations including JSON path queries and JSON indexing',
};

export default function AdvancedJSON() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Advanced JSON</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">JSON Path Queries</h2>

          <CodeBlock
            title="SQL: JSON Path Queries"
            language="sql"
            code={`-- JSON path queries (PostgreSQL 12+)
-- Use jsonpath type for complex queries

-- Basic path query
SELECT jsonb_path_query(data, '$.user.name') AS user_name
FROM documents
WHERE id = 1;

-- Path query with filter
SELECT jsonb_path_query(data, '$.items[*] ? (@.price > 100)')
FROM orders
WHERE id = 1;

-- Path query first (returns first match)
SELECT jsonb_path_query_first(data, '$.user.email')
FROM documents
WHERE id = 1;

-- Path exists (boolean check)
SELECT jsonb_path_exists(data, '$.user.email')
FROM documents
WHERE id = 1;

-- Path match (returns boolean)
SELECT jsonb_path_match(data, '$.total > 1000')
FROM orders
WHERE id = 1;

-- Path query array
SELECT jsonb_path_query_array(data, '$.items[*].name')
FROM orders
WHERE id = 1;

-- Path query with variables
SELECT jsonb_path_query(
  data,
  '$.items[*] ? (@.price > $min_price)',
  '{"min_price": 50}'::jsonb
)
FROM orders
WHERE id = 1;

-- Complex path expressions
SELECT jsonb_path_query(data, '$.users[*] ? (@.age >= 18 && @.active == true)')
FROM documents
WHERE id = 1;

-- Path with functions
SELECT jsonb_path_query(data, '$.items[*].price ? (@ > avg($.items[*].price))')
FROM orders
WHERE id = 1;

-- Path with type casting
SELECT jsonb_path_query(data, '$.timestamp::datetime')
FROM events
WHERE id = 1;

-- Path query in WHERE clause
SELECT *
FROM documents
WHERE jsonb_path_exists(data, '$.user.status ? (@ == "active")');`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">JSON Indexing</h2>

          <CodeBlock
            title="SQL: JSON Indexes"
            language="sql"
            code={`-- GIN index on JSONB (indexes all keys and values)
CREATE INDEX idx_documents_data_gin 
ON documents USING gin(data);

-- Query using GIN index
SELECT * FROM documents 
WHERE data @> '{"status": "active"}';

-- GIN index with jsonb_path_ops (faster, less flexible)
CREATE INDEX idx_documents_data_path_ops 
ON documents USING gin(data jsonb_path_ops);

-- Query using path_ops index
SELECT * FROM documents 
WHERE data @> '{"user": {"status": "active"}}';

-- Expression index on JSON field
CREATE INDEX idx_documents_status 
ON documents((data->>'status'));

-- Query using expression index
SELECT * FROM documents 
WHERE data->>'status' = 'active';

-- Expression index on nested JSON
CREATE INDEX idx_documents_user_email 
ON documents((data->'user'->>'email'));

-- Query using nested index
SELECT * FROM documents 
WHERE data->'user'->>'email' = 'user@example.com';

-- Expression index with JSON path
CREATE INDEX idx_documents_path 
ON documents((jsonb_path_query_first(data, '$.user.email')));

-- Composite index with JSON
CREATE INDEX idx_documents_composite 
ON documents(status, (data->>'type'));

-- Partial index on JSON
CREATE INDEX idx_documents_active 
ON documents USING gin(data) 
WHERE (data->>'status') = 'active';

-- Check index usage
EXPLAIN SELECT * FROM documents 
WHERE data @> '{"status": "active"}';
-- Should use GIN index

-- View index size
SELECT 
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_indexes
WHERE tablename = 'documents'
  AND indexname LIKE '%data%';`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">JSON Functions</h2>

          <CodeBlock
            title="SQL: Advanced JSON Functions"
            language="sql"
            code={`-- jsonb_set (update JSON value)
UPDATE documents
SET data = jsonb_set(data, '{user,email}', '"new@example.com"')
WHERE id = 1;

-- jsonb_insert (insert new key)
UPDATE documents
SET data = jsonb_insert(data, '{user,phone}', '"123-456-7890"')
WHERE id = 1;

-- jsonb_set with create_missing
UPDATE documents
SET data = jsonb_set(
  data, 
  '{user,address,city}', 
  '"New York"',
  true  -- create_missing
)
WHERE id = 1;

-- jsonb_path_set (update using path)
UPDATE documents
SET data = jsonb_path_set(data, '$.user.email', '"new@example.com"')
WHERE id = 1;

-- jsonb_strip_nulls (remove null values)
SELECT jsonb_strip_nulls('{"a": 1, "b": null, "c": {"d": null}}'::jsonb);
-- Returns: {"a": 1, "c": {}}

-- jsonb_pretty (format JSON)
SELECT jsonb_pretty(data) FROM documents WHERE id = 1;

-- jsonb_typeof (get JSON type)
SELECT 
  jsonb_typeof(data->'user') AS user_type,
  jsonb_typeof(data->'items') AS items_type
FROM documents
WHERE id = 1;

-- jsonb_array_elements (expand array)
SELECT 
  id,
  jsonb_array_elements(data->'items') AS item
FROM orders
WHERE id = 1;

-- jsonb_array_elements_text (expand array as text)
SELECT 
  id,
  jsonb_array_elements_text(data->'tags') AS tag
FROM documents
WHERE id = 1;

-- jsonb_object_keys (get object keys)
SELECT 
  id,
  jsonb_object_keys(data->'user') AS key
FROM documents
WHERE id = 1;

-- jsonb_each (key-value pairs)
SELECT 
  id,
  jsonb_each(data->'user') AS key_value
FROM documents
WHERE id = 1;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">JSON Aggregation</h2>

          <CodeBlock
            title="SQL: JSON Aggregation Functions"
            language="sql"
            code={`-- json_agg (aggregate rows into JSON array)
SELECT 
  user_id,
  json_agg(order_id) AS order_ids
FROM orders
GROUP BY user_id;

-- jsonb_agg (aggregate into JSONB array)
SELECT 
  category,
  jsonb_agg(name) AS products
FROM products
GROUP BY category;

-- json_object_agg (aggregate into JSON object)
SELECT 
  user_id,
  json_object_agg(order_id, total) AS orders
FROM orders
GROUP BY user_id;

-- jsonb_object_agg (aggregate into JSONB object)
SELECT 
  status,
  jsonb_object_agg(id::text, name) AS users
FROM users
GROUP BY status;

-- json_agg with ORDER BY
SELECT 
  user_id,
  json_agg(order_id ORDER BY created_at) AS order_ids
FROM orders
GROUP BY user_id;

-- json_agg with DISTINCT
SELECT 
  category,
  json_agg(DISTINCT name) AS unique_products
FROM products
GROUP BY category;

-- Nested aggregation
SELECT 
  user_id,
  json_agg(
    json_build_object(
      'order_id', order_id,
      'total', total,
      'items', json_agg(item_name)
    )
  ) AS orders
FROM orders
JOIN order_items USING (order_id)
GROUP BY user_id, order_id, total;

-- json_build_object (build JSON object)
SELECT json_build_object(
  'id', id,
  'name', name,
  'email', email
) AS user_json
FROM users
WHERE id = 1;

-- jsonb_build_object (build JSONB object)
SELECT jsonb_build_object(
  'id', id,
  'name', name,
  'metadata', metadata
) AS user_jsonb
FROM users
WHERE id = 1;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Prisma: Advanced JSON</h2>

          <CodeBlock
            title="Prisma: Advanced JSON Operations"
            language="prisma"
            code={`// Prisma supports JSON/JSONB types
// Use raw SQL for advanced JSON operations

// JSON path queries
const result = await prisma.$queryRaw\`
  SELECT 
    id,
    jsonb_path_query(data, '$.user.name') AS user_name
  FROM documents
  WHERE id = $1
\`, 1;

// JSON path exists
const exists = await prisma.$queryRaw\`
  SELECT jsonb_path_exists(data, '$.user.email')
  FROM documents
  WHERE id = $1
\`, 1;

// Create GIN index on JSONB
await prisma.$executeRaw\`
  CREATE INDEX idx_documents_data_gin 
  ON documents USING gin(data)
\`;

// Create expression index
await prisma.$executeRaw\`
  CREATE INDEX idx_documents_status 
  ON documents((data->>'status'))
\`;

// Query with JSON operators
const documents = await prisma.$queryRaw\`
  SELECT * FROM documents
  WHERE data @> $1
\`, JSON.stringify({ status: 'active' });

// Update JSON field
await prisma.$executeRaw\`
  UPDATE documents
  SET data = jsonb_set(data, '{user,email}', $1)
  WHERE id = $2
\`, JSON.stringify('new@example.com'), 1;

// JSON aggregation
const aggregated = await prisma.$queryRaw\`
  SELECT 
    user_id,
    json_agg(order_id) AS order_ids
  FROM orders
  GROUP BY user_id
\`;

// Prisma schema with JSON
// model Document {
//   id   Int    @id @default(autoincrement())
//   data Jsonb
// }

// Use in Prisma
const doc = await prisma.document.findUnique({
  where: { id: 1 }
});

// Access JSON in application
const userName = doc.data.user.name;
const status = doc.data.status;

// Update JSON in Prisma
await prisma.document.update({
  where: { id: 1 },
  data: {
    data: {
      ...doc.data,
      user: {
        ...doc.data.user,
        email: 'new@example.com'
      }
    }
  }
});`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Use JSONB</strong> - better performance than JSON</li>
              <li><strong>Create GIN indexes</strong> - for JSONB queries</li>
              <li><strong>Use jsonb_path_ops</strong> - for faster containment queries</li>
              <li><strong>Use expression indexes</strong> - for specific JSON paths</li>
              <li><strong>Use JSON path queries</strong> - for complex queries</li>
              <li><strong>Validate JSON structure</strong> - use CHECK constraints</li>
              <li><strong>Monitor index size</strong> - GIN indexes can be large</li>
              <li><strong>Use appropriate operators</strong> - @&gt;, ?, -&gt;, -&gt;&gt;, etc.</li>
            </ul>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}


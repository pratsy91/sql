import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'JSON/JSONB operations - PostgreSQL Learning',
  description: 'Learn about JSON and JSONB operations in PostgreSQL including operators, functions, and JSON path queries',
};

export default function JsonOperations() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">JSON/JSONB operations</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">JSON Operators</h2>

          <CodeBlock
            title="SQL: JSON Operators"
            language="sql"
            code={`-- -> (get JSON object field as JSON)
SELECT attributes->'color' FROM products;
SELECT attributes->'specs'->'ram' FROM products;  -- Nested

-- ->> (get JSON object field as text)
SELECT attributes->>'color' FROM products;
SELECT attributes->>'price' FROM products;

-- @> (contains)
SELECT * FROM products WHERE attributes @> '{"color": "red"}'::jsonb;
SELECT * FROM products WHERE attributes @> '{"specs": {"ram": "16GB"}}'::jsonb;

-- <@ (contained by)
SELECT * FROM products WHERE '{"color": "red"}'::jsonb <@ attributes;

-- ? (key exists)
SELECT * FROM products WHERE attributes ? 'color';
SELECT * FROM products WHERE attributes ? 'specs';

-- ?| (any key exists)
SELECT * FROM products WHERE attributes ?| ARRAY['color', 'size'];

-- ?& (all keys exist)
SELECT * FROM products WHERE attributes ?& ARRAY['color', 'size', 'price'];

-- #> (get JSON object at path)
SELECT attributes#>'{specs,ram}' FROM products;

-- #>> (get JSON object at path as text)
SELECT attributes#>>'{specs,ram}' FROM products;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">JSON Functions</h2>

          <CodeBlock
            title="SQL: JSON Functions"
            language="sql"
            code={`-- JSON construction
SELECT JSON_BUILD_OBJECT('name', 'John', 'age', 30) AS user_json;
SELECT JSON_BUILD_ARRAY(1, 2, 3) AS numbers_json;

-- JSONB construction (more efficient)
SELECT JSONB_BUILD_OBJECT('id', id, 'name', name) FROM products;

-- Extract keys/values
SELECT JSON_OBJECT_KEYS(attributes) FROM products;
SELECT JSON_EACH(attributes) FROM products;
SELECT JSON_EACH_TEXT(attributes) FROM products;

-- Array functions
SELECT JSON_ARRAY_ELEMENTS('[1,2,3]'::json) AS element;
SELECT JSON_ARRAY_ELEMENTS_TEXT('["a","b","c"]'::json) AS element;

-- Set/insert operations
UPDATE products
SET attributes = JSONB_SET(attributes, '{price}', '99.99')
WHERE id = 1;

UPDATE products
SET attributes = JSONB_INSERT(attributes, '{new_field}', '"value"')
WHERE id = 1;

-- Merge JSON objects
UPDATE products
SET attributes = attributes || '{"warranty": 2}'::jsonb
WHERE id = 1;

-- Delete key
UPDATE products
SET attributes = attributes - 'old_field'
WHERE id = 1;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">JSON Path Queries</h2>

          <CodeBlock
            title="SQL: JSON Path Queries"
            language="sql"
            code={`-- JSON path query (PostgreSQL 12+)
SELECT 
  id,
  attributes,
  JSONB_PATH_QUERY(attributes, '$.specs.ram') AS ram_value
FROM products;

-- JSON path query first
SELECT 
  id,
  JSONB_PATH_QUERY_FIRST(attributes, '$.price') AS price
FROM products;

-- JSON path exists
SELECT * FROM products
WHERE JSONB_PATH_EXISTS(attributes, '$.specs.ram');

-- JSON path match
SELECT * FROM products
WHERE JSONB_PATH_MATCH(attributes, '$.price > 100');`}
          />
          <CodeBlock
            title="Prisma: JSON Operations"
            language="prisma"
            code={`// Prisma handles JSON natively
const products = await prisma.product.findMany({
  where: {
    attributes: {
      path: ['color'],
      equals: 'red',
    },
  },
});

// Nested path
const products = await prisma.product.findMany({
  where: {
    attributes: {
      path: ['specs', 'ram'],
      equals: '16GB',
    },
  },
});

// Key exists
const products = await prisma.product.findMany({
  where: {
    attributes: {
      path: ['color'],
      not: null,
    },
  },
});

// Use raw SQL for complex JSON operations
const result = await prisma.$queryRaw\`
  SELECT 
    id,
    attributes->>'color' AS color,
    attributes->'specs'->>'ram' AS ram
  FROM products
  WHERE attributes @> '{"color": "red"}'::jsonb
\`;

// JSON path queries
const pathResult = await prisma.$queryRaw\`
  SELECT 
    id,
    JSONB_PATH_QUERY_FIRST(attributes, '$.price') AS price
  FROM products
\`;

// JSON functions
const updated = await prisma.$executeRaw\`
  UPDATE products
  SET attributes = JSONB_SET(attributes, '{price}', '99.99')
  WHERE id = 1
\`;`}
          />
        </section>
      </div>
    </LessonLayout>
  );
}


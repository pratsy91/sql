import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'JSON Types - PostgreSQL Learning',
  description: 'Learn about PostgreSQL JSON and JSONB types, operators, functions, and JSON path queries',
};

export default function JSONTypes() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">JSON Types</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">JSON vs JSONB</h2>
          <p className="mb-4">
            PostgreSQL provides two JSON types: JSON (text storage) and JSONB (binary storage). JSONB is recommended for most use cases.
          </p>
          
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Type</th>
                  <th className="text-left p-2">Storage</th>
                  <th className="text-left p-2">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b"><td className="p-2"><code>JSON</code></td><td className="p-2">Text</td><td className="p-2">Exact copy, preserves whitespace, slower queries</td></tr>
                <tr><td className="p-2"><code>JSONB</code></td><td className="p-2">Binary</td><td className="p-2">Binary format, faster queries, supports indexing (recommended)</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Creating JSON Columns</h2>

          <CodeBlock
            title="SQL: JSON Types"
            language="sql"
            code={`-- Create table with JSON/JSONB
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  metadata JSON,
  attributes JSONB,
  config JSONB
);

-- Insert JSON data
INSERT INTO products (name, metadata, attributes, config)
VALUES 
  ('Laptop', 
   '{"brand": "Dell", "model": "XPS 13"}',
   '{"color": "silver", "ram": "16GB", "storage": "512GB"}'::jsonb,
   '{"warranty": 2, "price": 1299.99}'::jsonb);

-- JSON operators
SELECT 
  name,
  attributes->'color' AS color,              -- Get value as JSON
  attributes->>'color' AS color_text,        -- Get value as text
  attributes->'ram'->>'value' AS ram_value,   -- Nested access
  attributes ? 'color' AS has_color,          -- Key exists
  attributes ?| array['color', 'ram'] AS has_any,  -- Any key exists
  attributes ?& array['color', 'ram'] AS has_all   -- All keys exist
FROM products;

-- JSON path queries (PostgreSQL 12+)
SELECT 
  name,
  jsonb_path_query(attributes, '$.color') AS color_path,
  jsonb_path_query_first(config, '$.price') AS price_path
FROM products;`}
          />
          <CodeBlock
            title="Prisma: JSON Types"
            language="prisma"
            code={`// schema.prisma
model Product {
  id         Int      @id @default(autoincrement())
  name       String   @db.VarChar(100)
  metadata   Json?    // Maps to JSONB in PostgreSQL
  attributes Json     // JSONB type
  config     Json?
  
  @@map("products")
}

// Usage
const product = await prisma.product.create({
  data: {
    name: 'Laptop',
    metadata: { brand: 'Dell', model: 'XPS 13' },
    attributes: { color: 'silver', ram: '16GB', storage: '512GB' },
    config: { warranty: 2, price: 1299.99 },
  },
});

// Query JSON fields
const products = await prisma.product.findMany({
  where: {
    attributes: {
      path: ['color'],
      equals: 'silver',
    },
  },
});

// Use raw SQL for complex JSON queries
const results = await prisma.$queryRaw\`
  SELECT 
    name,
    attributes->>'color' AS color,
    attributes ? 'ram' AS has_ram
  FROM products
\`;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">JSON Functions</h2>

          <CodeBlock
            title="SQL: JSON Functions"
            language="sql"
            code={`-- JSON construction
SELECT 
  json_build_object('name', 'John', 'age', 30) AS json_object,
  json_build_array(1, 2, 3) AS json_array,
  jsonb_build_object('key', 'value') AS jsonb_object;

-- Extract keys/values
SELECT 
  jsonb_object_keys(attributes) AS key
FROM products;

-- Array functions
SELECT 
  jsonb_array_elements('[1,2,3]'::jsonb) AS element;

-- Set/insert operations
UPDATE products
SET attributes = jsonb_set(attributes, '{warranty}', '3')
WHERE id = 1;

UPDATE products
SET attributes = attributes || '{"warranty": 3}'::jsonb
WHERE id = 1;`}
          />
        </section>
      </div>
    </LessonLayout>
  );
}


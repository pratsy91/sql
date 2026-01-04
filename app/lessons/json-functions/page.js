import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'JSON Functions - PostgreSQL Learning',
  description: 'Learn about PostgreSQL JSON functions including json_build_object, json_object_keys, jsonb_set, and more',
};

export default function JsonFunctions() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">JSON Functions</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">JSON Construction Functions</h2>

          <CodeBlock
            title="SQL: JSON Construction"
            language="sql"
            code={`-- JSON_BUILD_OBJECT
SELECT JSON_BUILD_OBJECT('id', id, 'name', name, 'price', price) FROM products;
SELECT JSON_BUILD_OBJECT('user', username, 'email', email) FROM users;

-- JSONB_BUILD_OBJECT (more efficient)
SELECT JSONB_BUILD_OBJECT('id', id, 'name', name) FROM products;

-- JSON_BUILD_ARRAY
SELECT JSON_BUILD_ARRAY(1, 2, 3) AS json_array;
SELECT JSON_BUILD_ARRAY(id, name, price) FROM products;

-- JSONB_BUILD_ARRAY
SELECT JSONB_BUILD_ARRAY('a', 'b', 'c') AS jsonb_array;

-- JSON_OBJECT (from key-value pairs)
SELECT JSON_OBJECT(ARRAY['id', 'name'], ARRAY[id::text, name]) FROM products;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">JSON Extraction Functions</h2>

          <CodeBlock
            title="SQL: JSON Extraction"
            language="sql"
            code={`-- JSON_OBJECT_KEYS (get all keys)
SELECT JSON_OBJECT_KEYS(attributes) FROM products;
SELECT DISTINCT JSON_OBJECT_KEYS(attributes) FROM products;

-- JSON_EACH (expand object to key-value pairs)
SELECT JSON_EACH(attributes) FROM products;
SELECT * FROM JSON_EACH('{"a": 1, "b": 2}'::json);

-- JSON_EACH_TEXT (same as JSON_EACH but values as text)
SELECT JSON_EACH_TEXT(attributes) FROM products;

-- JSON_ARRAY_ELEMENTS (expand array to elements)
SELECT JSON_ARRAY_ELEMENTS('[1,2,3]'::json) AS element;
SELECT JSON_ARRAY_ELEMENTS_TEXT('["a","b","c"]'::json) AS element;

-- JSON_ARRAY_LENGTH
SELECT JSON_ARRAY_LENGTH('[1,2,3]'::json) AS length;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">JSON Modification Functions</h2>

          <CodeBlock
            title="SQL: JSON Modification"
            language="sql"
            code={`-- JSONB_SET (set value at path)
SELECT JSONB_SET(attributes, '{price}', '99.99') FROM products;
SELECT JSONB_SET(attributes, '{specs,ram}', '"32GB"') FROM products;  -- Nested

-- JSONB_INSERT (insert value at path)
SELECT JSONB_INSERT(attributes, '{new_field}', '"value"') FROM products;

-- JSONB_STRIP_NULLS (remove NULL values)
SELECT JSONB_STRIP_NULLS(attributes) FROM products;

-- JSONB_PRETTY (format JSON)
SELECT JSONB_PRETTY(attributes) FROM products;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">JSON Type Conversion</h2>

          <CodeBlock
            title="SQL: JSON Type Conversion"
            language="sql"
            code={`-- JSON_TO_RECORD (convert JSON to row)
SELECT * FROM JSON_TO_RECORD('{"id": 1, "name": "Product"}') AS x(id int, name text);

-- JSON_TO_RECORDSET (convert JSON array to table)
SELECT * FROM JSON_TO_RECORDSET('[{"id": 1}, {"id": 2}]') AS x(id int);

-- JSON_POPULATE_RECORD (populate record from JSON)
CREATE TYPE product_type AS (id int, name text, price numeric);
SELECT JSON_POPULATE_RECORD(NULL::product_type, '{"id": 1, "name": "Laptop", "price": 999.99}');`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Prisma: JSON Functions</h2>

          <CodeBlock
            title="Prisma: JSON Functions"
            language="prisma"
            code={`// Prisma handles JSON natively
const products = await prisma.product.findMany({
  select: {
    id: true,
    attributes: true,
  },
});

// Use raw SQL for JSON functions
const result = await prisma.$queryRaw\`
  SELECT 
    JSON_BUILD_OBJECT('id', id, 'name', name) AS product_json,
    JSON_OBJECT_KEYS(attributes) AS keys
  FROM products
\`;

// JSON modification
await prisma.$executeRaw\`
  UPDATE products
  SET attributes = JSONB_SET(attributes, '{price}', '99.99')
  WHERE id = 1
\`;

// JSON extraction
const extracted = await prisma.$queryRaw\`
  SELECT 
    id,
    JSON_EACH(attributes) AS key_value
  FROM products
\`;`}
          />
        </section>
      </div>
    </LessonLayout>
  );
}


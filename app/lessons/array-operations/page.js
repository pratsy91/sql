import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Array operations - PostgreSQL Learning',
  description: 'Learn about array operations in PostgreSQL including array constructors, operators, and functions',
};

export default function ArrayOperations() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Array operations</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Array Constructors</h2>

          <CodeBlock
            title="SQL: Array Constructors"
            language="sql"
            code={`-- Create arrays
SELECT ARRAY[1, 2, 3, 4, 5] AS numbers;
SELECT ARRAY['apple', 'banana', 'cherry'] AS fruits;

-- Array from subquery
SELECT ARRAY(SELECT id FROM users WHERE status = 'active') AS active_user_ids;

-- Multidimensional arrays
SELECT ARRAY[ARRAY[1, 2], ARRAY[3, 4]] AS matrix;

-- Array with different types (cast to common type)
SELECT ARRAY[1, 2.5, 3]::numeric[] AS mixed_numbers;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Array Operators</h2>

          <CodeBlock
            title="SQL: Array Operators"
            language="sql"
            code={`-- @> (contains)
SELECT * FROM products WHERE tags @> ARRAY['electronics'];
SELECT * FROM products WHERE tags @> ARRAY['electronics', 'computers'];

-- <@ (contained by)
SELECT * FROM products WHERE ARRAY['electronics'] <@ tags;

-- && (overlaps)
SELECT * FROM products WHERE tags && ARRAY['electronics', 'computers'];

-- = (equal)
SELECT * FROM products WHERE tags = ARRAY['electronics', 'computers'];

-- <> or != (not equal)
SELECT * FROM products WHERE tags <> ARRAY['old'];

-- || (concatenate)
SELECT ARRAY[1, 2] || ARRAY[3, 4] AS concatenated;
SELECT tags || ARRAY['new'] AS updated_tags FROM products;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Array Functions</h2>

          <CodeBlock
            title="SQL: Array Functions"
            language="sql"
            code={`-- ARRAY_LENGTH
SELECT tags, ARRAY_LENGTH(tags, 1) AS tag_count FROM products;

-- ARRAY_AGG (aggregate function)
SELECT category_id, ARRAY_AGG(name) AS product_names FROM products GROUP BY category_id;

-- UNNEST (expand array to rows)
SELECT id, UNNEST(tags) AS tag FROM products;

-- ARRAY_APPEND, ARRAY_PREPEND
SELECT ARRAY_APPEND(ARRAY[1, 2], 3) AS appended;
SELECT ARRAY_PREPEND(0, ARRAY[1, 2]) AS prepended;

-- ARRAY_CAT
SELECT ARRAY_CAT(ARRAY[1, 2], ARRAY[3, 4]) AS concatenated;

-- ARRAY_REMOVE, ARRAY_REPLACE
SELECT ARRAY_REMOVE(ARRAY[1, 2, 3, 2], 2) AS removed;
SELECT ARRAY_REPLACE(ARRAY[1, 2, 3], 2, 99) AS replaced;

-- ARRAY_POSITION
SELECT ARRAY_POSITION(ARRAY['a', 'b', 'c'], 'b') AS position;

-- ARRAY_SLICE
SELECT ARRAY_SLICE(ARRAY[1, 2, 3, 4, 5], 2, 4) AS sliced;`}
          />
          <CodeBlock
            title="Prisma: Array Operations"
            language="prisma"
            code={`// Prisma handles arrays natively
const products = await prisma.product.findMany({
  where: {
    tags: {
      has: 'electronics',  // @> operator
    },
  },
});

// Array contains all
const products = await prisma.product.findMany({
  where: {
    tags: {
      hasEvery: ['electronics', 'computers'],  // @> with multiple
    },
  },
});

// Array contains any
const products = await prisma.product.findMany({
  where: {
    tags: {
      hasSome: ['electronics', 'computers'],  // && operator
    },
  },
});

// Array length
const products = await prisma.product.findMany({
  where: {
    tags: {
      isEmpty: false,
    },
  },
});

// Use raw SQL for complex array operations
const result = await prisma.$queryRaw\`
  SELECT id, UNNEST(tags) AS tag FROM products
\`;

// Array functions
const stats = await prisma.$queryRaw\`
  SELECT 
    category_id,
    ARRAY_AGG(name) AS product_names,
    ARRAY_LENGTH(ARRAY_AGG(name), 1) AS product_count
  FROM products
  GROUP BY category_id
\`;`}
          />
        </section>
      </div>
    </LessonLayout>
  );
}


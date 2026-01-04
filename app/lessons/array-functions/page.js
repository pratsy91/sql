import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Array Functions - PostgreSQL Learning',
  description: 'Learn about PostgreSQL array functions including array_agg, array_length, array_append, unnest, and more',
};

export default function ArrayFunctions() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Array Functions</h1>
        
        <CodeBlock
          title="SQL: Array Functions"
          language="sql"
          code={`-- ARRAY_AGG (aggregate to array)
SELECT ARRAY_AGG(username) FROM users;
SELECT category_id, ARRAY_AGG(name) FROM products GROUP BY category_id;

-- ARRAY_LENGTH
SELECT ARRAY_LENGTH(tags, 1) FROM products;

-- ARRAY_APPEND, ARRAY_PREPEND
SELECT ARRAY_APPEND(ARRAY[1,2], 3) AS appended;
SELECT ARRAY_PREPEND(0, ARRAY[1,2]) AS prepended;

-- ARRAY_CAT (concatenate)
SELECT ARRAY_CAT(ARRAY[1,2], ARRAY[3,4]) AS concatenated;

-- ARRAY_REMOVE, ARRAY_REPLACE
SELECT ARRAY_REMOVE(ARRAY[1,2,3,2], 2) AS removed;
SELECT ARRAY_REPLACE(ARRAY[1,2,3], 2, 99) AS replaced;

-- UNNEST (expand array to rows)
SELECT UNNEST(ARRAY[1,2,3]) AS value;
SELECT id, UNNEST(tags) AS tag FROM products;`}
        />
        <CodeBlock
          title="Prisma: Array Functions"
          language="prisma"
          code={`// Prisma handles arrays natively
const products = await prisma.product.findMany({
  select: {
    id: true,
    tags: true,
  },
});

// Process arrays in application
const products = await prisma.product.findMany();
const allTags = products.flatMap(p => p.tags);

// Use raw SQL for array functions
const result = await prisma.$queryRaw\`
  SELECT category_id, ARRAY_AGG(name) AS product_names
  FROM products
  GROUP BY category_id
\`;`}
        />
      </div>
    </LessonLayout>
  );
}


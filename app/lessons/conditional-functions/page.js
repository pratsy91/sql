import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Conditional Functions - PostgreSQL Learning',
  description: 'Learn about conditional functions in PostgreSQL including CASE, COALESCE, NULLIF, GREATEST, and LEAST',
};

export default function ConditionalFunctions() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Conditional Functions</h1>
        
        <CodeBlock
          title="SQL: Conditional Functions"
          language="sql"
          code={`-- CASE (covered in Phase 6)
SELECT CASE WHEN price > 100 THEN 'Expensive' ELSE 'Cheap' END FROM products;

-- COALESCE (first non-NULL value)
SELECT COALESCE(description, 'No description') FROM products;
SELECT COALESCE(phone, email, 'No contact') FROM users;

-- NULLIF (NULL if equal)
SELECT NULLIF(price, 0) FROM products;  -- NULL if price is 0

-- GREATEST (maximum value)
SELECT GREATEST(10, 20, 5) AS max_val;  -- 20
SELECT GREATEST(price, min_price, base_price) FROM products;

-- LEAST (minimum value)
SELECT LEAST(10, 20, 5) AS min_val;  -- 5
SELECT LEAST(price, max_price, limit_price) FROM products;`}
        />
        <CodeBlock
          title="Prisma: Conditional Functions"
          language="prisma"
          code={`// Use raw SQL for conditional functions
const result = await prisma.$queryRaw\`
  SELECT 
    COALESCE(description, 'No description') AS desc,
    GREATEST(price, 10) AS min_price
  FROM products
\`;

// Or handle in application
const products = await prisma.product.findMany();
const processed = products.map(p => ({
  ...p,
  description: p.description || 'No description',
}));`}
        />
      </div>
    </LessonLayout>
  );
}


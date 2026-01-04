import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Type Conversion Functions - PostgreSQL Learning',
  description: 'Learn about type conversion in PostgreSQL including CAST, :: operator, to_char, to_number, and to_date',
};

export default function TypeConversionFunctions() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Type Conversion Functions</h1>
        
        <CodeBlock
          title="SQL: Type Conversion"
          language="sql"
          code={`-- CAST
SELECT CAST('123' AS INTEGER);
SELECT CAST(price AS TEXT) FROM products;

-- :: operator (shorthand)
SELECT '123'::INTEGER;
SELECT price::TEXT FROM products;

-- TO_CHAR (format as text)
SELECT TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS');
SELECT TO_CHAR(price, 'FM$999,999.00') FROM products;

-- TO_NUMBER
SELECT TO_NUMBER('123.45', '999.99');

-- TO_DATE
SELECT TO_DATE('2024-01-15', 'YYYY-MM-DD');`}
        />
        <CodeBlock
          title="Prisma: Type Conversion"
          language="prisma"
          code={`// Prisma handles type conversion automatically
const products = await prisma.product.findMany({
  select: {
    id: true,
    price: true,  // Automatically converted
  },
});

// Use raw SQL for formatting
const result = await prisma.$queryRaw\`
  SELECT TO_CHAR(price, 'FM$999,999.00') AS formatted_price
  FROM products
\`;`}
        />
      </div>
    </LessonLayout>
  );
}


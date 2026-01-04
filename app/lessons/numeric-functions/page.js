import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Numeric Functions - PostgreSQL Learning',
  description: 'Learn about PostgreSQL numeric functions including abs, ceil, floor, round, trunc, mod, power, sqrt, and random',
};

export default function NumericFunctions() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Numeric Functions</h1>
        
        <CodeBlock
          title="SQL: Numeric Functions"
          language="sql"
          code={`-- ABS (absolute value)
SELECT ABS(-42) AS abs_value;  -- 42
SELECT ABS(price) FROM products;

-- CEIL / CEILING (round up)
SELECT CEIL(4.3) AS ceiling;  -- 5
SELECT CEILING(4.3) AS ceiling;

-- FLOOR (round down)
SELECT FLOOR(4.7) AS floor;  -- 4

-- ROUND (round to nearest)
SELECT ROUND(4.5) AS rounded;  -- 5
SELECT ROUND(4.789, 2) AS rounded_2;  -- 4.79

-- TRUNC / TRUNCATE (truncate decimal)
SELECT TRUNC(4.789) AS truncated;  -- 4
SELECT TRUNC(4.789, 2) AS truncated_2;  -- 4.78

-- MOD (modulo/remainder)
SELECT MOD(10, 3) AS modulo;  -- 1
SELECT 10 % 3 AS modulo_alt;  -- Alternative syntax

-- POWER (exponentiation)
SELECT POWER(2, 8) AS power;  -- 256
SELECT 2 ^ 8 AS power_alt;  -- Alternative syntax

-- SQRT (square root)
SELECT SQRT(16) AS sqrt;  -- 4

-- RANDOM (random number 0.0 to 1.0)
SELECT RANDOM() AS random_num;
SELECT FLOOR(RANDOM() * 100) AS random_int;  -- 0 to 99`}
        />
        <CodeBlock
          title="Prisma: Numeric Functions"
          language="prisma"
          code={`// Use raw SQL for numeric functions
const result = await prisma.$queryRaw\`
  SELECT 
    price,
    ABS(price) AS abs_price,
    ROUND(price, 2) AS rounded_price,
    CEIL(price) AS ceiling_price
  FROM products
\`;

// Or use JavaScript Math functions
const products = await prisma.product.findMany();
const processed = products.map(p => ({
  ...p,
  roundedPrice: Math.round(p.price * 100) / 100,
  absPrice: Math.abs(p.price),
}));`}
        />
      </div>
    </LessonLayout>
  );
}


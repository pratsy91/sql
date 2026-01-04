import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Window Functions (Detailed) - PostgreSQL Learning',
  description: 'Comprehensive coverage of all PostgreSQL window functions and advanced windowing techniques',
};

export default function WindowFunctionsDetailed() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Window Functions (Detailed)</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Complete Window Function Reference</h2>
          <p className="mb-4">
            This lesson provides a comprehensive reference of all window functions. For detailed examples and usage, 
            see the "Window functions" lesson in Phase 6.
          </p>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">All Window Functions:</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Ranking:</strong> ROW_NUMBER, RANK, DENSE_RANK, PERCENT_RANK, CUME_DIST, NTILE</li>
              <li><strong>Value:</strong> LAG, LEAD, FIRST_VALUE, LAST_VALUE, NTH_VALUE</li>
              <li><strong>Aggregate:</strong> SUM, AVG, COUNT, MIN, MAX, STDDEV, VARIANCE, etc.</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Advanced Windowing Techniques</h2>

          <CodeBlock
            title="SQL: Advanced Windowing"
            language="sql"
            code={`-- Named window definitions
SELECT 
  id,
  price,
  SUM(price) OVER w AS running_total,
  AVG(price) OVER w AS running_avg
FROM products
WINDOW w AS (ORDER BY id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW);

-- Multiple window definitions
SELECT 
  id,
  category_id,
  price,
  ROW_NUMBER() OVER w1 AS row_in_category,
  SUM(price) OVER w2 AS total_price
FROM products
WINDOW 
  w1 AS (PARTITION BY category_id ORDER BY price),
  w2 AS (ORDER BY id);

-- Window function in ORDER BY
SELECT 
  id,
  price,
  RANK() OVER (ORDER BY price DESC) AS price_rank
FROM products
ORDER BY price_rank;

-- Window function in WHERE (using subquery)
SELECT * FROM (
  SELECT 
    id,
    price,
    RANK() OVER (ORDER BY price DESC) AS rank
  FROM products
) ranked
WHERE rank <= 10;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Window Function Best Practices</h2>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Use PARTITION BY</strong> to create separate windows for groups</li>
              <li><strong>Use ORDER BY</strong> in window to define ordering within partition</li>
              <li><strong>Use window frames</strong> for running totals and moving averages</li>
              <li><strong>Named windows</strong> for reusing window definitions</li>
              <li><strong>Index appropriately</strong> for window function performance</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Prisma: Window Functions</h2>

          <CodeBlock
            title="Prisma: Window Functions"
            language="prisma"
            code={`// Prisma doesn't support window functions directly
// Use raw SQL for all window function operations

// See Phase 6 "Window functions" lesson for comprehensive examples
// All window functions must be used via raw SQL in Prisma

const result = await prisma.$queryRaw\`
  SELECT 
    id,
    price,
    RANK() OVER (ORDER BY price DESC) AS rank,
    SUM(price) OVER (ORDER BY id) AS running_total
  FROM products
\`;`}
          />
        </section>
      </div>
    </LessonLayout>
  );
}


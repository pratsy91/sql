import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'GROUP BY - PostgreSQL Learning',
  description: 'Learn about GROUP BY in PostgreSQL including basic grouping, multiple columns, GROUPING SETS, ROLLUP, and CUBE',
};

export default function GroupBy() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">GROUP BY</h1>
        
        <CodeBlock
          title="SQL: GROUP BY"
          language="sql"
          code={`-- Basic grouping
SELECT status, COUNT(*) FROM users GROUP BY status;

-- Multiple columns
SELECT status, country, COUNT(*) 
FROM users 
GROUP BY status, country;

-- GROUPING SETS
SELECT status, country, COUNT(*)
FROM users
GROUP BY GROUPING SETS ((status), (country), ());

-- ROLLUP
SELECT status, country, COUNT(*)
FROM users
GROUP BY ROLLUP (status, country);

-- CUBE
SELECT status, country, COUNT(*)
FROM users
GROUP BY CUBE (status, country);`}
        />
        <CodeBlock
          title="Prisma: GROUP BY"
          language="prisma"
          code={`// Basic grouping
const groups = await prisma.user.groupBy({
  by: ['status'],
  _count: true,
});

// Multiple columns
const groups = await prisma.user.groupBy({
  by: ['status', 'country'],
  _count: true,
});

// With aggregations
const groups = await prisma.user.groupBy({
  by: ['status'],
  _count: { id: true },
  _avg: { age: true },
});

// Complex GROUPING SETS (use raw SQL)
const result = await prisma.$queryRaw\`
  SELECT status, country, COUNT(*)
  FROM users
  GROUP BY GROUPING SETS ((status), (country), ())
\`;`}
        />
      </div>
    </LessonLayout>
  );
}


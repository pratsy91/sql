import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'HAVING - PostgreSQL Learning',
  description: 'Learn about HAVING clause for filtering groups in PostgreSQL',
};

export default function Having() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">HAVING</h1>
        
        <CodeBlock
          title="SQL: HAVING"
          language="sql"
          code={`-- Filter groups
SELECT status, COUNT(*) 
FROM users 
GROUP BY status 
HAVING COUNT(*) > 10;

-- HAVING with aggregate functions
SELECT category_id, AVG(price), COUNT(*)
FROM products
GROUP BY category_id
HAVING AVG(price) > 100 AND COUNT(*) >= 5;`}
        />
        <CodeBlock
          title="Prisma: HAVING"
          language="prisma"
          code={`// Prisma doesn't support HAVING directly
// Use raw SQL or filter in application

const result = await prisma.$queryRaw\`
  SELECT status, COUNT(*) as count
  FROM users
  GROUP BY status
  HAVING COUNT(*) > 10
\`;

// Or filter after grouping
const groups = await prisma.user.groupBy({
  by: ['status'],
  _count: true,
});

const filtered = groups.filter(g => g._count.id > 10);`}
        />
      </div>
    </LessonLayout>
  );
}


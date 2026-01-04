import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'UNION, INTERSECT, EXCEPT - PostgreSQL Learning',
  description: 'Learn about set operations in PostgreSQL including UNION, UNION ALL, INTERSECT, and EXCEPT',
};

export default function UnionIntersectExcept() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">UNION, INTERSECT, EXCEPT</h1>
        
        <CodeBlock
          title="SQL: Set Operations"
          language="sql"
          code={`-- UNION (removes duplicates)
SELECT username FROM users WHERE status = 'active'
UNION
SELECT username FROM users WHERE age > 18;

-- UNION ALL (keeps duplicates)
SELECT username FROM users WHERE status = 'active'
UNION ALL
SELECT username FROM users WHERE age > 18;

-- INTERSECT
SELECT id FROM users WHERE status = 'active'
INTERSECT
SELECT user_id FROM orders;

-- EXCEPT
SELECT id FROM users
EXCEPT
SELECT user_id FROM orders;`}
        />
        <CodeBlock
          title="Prisma: Set Operations"
          language="prisma"
          code={`// Use raw SQL for set operations
const result = await prisma.$queryRaw\`
  SELECT username FROM users WHERE status = 'active'
  UNION
  SELECT username FROM users WHERE age > 18
\`;`}
        />
      </div>
    </LessonLayout>
  );
}


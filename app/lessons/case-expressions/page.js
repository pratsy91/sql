import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'CASE expressions - PostgreSQL Learning',
  description: 'Learn about CASE expressions in PostgreSQL including simple CASE and searched CASE',
};

export default function CaseExpressions() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">CASE expressions</h1>
        
        <CodeBlock
          title="SQL: CASE"
          language="sql"
          code={`-- Simple CASE
SELECT 
  id,
  status,
  CASE status
    WHEN 'active' THEN 'User is active'
    WHEN 'inactive' THEN 'User is inactive'
    ELSE 'Unknown status'
  END AS status_description
FROM users;

-- Searched CASE
SELECT 
  id,
  price,
  CASE
    WHEN price > 100 THEN 'Expensive'
    WHEN price > 50 THEN 'Moderate'
    ELSE 'Cheap'
  END AS price_category
FROM products;`}
        />
        <CodeBlock
          title="Prisma: CASE"
          language="prisma"
          code={`// Use raw SQL for CASE
const result = await prisma.$queryRaw\`
  SELECT 
    id,
    CASE status
      WHEN 'active' THEN 'User is active'
      ELSE 'User is inactive'
    END AS status_description
  FROM users
\`;`}
        />
      </div>
    </LessonLayout>
  );
}


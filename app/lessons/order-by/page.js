import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'ORDER BY - PostgreSQL Learning',
  description: 'Learn about ORDER BY in PostgreSQL including single column, multiple columns, and NULLS FIRST/LAST',
};

export default function OrderBy() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">ORDER BY</h1>
        
        <CodeBlock
          title="SQL: ORDER BY"
          language="sql"
          code={`-- Single column
SELECT * FROM users ORDER BY username;
SELECT * FROM users ORDER BY created_at DESC;

-- Multiple columns
SELECT * FROM users ORDER BY status, created_at DESC;

-- NULLS FIRST / LAST
SELECT * FROM users ORDER BY email NULLS FIRST;
SELECT * FROM users ORDER BY email NULLS LAST;

-- Order by expression
SELECT * FROM users ORDER BY LENGTH(username);
SELECT * FROM products ORDER BY price * stock DESC;`}
        />
        <CodeBlock
          title="Prisma: ORDER BY"
          language="prisma"
          code={`// Single column
const users = await prisma.user.findMany({
  orderBy: {
    username: 'asc',
  },
});

// Multiple columns
const users = await prisma.user.findMany({
  orderBy: [
    { status: 'asc' },
    { createdAt: 'desc' },
  ],
});

// NULL handling (use raw SQL)
const users = await prisma.$queryRaw\`
  SELECT * FROM users ORDER BY email NULLS FIRST
\`;`}
        />
      </div>
    </LessonLayout>
  );
}


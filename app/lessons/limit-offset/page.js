import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'LIMIT and OFFSET - PostgreSQL Learning',
  description: 'Learn about LIMIT, OFFSET, and FETCH FIRST in PostgreSQL',
};

export default function LimitOffset() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">LIMIT and OFFSET</h1>
        
        <CodeBlock
          title="SQL: LIMIT and OFFSET"
          language="sql"
          code={`-- LIMIT
SELECT * FROM users LIMIT 10;

-- OFFSET
SELECT * FROM users OFFSET 10;

-- LIMIT and OFFSET together (pagination)
SELECT * FROM users ORDER BY id LIMIT 10 OFFSET 20;

-- FETCH FIRST (SQL standard)
SELECT * FROM users FETCH FIRST 10 ROWS ONLY;
SELECT * FROM users OFFSET 20 ROWS FETCH NEXT 10 ROWS ONLY;`}
        />
        <CodeBlock
          title="Prisma: LIMIT and OFFSET"
          language="prisma"
          code={`// LIMIT (take)
const users = await prisma.user.findMany({
  take: 10,
});

// OFFSET (skip)
const users = await prisma.user.findMany({
  skip: 10,
});

// Pagination
const users = await prisma.user.findMany({
  take: 10,
  skip: 20,
  orderBy: { id: 'asc' },
});

// Cursor-based pagination (better for large datasets)
const users = await prisma.user.findMany({
  take: 10,
  cursor: { id: 20 },
  orderBy: { id: 'asc' },
});`}
        />
      </div>
    </LessonLayout>
  );
}


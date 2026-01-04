import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'NULL handling - PostgreSQL Learning',
  description: 'Learn about NULL handling in PostgreSQL including COALESCE, NULLIF, and IS NULL/IS NOT NULL',
};

export default function NullHandling() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">NULL handling</h1>
        
        <CodeBlock
          title="SQL: NULL Functions"
          language="sql"
          code={`-- COALESCE (returns first non-NULL value)
SELECT COALESCE(description, 'No description') FROM products;
SELECT COALESCE(phone, email, 'No contact') FROM users;

-- NULLIF (returns NULL if values are equal)
SELECT NULLIF(price, 0) FROM products;

-- IS NULL / IS NOT NULL
SELECT * FROM users WHERE email IS NULL;
SELECT * FROM users WHERE email IS NOT NULL;`}
        />
        <CodeBlock
          title="Prisma: NULL Handling"
          language="prisma"
          code={`// Handle NULL in application code
const users = await prisma.user.findMany();
const processed = users.map(u => ({
  ...u,
  description: u.description || 'No description',
}));

// Use raw SQL for COALESCE
const result = await prisma.$queryRaw\`
  SELECT COALESCE(description, 'No description') as desc
  FROM products
\`;`}
        />
      </div>
    </LessonLayout>
  );
}


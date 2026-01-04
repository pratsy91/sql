import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Date/Time Functions - PostgreSQL Learning',
  description: 'Learn about PostgreSQL date/time functions including now, date_trunc, extract, age, and interval arithmetic',
};

export default function DateTimeFunctions() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Date/Time Functions</h1>
        
        <CodeBlock
          title="SQL: Date/Time Functions"
          language="sql"
          code={`-- Current date/time
SELECT NOW() AS now;
SELECT CURRENT_TIMESTAMP AS current_timestamp;
SELECT CURRENT_DATE AS current_date;
SELECT CURRENT_TIME AS current_time;

-- DATE_TRUNC (truncate to precision)
SELECT DATE_TRUNC('year', NOW()) AS year_start;
SELECT DATE_TRUNC('month', NOW()) AS month_start;
SELECT DATE_TRUNC('day', NOW()) AS day_start;

-- EXTRACT / DATE_PART
SELECT EXTRACT(YEAR FROM NOW()) AS year;
SELECT EXTRACT(MONTH FROM NOW()) AS month;
SELECT DATE_PART('dow', NOW()) AS day_of_week;

-- AGE
SELECT AGE('2024-01-01', '2020-01-01') AS age_interval;
SELECT AGE(NOW(), created_at) AS account_age FROM users;

-- Interval arithmetic
SELECT NOW() + INTERVAL '1 day' AS tomorrow;
SELECT NOW() - INTERVAL '1 week' AS last_week;`}
        />
        <CodeBlock
          title="Prisma: Date/Time Functions"
          language="prisma"
          code={`// Use raw SQL for date/time functions
const result = await prisma.$queryRaw\`
  SELECT 
    DATE_TRUNC('month', created_at) AS month,
    EXTRACT(YEAR FROM created_at) AS year
  FROM users
\`;

// Or use JavaScript Date
const users = await prisma.user.findMany();
const processed = users.map(u => ({
  ...u,
  accountAge: Math.floor((Date.now() - u.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
}));`}
        />
      </div>
    </LessonLayout>
  );
}


import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';

export const metadata = {
  title: 'Window Functions & Advanced SQL - Practical Queries',
  description: 'Window functions, LATERAL joins, and advanced SQL patterns with SQL and Prisma',
};

export default function WindowFunctionsAdvanced() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Window Functions & Advanced SQL</h1>
        <p className="mb-4">
          Learn window functions, ranking, and advanced SQL patterns.
        </p>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Ranking Functions</h2>
          
          <CodeBlock
            title="SQL: ROW_NUMBER, RANK, DENSE_RANK"
            language="sql"
            code={`-- ROW_NUMBER: Sequential numbering (no gaps, no ties)
SELECT 
  name,
  age,
  ROW_NUMBER() OVER (ORDER BY age DESC) AS row_num
FROM users;

-- RANK: Ranking with gaps for ties
SELECT 
  name,
  age,
  RANK() OVER (ORDER BY age DESC) AS rank
FROM users;

-- DENSE_RANK: Ranking without gaps
SELECT 
  name,
  age,
  DENSE_RANK() OVER (ORDER BY age DESC) AS dense_rank
FROM users;

-- Ranking within groups (PARTITION BY)
SELECT 
  role,
  name,
  age,
  ROW_NUMBER() OVER (PARTITION BY role ORDER BY age DESC) AS rank_in_role
FROM users;`}
          />
          
          <CodeBlock
            title="Prisma: Ranking (Raw Query)"
            language="typescript"
            code={`// Window functions require raw queries in Prisma

interface RankedUser {
  name: string;
  age: number | null;
  rank: number;
}

const rankedUsers = await prisma.$queryRaw<RankedUser[]>\`
  SELECT 
    name,
    age,
    RANK() OVER (ORDER BY age DESC) AS rank
  FROM "User"
  WHERE age IS NOT NULL
\`;

// Or calculate in application
const users = await prisma.user.findMany({
  where: {
    age: {
      not: null,
    },
  },
  orderBy: {
    age: 'desc',
  },
});

const ranked = users.map((user, index) => ({
  ...user,
  rank: index + 1,
}));`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Running Totals and Aggregates</h2>
          
          <CodeBlock
            title="SQL: Running Totals"
            language="sql"
            code={`-- Running total
SELECT 
  "createdAt",
  COUNT(*) AS daily_posts,
  SUM(COUNT(*)) OVER (ORDER BY DATE("createdAt")) AS running_total
FROM posts
GROUP BY DATE("createdAt")
ORDER BY DATE("createdAt");

-- Running average
SELECT 
  "createdAt",
  COUNT(*) AS daily_posts,
  AVG(COUNT(*)) OVER (
    ORDER BY DATE("createdAt")
    ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
  ) AS avg_last_7_days
FROM posts
GROUP BY DATE("createdAt")
ORDER BY DATE("createdAt");`}
          />
          
          <CodeBlock
            title="Prisma: Running Totals (Raw Query)"
            language="typescript"
            code={`// Running totals require raw queries

interface DailyStats {
  date: Date;
  daily_posts: bigint;
  running_total: bigint;
}

const stats = await prisma.$queryRaw<DailyStats[]>\`
  SELECT 
    DATE("createdAt") AS date,
    COUNT(*) AS daily_posts,
    SUM(COUNT(*)) OVER (ORDER BY DATE("createdAt")) AS running_total
  FROM "Post"
  GROUP BY DATE("createdAt")
  ORDER BY DATE("createdAt")
\`;

// Or calculate in application
const posts = await prisma.post.findMany({
  orderBy: {
    createdAt: 'asc',
  },
});

// Group by date
const dailyCounts = posts.reduce((acc, post) => {
  const date = post.createdAt.toISOString().split('T')[0];
  acc[date] = (acc[date] || 0) + 1;
  return acc;
}, {} as Record<string, number>);

// Calculate running total
let runningTotal = 0;
const statsWithTotal = Object.entries(dailyCounts).map(([date, count]) => {
  runningTotal += count;
  return { date, count, runningTotal };
});`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. LAG and LEAD</h2>
          
          <CodeBlock
            title="SQL: LAG and LEAD"
            language="sql"
            code={`-- Compare current row with previous/next
SELECT 
  DATE("createdAt") AS date,
  COUNT(*) AS post_count,
  LAG(COUNT(*)) OVER (ORDER BY DATE("createdAt")) AS prev_day_count,
  LEAD(COUNT(*)) OVER (ORDER BY DATE("createdAt")) AS next_day_count,
  COUNT(*) - LAG(COUNT(*)) OVER (ORDER BY DATE("createdAt")) AS change_from_prev
FROM posts
GROUP BY DATE("createdAt")
ORDER BY DATE("createdAt");`}
          />
          
          <CodeBlock
            title="Prisma: LAG/LEAD (Raw Query or Application)"
            language="typescript"
            code={`// LAG/LEAD require raw queries

const dailyStats = await prisma.$queryRaw\`
  SELECT 
    DATE("createdAt") AS date,
    COUNT(*) AS post_count,
    LAG(COUNT(*)) OVER (ORDER BY DATE("createdAt")) AS prev_day_count
  FROM "Post"
  GROUP BY DATE("createdAt")
  ORDER BY DATE("createdAt")
\`;

// Or calculate in application
const posts = await prisma.post.findMany({
  orderBy: {
    createdAt: 'asc',
  },
});

const dailyCounts = posts.reduce((acc, post) => {
  const date = post.createdAt.toISOString().split('T')[0];
  acc[date] = (acc[date] || 0) + 1;
  return acc;
}, {} as Record<string, number>);

const dates = Object.keys(dailyCounts).sort();
const statsWithLag = dates.map((date, index) => ({
  date,
  count: dailyCounts[date],
  prevCount: index > 0 ? dailyCounts[dates[index - 1]] : null,
}));`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Top N per Group</h2>
          
          <CodeBlock
            title="SQL: Top N per Group with Window Functions"
            language="sql"
            code={`-- Top 3 posts per user using window function
WITH ranked_posts AS (
  SELECT 
    p.*,
    u.name AS author_name,
    ROW_NUMBER() OVER (PARTITION BY p."authorId" ORDER BY p."createdAt" DESC) AS rn
  FROM posts p
  JOIN users u ON p."authorId" = u.id
)
SELECT * FROM ranked_posts
WHERE rn <= 3;

-- Using DISTINCT ON (PostgreSQL specific, simpler)
SELECT DISTINCT ON (p."authorId")
  p.*,
  u.name AS author_name
FROM posts p
JOIN users u ON p."authorId" = u.id
ORDER BY p."authorId", p."createdAt" DESC;`}
          />
          
          <CodeBlock
            title="Prisma: Top N per Group"
            language="typescript"
            code={`// Option 1: Use Prisma's take with include
const usersWithLatestPosts = await prisma.user.findMany({
  include: {
    posts: {
      orderBy: {
        createdAt: 'desc',
      },
      take: 3,  // Top 3 posts per user
    },
  },
});

// Option 2: Raw query for window function
const topPosts = await prisma.$queryRaw\`
  WITH ranked_posts AS (
    SELECT 
      p.*,
      u.name AS author_name,
      ROW_NUMBER() OVER (PARTITION BY p."authorId" ORDER BY p."createdAt" DESC) AS rn
    FROM "Post" p
    JOIN "User" u ON p."authorId" = u.id
  )
  SELECT * FROM ranked_posts
  WHERE rn <= 3
\`;

// Option 3: DISTINCT ON with raw query
const latestPosts = await prisma.$queryRaw\`
  SELECT DISTINCT ON (p."authorId")
    p.*,
    u.name AS author_name
  FROM "Post" p
  JOIN "User" u ON p."authorId" = u.id
  ORDER BY p."authorId", p."createdAt" DESC
\`;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. LATERAL Joins</h2>
          
          <CodeBlock
            title="SQL: LATERAL Join"
            language="sql"
            code={`-- Get latest 3 posts for each user
SELECT 
  u.id,
  u.name,
  latest_posts.*
FROM users u
CROSS JOIN LATERAL (
  SELECT * FROM posts p
  WHERE p."authorId" = u.id
  ORDER BY p."createdAt" DESC
  LIMIT 3
) latest_posts;

-- Complex LATERAL join
SELECT 
  u.*,
  post_stats.*
FROM users u
CROSS JOIN LATERAL (
  SELECT 
    COUNT(*) AS total_posts,
    MAX("createdAt") AS latest_post_date
  FROM posts p
  WHERE p."authorId" = u.id
) post_stats;`}
          />
          
          <CodeBlock
            title="Prisma: LATERAL Join Pattern"
            language="typescript"
            code={`// LATERAL joins require raw queries

const usersWithLatestPosts = await prisma.$queryRaw\`
  SELECT 
    u.id,
    u.name,
    latest_posts.*
  FROM "User" u
  CROSS JOIN LATERAL (
    SELECT * FROM "Post" p
    WHERE p."authorId" = u.id
    ORDER BY p."createdAt" DESC
    LIMIT 3
  ) latest_posts
\`;

// Prisma equivalent using include
const usersWithTopPosts = await prisma.user.findMany({
  include: {
    posts: {
      orderBy: {
        createdAt: 'desc',
      },
      take: 3,
    },
  },
});`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Advanced Window Functions</h2>
          
          <CodeBlock
            title="SQL: Advanced Window Functions"
            language="sql"
            code={`-- Percentiles
SELECT 
  name,
  age,
  PERCENT_RANK() OVER (ORDER BY age) AS percentile_rank,
  CUME_DIST() OVER (ORDER BY age) AS cumulative_distribution
FROM users
WHERE age IS NOT NULL;

-- Moving window frames
SELECT 
  DATE("createdAt") AS date,
  COUNT(*) AS posts,
  AVG(COUNT(*)) OVER (
    ORDER BY DATE("createdAt")
    ROWS BETWEEN 2 PRECEDING AND 2 FOLLOWING
  ) AS moving_avg_5day
FROM posts
GROUP BY DATE("createdAt")
ORDER BY DATE("createdAt");

-- First and last value in window
SELECT 
  u.id,
  u.name,
  p.title,
  FIRST_VALUE(p.title) OVER (
    PARTITION BY u.id 
    ORDER BY p."createdAt" 
    ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
  ) AS first_post,
  LAST_VALUE(p.title) OVER (
    PARTITION BY u.id 
    ORDER BY p."createdAt" 
    ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
  ) AS last_post
FROM users u
JOIN posts p ON u.id = p."authorId";`}
          />
          
          <CodeBlock
            title="Prisma: Advanced Window Functions (Raw Query Only)"
            language="typescript"
            code={`// All advanced window functions require raw queries

const percentileStats = await prisma.$queryRaw\`
  SELECT 
    name,
    age,
    PERCENT_RANK() OVER (ORDER BY age) AS percentile_rank
  FROM "User"
  WHERE age IS NOT NULL
\`;

const movingAverages = await prisma.$queryRaw\`
  SELECT 
    DATE("createdAt") AS date,
    COUNT(*) AS posts,
    AVG(COUNT(*)) OVER (
      ORDER BY DATE("createdAt")
      ROWS BETWEEN 2 PRECEDING AND 2 FOLLOWING
    ) AS moving_avg_5day
  FROM "Post"
  GROUP BY DATE("createdAt")
  ORDER BY DATE("createdAt")
\`;`}
          />
        </section>
      </div>
    </LessonLayout>
  );
}


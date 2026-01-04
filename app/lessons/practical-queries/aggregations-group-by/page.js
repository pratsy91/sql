import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';

export const metadata = {
  title: 'Aggregations & GROUP BY - Practical Queries',
  description: 'Aggregate functions, GROUP BY, and HAVING with SQL and Prisma',
};

export default function AggregationsGroupBy() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Aggregations & GROUP BY</h1>
        <p className="mb-4">
          Learn aggregate functions and grouping with SQL and Prisma.
        </p>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Basic Aggregate Functions</h2>
          
          <CodeBlock
            title="SQL: Basic Aggregates"
            language="sql"
            code={`-- COUNT
SELECT COUNT(*) FROM users;
SELECT COUNT(email) FROM users;  -- Excludes NULL
SELECT COUNT(DISTINCT role) FROM users;

-- SUM
SELECT SUM(age) FROM users;
SELECT SUM(DISTINCT age) FROM users;

-- AVG
SELECT AVG(age) FROM users;

-- MIN and MAX
SELECT MIN(age), MAX(age) FROM users;
SELECT MIN("createdAt"), MAX("createdAt") FROM posts;`}
          />
          
          <CodeBlock
            title="Prisma: Basic Aggregates"
            language="typescript"
            code={`// COUNT
const totalUsers = await prisma.user.count();
const usersWithEmail = await prisma.user.count({
  where: {
    email: {
      not: null,
    },
  },
});

// SUM, AVG, MIN, MAX - use aggregate
const stats = await prisma.user.aggregate({
  _sum: {
    age: true,
  },
  _avg: {
    age: true,
  },
  _min: {
    age: true,
  },
  _max: {
    age: true,
  },
  _count: {
    id: true,
  },
});

// Access results
console.log(stats._sum.age);   // Sum of ages
console.log(stats._avg.age);   // Average age
console.log(stats._min.age);   // Minimum age
console.log(stats._max.age);   // Maximum age`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. GROUP BY - Single Column</h2>
          
          <CodeBlock
            title="SQL: GROUP BY"
            language="sql"
            code={`-- Count users by role
SELECT 
  role,
  COUNT(*) AS user_count
FROM users
GROUP BY role;

-- Average age by role
SELECT 
  role,
  AVG(age) AS avg_age,
  COUNT(*) AS count
FROM users
GROUP BY role;`}
          />
          
          <CodeBlock
            title="Prisma: GROUP BY"
            language="typescript"
            code={`// Count users by role
const usersByRole = await prisma.user.groupBy({
  by: ['role'],
  _count: {
    id: true,
  },
});

// Average age by role
const avgAgeByRole = await prisma.user.groupBy({
  by: ['role'],
  _avg: {
    age: true,
  },
  _count: {
    id: true,
  },
});

// Multiple aggregates
const roleStats = await prisma.user.groupBy({
  by: ['role'],
  _count: {
    id: true,
  },
  _avg: {
    age: true,
  },
  _min: {
    age: true,
  },
  _max: {
    age: true,
  },
});`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. GROUP BY - Multiple Columns</h2>
          
          <CodeBlock
            title="SQL: GROUP BY Multiple Columns"
            language="sql"
            code={`-- Count posts by author and published status
SELECT 
  u.name AS author,
  p.published,
  COUNT(*) AS post_count
FROM posts p
JOIN users u ON p."authorId" = u.id
GROUP BY u.name, p.published
ORDER BY u.name, p.published;

-- Posts per user per month
SELECT 
  u.id,
  DATE_TRUNC('month', p."createdAt") AS month,
  COUNT(*) AS post_count
FROM posts p
JOIN users u ON p."authorId" = u.id
GROUP BY u.id, DATE_TRUNC('month', p."createdAt")
ORDER BY u.id, month;`}
          />
          
          <CodeBlock
            title="Prisma: GROUP BY Multiple Columns"
            language="typescript"
            code={`// Note: Prisma groupBy only supports single column grouping
// Use raw query for multiple columns

const postsByAuthorAndStatus = await prisma.$queryRaw\`\`
  SELECT 
    u.name AS author,
    p.published,
    COUNT(*) AS post_count
  FROM "Post" p
  JOIN "User" u ON p."authorId" = u.id
  GROUP BY u.name, p.published
  ORDER BY u.name, p.published
\`\`;

// Or aggregate in application code
const allPosts = await prisma.post.findMany({
  include: {
    author: true,
  },
});

const grouped = allPosts.reduce((acc, post) => {
  const key = \`\${post.author.name}-\${post.published}\`;
  acc[key] = (acc[key] || 0) + 1;
  return acc;
}, {});`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. HAVING Clause</h2>
          
          <div className="bg-yellow-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <p className="text-sm">
              <strong>HAVING:</strong> Filters groups after GROUP BY. WHERE filters rows before grouping.
            </p>
          </div>
          
          <CodeBlock
            title="SQL: HAVING"
            language="sql"
            code={`-- Roles with more than 10 users
SELECT 
  role,
  COUNT(*) AS user_count
FROM users
GROUP BY role
HAVING COUNT(*) > 10;

-- Users with more than 5 posts
SELECT 
  u.id,
  u.name,
  COUNT(p.id) AS post_count
FROM users u
LEFT JOIN posts p ON u.id = p."authorId"
GROUP BY u.id, u.name
HAVING COUNT(p.id) > 5;

-- Average age by role, only for roles with avg age > 30
SELECT 
  role,
  AVG(age) AS avg_age
FROM users
WHERE age IS NOT NULL
GROUP BY role
HAVING AVG(age) > 30;`}
          />
          
          <CodeBlock
            title="Prisma: HAVING (using having or filter)"
            language="typescript"
            code={`// Prisma doesn't have HAVING directly
// Use raw query or filter after aggregation

// Option 1: Raw query
const rolesWithManyUsers = await prisma.$queryRaw\`\`
  SELECT 
    role,
    COUNT(*) AS user_count
  FROM "User"
  GROUP BY role
  HAVING COUNT(*) > 10
\`\`;

// Option 2: Filter in application
const allRoles = await prisma.user.groupBy({
  by: ['role'],
  _count: {
    id: true,
  },
});

const filteredRoles = allRoles.filter(role => role._count.id > 10);

// Option 3: Use where to filter before grouping
const activeUsers = await prisma.user.groupBy({
  by: ['role'],
  where: {
    age: {
      not: null,
    },
  },
  _avg: {
    age: true,
  },
});

// Then filter in application
const rolesWithHighAvgAge = activeUsers.filter(
  role => role._avg.age && role._avg.age > 30
);`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Aggregations with JOINs</h2>
          
          <CodeBlock
            title="SQL: Aggregations with JOINs"
            language="sql"
            code={`-- Post count per user
SELECT 
  u.id,
  u.name,
  COUNT(p.id) AS post_count
FROM users u
LEFT JOIN posts p ON u.id = p."authorId"
GROUP BY u.id, u.name
ORDER BY post_count DESC;

-- Total posts per category
SELECT 
  c.id,
  c.name,
  COUNT(p.id) AS post_count
FROM categories c
LEFT JOIN posts p ON c.id = p."categoryId"
GROUP BY c.id, c.name;

-- Users with their latest post date
SELECT 
  u.id,
  u.name,
  MAX(p."createdAt") AS latest_post_date,
  COUNT(p.id) AS total_posts
FROM users u
LEFT JOIN posts p ON u.id = p."authorId"
GROUP BY u.id, u.name;`}
          />
          
          <CodeBlock
            title="Prisma: Aggregations with Relations"
            language="typescript"
            code={`// Post count per user
const usersWithPostCount = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    _count: {
      select: {
        posts: true,
      },
    },
  },
  orderBy: {
    posts: {
      _count: 'desc',
    },
  },
});

// Using raw query for complex aggregations
const categoryStats = await prisma.$queryRaw\`\`
  SELECT 
    c.id,
    c.name,
    COUNT(p.id) AS post_count
  FROM "Category" c
  LEFT JOIN "Post" p ON c.id = p."categoryId"
  GROUP BY c.id, c.name
\`\`;

// Users with latest post date and count
const userStats = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    posts: {
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 1,
    },
    _count: {
      select: {
        posts: true,
      },
    },
  },
});

// Transform to get latest post date
const usersWithStats = userStats.map(user => ({
  id: user.id,
  name: user.name,
  latestPostDate: user.posts[0]?.createdAt || null,
  totalPosts: user._count.posts,
}));`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Conditional Aggregations</h2>
          
          <CodeBlock
            title="SQL: Conditional Aggregations with CASE"
            language="sql"
            code={`-- Count published vs unpublished posts per user
SELECT 
  u.name,
  COUNT(*) FILTER (WHERE p.published = true) AS published_count,
  COUNT(*) FILTER (WHERE p.published = false) AS unpublished_count,
  COUNT(*) AS total_posts
FROM users u
LEFT JOIN posts p ON u.id = p."authorId"
GROUP BY u.id, u.name;

-- Using CASE for conditional aggregation
SELECT 
  u.name,
  SUM(CASE WHEN p.published = true THEN 1 ELSE 0 END) AS published_count,
  SUM(CASE WHEN p.published = false THEN 1 ELSE 0 END) AS unpublished_count
FROM users u
LEFT JOIN posts p ON u.id = p."authorId"
GROUP BY u.id, u.name;`}
          />
          
          <CodeBlock
            title="Prisma: Conditional Aggregations"
            language="typescript"
            code={`// Prisma doesn't have FILTER or CASE directly
// Use raw query or calculate in application

const userPostStats = await prisma.$queryRaw\`\`
  SELECT 
    u.name,
    COUNT(*) FILTER (WHERE p.published = true) AS published_count,
    COUNT(*) FILTER (WHERE p.published = false) AS unpublished_count,
    COUNT(*) AS total_posts
  FROM "User" u
  LEFT JOIN "Post" p ON u.id = p."authorId"
  GROUP BY u.id, u.name
\`\`;

// Or calculate in application
const users = await prisma.user.findMany({
  include: {
    posts: true,
  },
});

const stats = users.map(user => ({
  name: user.name,
  publishedCount: user.posts.filter(p => p.published).length,
  unpublishedCount: user.posts.filter(p => !p.published).length,
  totalPosts: user.posts.length,
}));`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Complex Aggregation Examples</h2>
          
          <CodeBlock
            title="SQL: Complex Aggregations"
            language="sql"
            code={`-- Posts per user with statistics
SELECT 
  u.id,
  u.name,
  COUNT(p.id) AS total_posts,
  COUNT(p.id) FILTER (WHERE p.published = true) AS published_posts,
  COUNT(p.id) FILTER (WHERE p."createdAt" > CURRENT_DATE - INTERVAL '30 days') AS recent_posts,
  MAX(p."createdAt") AS latest_post_date,
  MIN(p."createdAt") AS first_post_date
FROM users u
LEFT JOIN posts p ON u.id = p."authorId"
GROUP BY u.id, u.name
HAVING COUNT(p.id) > 0
ORDER BY total_posts DESC;

-- Category statistics
SELECT 
  c.name,
  COUNT(p.id) AS post_count,
  COUNT(DISTINCT p."authorId") AS author_count,
  AVG(LENGTH(p.content)) AS avg_content_length
FROM categories c
LEFT JOIN posts p ON c.id = p."categoryId"
GROUP BY c.id, c.name
ORDER BY post_count DESC;`}
          />
          
          <CodeBlock
            title="Prisma: Complex Aggregations (Raw Query)"
            language="typescript"
            code={`// For complex aggregations, use raw queries
const userPostStats = await prisma.$queryRaw\`\`
  SELECT 
    u.id,
    u.name,
    COUNT(p.id) AS total_posts,
    COUNT(p.id) FILTER (WHERE p.published = true) AS published_posts,
    COUNT(p.id) FILTER (WHERE p."createdAt" > CURRENT_DATE - INTERVAL '30 days') AS recent_posts,
    MAX(p."createdAt") AS latest_post_date,
    MIN(p."createdAt") AS first_post_date
  FROM "User" u
  LEFT JOIN "Post" p ON u.id = p."authorId"
  GROUP BY u.id, u.name
  HAVING COUNT(p.id) > 0
  ORDER BY total_posts DESC
\`\`;

// Type the result
interface UserPostStats {
  id: number;
  name: string;
  total_posts: bigint;
  published_posts: bigint;
  recent_posts: bigint;
  latest_post_date: Date | null;
  first_post_date: Date | null;
}

const typedStats = userPostStats as UserPostStats[];`}
          />
        </section>
      </div>
    </LessonLayout>
  );
}


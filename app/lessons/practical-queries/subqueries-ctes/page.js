import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';

export const metadata = {
  title: 'Subqueries & CTEs - Practical Queries',
  description: 'Subqueries, Common Table Expressions, and recursive CTEs with SQL and Prisma',
};

export default function SubqueriesCTEs() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Subqueries & CTEs</h1>
        <p className="mb-4">
          Learn subqueries and Common Table Expressions (CTEs) for complex query logic.
        </p>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Scalar Subqueries</h2>
          
          <CodeBlock
            title="SQL: Scalar Subqueries"
            language="sql"
            code={`-- Average age in SELECT
SELECT 
  name,
  age,
  (SELECT AVG(age) FROM users) AS avg_age
FROM users;

-- Subquery in WHERE clause
SELECT * FROM users
WHERE age > (SELECT AVG(age) FROM users);

-- Subquery in HAVING
SELECT role, COUNT(*) 
FROM users
GROUP BY role
HAVING COUNT(*) > (SELECT AVG(cnt) FROM (SELECT COUNT(*) AS cnt FROM users GROUP BY role) sub);`}
          />
          
          <CodeBlock
            title="Prisma: Scalar Subqueries"
            language="typescript"
            code={`// Prisma doesn't support subqueries directly
// Use raw query or separate queries

// Option 1: Raw query
const usersWithAvgAge = await prisma.$queryRaw\`
  SELECT 
    name,
    age,
    (SELECT AVG(age) FROM "User") AS avg_age
  FROM "User"
\`;

// Option 2: Separate queries
const avgAge = await prisma.user.aggregate({
  _avg: {
    age: true,
  },
});

const usersAboveAvg = await prisma.user.findMany({
  where: {
    age: {
      gt: avgAge._avg.age || 0,
    },
  },
  select: {
    name: true,
    age: true,
  },
});

// Add avgAge to each user in application
const usersWithAvg = usersAboveAvg.map(user => ({
  ...user,
  avgAge: avgAge._avg.age,
}));`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Correlated Subqueries</h2>
          
          <CodeBlock
            title="SQL: Correlated Subqueries"
            language="sql"
            code={`-- Post count for each user
SELECT 
  u.id,
  u.name,
  (SELECT COUNT(*) FROM posts p WHERE p."authorId" = u.id) AS post_count
FROM users u;

-- Latest post date for each user
SELECT 
  u.id,
  u.name,
  (SELECT MAX("createdAt") FROM posts p WHERE p."authorId" = u.id) AS latest_post_date
FROM users u;

-- Users with more posts than average
SELECT * FROM users u
WHERE (
  SELECT COUNT(*) FROM posts p WHERE p."authorId" = u.id
) > (
  SELECT AVG(post_count) FROM (
    SELECT COUNT(*) AS post_count FROM posts GROUP BY "authorId"
  ) sub
);`}
          />
          
          <CodeBlock
            title="Prisma: Correlated Subqueries Pattern"
            language="typescript"
            code={`// Prisma: Use include or separate queries

// Post count per user
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
});

// Latest post date per user
const usersWithLatestPost = await prisma.user.findMany({
  include: {
    posts: {
      orderBy: {
        createdAt: 'desc',
      },
      take: 1,
    },
  },
});

// Or use raw query for correlated subquery
const usersWithStats = await prisma.$queryRaw\`
  SELECT 
    u.id,
    u.name,
    (SELECT COUNT(*) FROM "Post" p WHERE p."authorId" = u.id) AS post_count,
    (SELECT MAX("createdAt") FROM "Post" p WHERE p."authorId" = u.id) AS latest_post_date
  FROM "User" u
\`;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. IN and NOT IN Subqueries</h2>
          
          <CodeBlock
            title="SQL: IN Subqueries"
            language="sql"
            code={`-- Users who have posts
SELECT * FROM users
WHERE id IN (SELECT DISTINCT "authorId" FROM posts);

-- Users who have published posts
SELECT * FROM users
WHERE id IN (
  SELECT DISTINCT "authorId" 
  FROM posts 
  WHERE published = true
);

-- Users with NO posts
SELECT * FROM users
WHERE id NOT IN (
  SELECT DISTINCT "authorId" 
  FROM posts 
  WHERE "authorId" IS NOT NULL
);  -- Important: Handle NULLs!`}
          />
          
          <CodeBlock
            title="Prisma: IN Pattern"
            language="typescript"
            code={`// Users who have posts
const authors = await prisma.user.findMany({
  where: {
    posts: {
      some: {},  // At least one post
    },
  },
});

// Users who have published posts
const publishedAuthors = await prisma.user.findMany({
  where: {
    posts: {
      some: {
        published: true,
      },
    },
  },
});

// Users with NO posts
const usersWithoutPosts = await prisma.user.findMany({
  where: {
    posts: {
      none: {},  // No posts
    },
  },
});

// Or using raw query for IN
const usersInSubquery = await prisma.$queryRaw\`
  SELECT * FROM "User"
  WHERE id IN (SELECT DISTINCT "authorId" FROM "Post")
\`;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. EXISTS Subqueries</h2>
          
          <CodeBlock
            title="SQL: EXISTS"
            language="sql"
            code={`-- Users who have posts (better than IN for large datasets)
SELECT * FROM users u
WHERE EXISTS (
  SELECT 1 FROM posts p 
  WHERE p."authorId" = u.id
);

-- Users with published posts
SELECT * FROM users u
WHERE EXISTS (
  SELECT 1 FROM posts p 
  WHERE p."authorId" = u.id AND p.published = true
);

-- Users with NO posts
SELECT * FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM posts p 
  WHERE p."authorId" = u.id
);`}
          />
          
          <CodeBlock
            title="Prisma: EXISTS Pattern"
            language="typescript"
            code={`// EXISTS pattern in Prisma uses some/none

// Users who have posts
const authors = await prisma.user.findMany({
  where: {
    posts: {
      some: {},  // EXISTS equivalent
    },
  },
});

// Users with published posts
const publishedAuthors = await prisma.user.findMany({
  where: {
    posts: {
      some: {
        published: true,
      },
    },
  },
});

// Users with NO posts
const usersWithoutPosts = await prisma.user.findMany({
  where: {
    posts: {
      none: {},  // NOT EXISTS equivalent
    },
  },
});`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Common Table Expressions (CTEs)</h2>
          
          <CodeBlock
            title="SQL: Simple CTEs"
            language="sql"
            code={`-- Basic CTE
WITH active_users AS (
  SELECT * FROM users WHERE age >= 18
)
SELECT * FROM active_users;

-- Multiple CTEs
WITH 
  active_users AS (
    SELECT * FROM users WHERE age >= 18
  ),
  published_posts AS (
    SELECT * FROM posts WHERE published = true
  )
SELECT 
  au.name,
  COUNT(pp.id) AS post_count
FROM active_users au
LEFT JOIN published_posts pp ON au.id = pp."authorId"
GROUP BY au.id, au.name;`}
          />
          
          <CodeBlock
            title="Prisma: CTEs (Raw Query)"
            language="typescript"
            code={`// Prisma doesn't support CTEs directly
// Use raw query

const usersWithPostCount = await prisma.$queryRaw\`
  WITH active_users AS (
    SELECT * FROM "User" WHERE age >= 18
  ),
  published_posts AS (
    SELECT * FROM "Post" WHERE published = true
  )
  SELECT 
    au.name,
    COUNT(pp.id) AS post_count
  FROM active_users au
  LEFT JOIN published_posts pp ON au.id = pp."authorId"
  GROUP BY au.id, au.name
\`;

// Or break into multiple Prisma queries
const activeUsers = await prisma.user.findMany({
  where: {
    age: {
      gte: 18,
    },
  },
});

const publishedPosts = await prisma.post.findMany({
  where: {
    published: true,
  },
  include: {
    author: true,
  },
});

// Then aggregate in application code`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Recursive CTEs</h2>
          
          <div className="bg-yellow-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <p className="text-sm">
              <strong>Recursive CTEs:</strong> Used for hierarchical data traversal (employee hierarchies, category trees, etc.)
            </p>
          </div>
          
          <CodeBlock
            title="SQL: Recursive CTE - Employee Hierarchy"
            language="sql"
            code={`-- Assuming users table has managerId
WITH RECURSIVE employee_hierarchy AS (
  -- Anchor: Top-level employees (no manager)
  SELECT 
    id,
    name,
    "managerId",
    1 AS level,
    ARRAY[name] AS path
  FROM users
  WHERE "managerId" IS NULL
  
  UNION ALL
  
  -- Recursive: Subordinates
  SELECT 
    u.id,
    u.name,
    u."managerId",
    eh.level + 1,
    eh.path || u.name
  FROM users u
  INNER JOIN employee_hierarchy eh ON u."managerId" = eh.id
)
SELECT * FROM employee_hierarchy
ORDER BY level, name;`}
          />
          
          <CodeBlock
            title="SQL: Recursive CTE - Category Tree"
            language="sql"
            code={`-- Get all descendants of a category
WITH RECURSIVE category_tree AS (
  -- Anchor: Start category
  SELECT id, name, "parentId", 0 AS depth
  FROM categories
  WHERE id = 1
  
  UNION ALL
  
  -- Recursive: Children
  SELECT c.id, c.name, c."parentId", ct.depth + 1
  FROM categories c
  INNER JOIN category_tree ct ON c."parentId" = ct.id
)
SELECT * FROM category_tree;`}
          />
          
          <CodeBlock
            title="Prisma: Recursive CTEs (Raw Query Only)"
            language="typescript"
            code={`// Recursive CTEs must use raw queries in Prisma

interface EmployeeHierarchy {
  id: number;
  name: string;
  managerId: number | null;
  level: number;
  path: string[];
}

const hierarchy = await prisma.$queryRaw<EmployeeHierarchy[]>\`
  WITH RECURSIVE employee_hierarchy AS (
    SELECT 
      id,
      name,
      "managerId",
      1 AS level,
      ARRAY[name] AS path
    FROM "User"
    WHERE "managerId" IS NULL
    
    UNION ALL
    
    SELECT 
      u.id,
      u.name,
      u."managerId",
      eh.level + 1,
      eh.path || u.name
    FROM "User" u
    INNER JOIN employee_hierarchy eh ON u."managerId" = eh.id
  )
  SELECT * FROM employee_hierarchy
  ORDER BY level, name
\`;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. CTEs for Complex Queries</h2>
          
          <CodeBlock
            title="SQL: Complex CTE Example"
            language="sql"
            code={`-- Users with post statistics using CTEs
WITH user_post_stats AS (
  SELECT 
    u.id,
    u.name,
    COUNT(p.id) AS total_posts,
    COUNT(p.id) FILTER (WHERE p.published = true) AS published_posts
  FROM users u
  LEFT JOIN posts p ON u.id = p."authorId"
  GROUP BY u.id, u.name
),
avg_stats AS (
  SELECT 
    AVG(total_posts) AS avg_total,
    AVG(published_posts) AS avg_published
  FROM user_post_stats
)
SELECT 
  ups.*,
  CASE 
    WHEN ups.total_posts > avg.avg_total THEN 'Above Average'
    ELSE 'Below Average'
  END AS performance
FROM user_post_stats ups
CROSS JOIN avg_stats avg
ORDER BY ups.total_posts DESC;`}
          />
          
          <CodeBlock
            title="Prisma: Complex Queries with Raw SQL"
            language="typescript"
            code={`// Complex CTEs require raw queries

interface UserPostStats {
  id: number;
  name: string;
  total_posts: bigint;
  published_posts: bigint;
  performance: string;
}

const stats = await prisma.$queryRaw<UserPostStats[]>\`
  WITH user_post_stats AS (
    SELECT 
      u.id,
      u.name,
      COUNT(p.id) AS total_posts,
      COUNT(p.id) FILTER (WHERE p.published = true) AS published_posts
    FROM "User" u
    LEFT JOIN "Post" p ON u.id = p."authorId"
    GROUP BY u.id, u.name
  ),
  avg_stats AS (
    SELECT 
      AVG(total_posts) AS avg_total,
      AVG(published_posts) AS avg_published
    FROM user_post_stats
  )
  SELECT 
    ups.*,
    CASE 
      WHEN ups.total_posts > avg.avg_total THEN 'Above Average'
      ELSE 'Below Average'
    END AS performance
  FROM user_post_stats ups
  CROSS JOIN avg_stats avg
  ORDER BY ups.total_posts DESC
\`;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Subquery vs JOIN Performance</h2>
          
          <div className="bg-blue-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">When to Use What</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li><strong>JOIN:</strong> Better for combining columns from multiple tables</li>
              <li><strong>Subquery:</strong> Better for filtering or aggregating before joining</li>
              <li><strong>EXISTS:</strong> Better for checking existence (often faster than IN)</li>
              <li><strong>CTE:</strong> Better for readability and reusability within query</li>
            </ul>
          </div>
          
          <CodeBlock
            title="SQL: JOIN vs Subquery Comparison"
            language="sql"
            code={`-- Using JOIN
SELECT DISTINCT u.*
FROM users u
JOIN posts p ON u.id = p."authorId";

-- Using EXISTS (often faster)
SELECT * FROM users u
WHERE EXISTS (
  SELECT 1 FROM posts p 
  WHERE p."authorId" = u.id
);

-- Using IN (slower for large datasets)
SELECT * FROM users
WHERE id IN (SELECT "authorId" FROM posts);`}
          />
        </section>
      </div>
    </LessonLayout>
  );
}


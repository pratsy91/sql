import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';

export const metadata = {
  title: 'Complex Real-World Scenarios - Practical Queries',
  description: 'Complex real-world query scenarios combining multiple SQL concepts',
};

export default function ComplexScenarios() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Complex Real-World Scenarios</h1>
        <p className="mb-4">
          Complex query patterns that combine multiple concepts for real-world use cases.
        </p>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Scenario 1: User Activity Dashboard</h2>
          <p className="mb-4">Get comprehensive user statistics including post counts, latest activity, and engagement metrics.</p>
          
          <CodeBlock
            title="SQL: User Activity Dashboard"
            language="sql"
            code={`WITH user_stats AS (
  SELECT 
    u.id,
    u.name,
    u.email,
    u."createdAt" AS user_joined,
    COUNT(p.id) AS total_posts,
    COUNT(p.id) FILTER (WHERE p.published = true) AS published_posts,
    COUNT(p.id) FILTER (WHERE p."createdAt" > CURRENT_DATE - INTERVAL '30 days') AS recent_posts,
    MAX(p."createdAt") AS latest_post_date,
    MIN(p."createdAt") AS first_post_date
  FROM users u
  LEFT JOIN posts p ON u.id = p."authorId"
  GROUP BY u.id, u.name, u.email, u."createdAt"
)
SELECT 
  *,
  CASE 
    WHEN recent_posts > 5 THEN 'Active'
    WHEN recent_posts > 0 THEN 'Moderate'
    ELSE 'Inactive'
  END AS activity_status
FROM user_stats
ORDER BY recent_posts DESC, total_posts DESC;`}
          />
          
          <CodeBlock
            title="Prisma: User Activity Dashboard"
            language="typescript"
            code={`// Use raw query for complex aggregations
interface UserStats {
  id: number;
  name: string | null;
  email: string;
  user_joined: Date;
  total_posts: bigint;
  published_posts: bigint;
  recent_posts: bigint;
  latest_post_date: Date | null;
  first_post_date: Date | null;
  activity_status: string;
}

const userStats = await prisma.$queryRaw<UserStats[]>\`
  WITH user_stats AS (
    SELECT 
      u.id,
      u.name,
      u.email,
      u."createdAt" AS user_joined,
      COUNT(p.id) AS total_posts,
      COUNT(p.id) FILTER (WHERE p.published = true) AS published_posts,
      COUNT(p.id) FILTER (WHERE p."createdAt" > CURRENT_DATE - INTERVAL '30 days') AS recent_posts,
      MAX(p."createdAt") AS latest_post_date,
      MIN(p."createdAt") AS first_post_date
    FROM "User" u
    LEFT JOIN "Post" p ON u.id = p."authorId"
    GROUP BY u.id, u.name, u.email, u."createdAt"
  )
  SELECT 
    *,
    CASE 
      WHEN recent_posts > 5 THEN 'Active'
      WHEN recent_posts > 0 THEN 'Moderate'
      ELSE 'Inactive'
    END AS activity_status
  FROM user_stats
  ORDER BY recent_posts DESC, total_posts DESC
\`;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Scenario 2: Posts with Author Stats</h2>
          <p className="mb-4">Get posts with author information and author's post statistics.</p>
          
          <CodeBlock
            title="SQL: Posts with Author Stats"
            language="sql"
            code={`SELECT 
  p.id,
  p.title,
  p."createdAt",
  u.name AS author_name,
  u.email AS author_email,
  author_stats.total_author_posts,
  author_stats.author_joined_date,
  ROW_NUMBER() OVER (PARTITION BY u.id ORDER BY p."createdAt" DESC) AS post_rank_for_author
FROM posts p
JOIN users u ON p."authorId" = u.id
JOIN LATERAL (
  SELECT 
    COUNT(*) AS total_author_posts,
    MIN("createdAt") AS author_joined_date
  FROM posts
  WHERE "authorId" = u.id
) author_stats ON true
WHERE p.published = true
ORDER BY p."createdAt" DESC;`}
          />
          
          <CodeBlock
            title="Prisma: Posts with Author Stats"
            language="typescript"
            code={`// Use include with nested aggregations
const postsWithAuthorStats = await prisma.post.findMany({
  where: {
    published: true,
  },
  include: {
    author: {
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
    },
  },
  orderBy: {
    createdAt: 'desc',
  },
});

// Transform to add calculated fields
const enrichedPosts = postsWithAuthorStats.map((post, index, array) => {
  const authorPosts = array.filter(p => p.authorId === post.authorId);
  const postRank = authorPosts
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .findIndex(p => p.id === post.id) + 1;

  return {
    ...post,
    authorStats: {
      totalPosts: post.author._count.posts,
      postRank,
    },
  };
});`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Scenario 3: Trending Posts</h2>
          <p className="mb-4">Find trending posts based on recent activity and engagement.</p>
          
          <CodeBlock
            title="SQL: Trending Posts"
            language="sql"
            code={`-- Assuming you have a views or likes table
-- This example uses a simplified approach with post dates

WITH post_recency_score AS (
  SELECT 
    p.id,
    p.title,
    p."createdAt",
    u.name AS author_name,
    CASE 
      WHEN p."createdAt" > CURRENT_DATE - INTERVAL '1 day' THEN 10
      WHEN p."createdAt" > CURRENT_DATE - INTERVAL '7 days' THEN 5
      WHEN p."createdAt" > CURRENT_DATE - INTERVAL '30 days' THEN 2
      ELSE 1
    END AS recency_score
  FROM posts p
  JOIN users u ON p."authorId" = u.id
  WHERE p.published = true
)
SELECT 
  *,
  RANK() OVER (ORDER BY recency_score DESC, "createdAt" DESC) AS trend_rank
FROM post_recency_score
ORDER BY trend_rank
LIMIT 20;`}
          />
          
          <CodeBlock
            title="Prisma: Trending Posts"
            language="typescript"
            code={`// Calculate trending score in application
const recentPosts = await prisma.post.findMany({
  where: {
    published: true,
    createdAt: {
      gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
    },
  },
  include: {
    author: {
      select: {
        name: true,
      },
    },
  },
  orderBy: {
    createdAt: 'desc',
  },
});

// Calculate recency score
const now = Date.now();
const trendingPosts = recentPosts
  .map(post => {
    const daysSince = (now - post.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    let recencyScore = 1;
    
    if (daysSince < 1) recencyScore = 10;
    else if (daysSince < 7) recencyScore = 5;
    else if (daysSince < 30) recencyScore = 2;
    
    return {
      ...post,
      recencyScore,
    };
  })
  .sort((a, b) => {
    if (b.recencyScore !== a.recencyScore) {
      return b.recencyScore - a.recencyScore;
    }
    return b.createdAt.getTime() - a.createdAt.getTime();
  })
  .slice(0, 20);`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Scenario 4: Category Hierarchy with Post Counts</h2>
          <p className="mb-4">Get category tree with post counts at each level.</p>
          
          <CodeBlock
            title="SQL: Category Hierarchy with Counts"
            language="sql"
            code={`WITH RECURSIVE category_tree AS (
  -- Anchor: Root categories
  SELECT 
    id,
    name,
    "parentId",
    0 AS level,
    ARRAY[name] AS path
  FROM categories
  WHERE "parentId" IS NULL
  
  UNION ALL
  
  -- Recursive: Child categories
  SELECT 
    c.id,
    c.name,
    c."parentId",
    ct.level + 1,
    ct.path || c.name
  FROM categories c
  JOIN category_tree ct ON c."parentId" = ct.id
),
category_post_counts AS (
  SELECT 
    ct.*,
    COUNT(p.id) AS post_count
  FROM category_tree ct
  LEFT JOIN posts p ON p."categoryId" = ct.id
  GROUP BY ct.id, ct.name, ct."parentId", ct.level, ct.path
)
SELECT 
  *,
  SUM(post_count) OVER (PARTITION BY level) AS total_posts_at_level
FROM category_post_counts
ORDER BY path;`}
          />
          
          <CodeBlock
            title="Prisma: Category Hierarchy (Raw Query)"
            language="typescript"
            code={`// Complex recursive CTEs require raw queries
interface CategoryTree {
  id: number;
  name: string;
  parentId: number | null;
  level: number;
  path: string[];
  post_count: bigint;
  total_posts_at_level: bigint;
}

const categoryTree = await prisma.$queryRaw<CategoryTree[]>\`
  WITH RECURSIVE category_tree AS (
    SELECT 
      id,
      name,
      "parentId",
      0 AS level,
      ARRAY[name] AS path
    FROM "Category"
    WHERE "parentId" IS NULL
    
    UNION ALL
    
    SELECT 
      c.id,
      c.name,
      c."parentId",
      ct.level + 1,
      ct.path || c.name
    FROM "Category" c
    JOIN category_tree ct ON c."parentId" = ct.id
  ),
  category_post_counts AS (
    SELECT 
      ct.*,
      COUNT(p.id) AS post_count
    FROM category_tree ct
    LEFT JOIN "Post" p ON p."categoryId" = ct.id
    GROUP BY ct.id, ct.name, ct."parentId", ct.level, ct.path
  )
  SELECT 
    *,
    SUM(post_count) OVER (PARTITION BY level) AS total_posts_at_level
  FROM category_post_counts
  ORDER BY path
\`;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Scenario 5: Time-Series Analysis</h2>
          <p className="mb-4">Analyze post creation trends over time with moving averages.</p>
          
          <CodeBlock
            title="SQL: Time-Series with Moving Averages"
            language="sql"
            code={`SELECT 
  DATE("createdAt") AS date,
  COUNT(*) AS posts_count,
  SUM(COUNT(*)) OVER (ORDER BY DATE("createdAt")) AS cumulative_posts,
  AVG(COUNT(*)) OVER (
    ORDER BY DATE("createdAt")
    ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
  ) AS moving_avg_7days,
  LAG(COUNT(*)) OVER (ORDER BY DATE("createdAt")) AS prev_day_count,
  COUNT(*) - LAG(COUNT(*)) OVER (ORDER BY DATE("createdAt")) AS day_over_day_change
FROM posts
WHERE "createdAt" >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE("createdAt")
ORDER BY DATE("createdAt");`}
          />
          
          <CodeBlock
            title="Prisma: Time-Series (Raw Query)"
            language="typescript"
            code={`interface TimeSeriesData {
  date: Date;
  posts_count: bigint;
  cumulative_posts: bigint;
  moving_avg_7days: number;
  prev_day_count: bigint | null;
  day_over_day_change: bigint | null;
}

const timeSeries = await prisma.$queryRaw<TimeSeriesData[]>\`
  SELECT 
    DATE("createdAt") AS date,
    COUNT(*) AS posts_count,
    SUM(COUNT(*)) OVER (ORDER BY DATE("createdAt")) AS cumulative_posts,
    AVG(COUNT(*)) OVER (
      ORDER BY DATE("createdAt")
      ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ) AS moving_avg_7days,
    LAG(COUNT(*)) OVER (ORDER BY DATE("createdAt")) AS prev_day_count,
    COUNT(*) - LAG(COUNT(*)) OVER (ORDER BY DATE("createdAt")) AS day_over_day_change
  FROM "Post"
  WHERE "createdAt" >= CURRENT_DATE - INTERVAL '90 days'
  GROUP BY DATE("createdAt")
  ORDER BY DATE("createdAt")
\`;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Scenario 6: Advanced Pagination with Totals</h2>
          <p className="mb-4">Pagination that also returns total count efficiently.</p>
          
          <CodeBlock
            title="SQL: Pagination with Total Count"
            language="sql"
            code={`-- Efficient pagination with window function for total count
WITH paginated_data AS (
  SELECT 
    p.*,
    u.name AS author_name,
    COUNT(*) OVER () AS total_count,
    ROW_NUMBER() OVER (ORDER BY p."createdAt" DESC) AS row_num
  FROM posts p
  JOIN users u ON p."authorId" = u.id
  WHERE p.published = true
  ORDER BY p."createdAt" DESC
)
SELECT * FROM paginated_data
WHERE row_num BETWEEN 21 AND 40;  -- Page 3 (20 per page)

-- Or use LIMIT/OFFSET (simpler but less efficient for large offsets)
SELECT 
  p.*,
  u.name AS author_name,
  (SELECT COUNT(*) FROM posts WHERE published = true) AS total_count
FROM posts p
JOIN users u ON p."authorId" = u.id
WHERE p.published = true
ORDER BY p."createdAt" DESC
LIMIT 20 OFFSET 40;`}
          />
          
          <CodeBlock
            title="Prisma: Pagination with Count"
            language="typescript"
            code={`// Prisma pagination helper
async function getPaginatedPosts(page: number, pageSize: number = 20) {
  const skip = (page - 1) * pageSize;
  
  // Get data and count in parallel
  const [posts, totalCount] = await Promise.all([
    prisma.post.findMany({
      where: {
        published: true,
      },
      include: {
        author: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: pageSize,
    }),
    prisma.post.count({
      where: {
        published: true,
      },
    }),
  ]);

  return {
    posts,
    pagination: {
      page,
      pageSize,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      hasNext: skip + pageSize < totalCount,
      hasPrev: page > 1,
    },
  };
}

// Usage
const result = await getPaginatedPosts(3); // Page 3`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Scenario 7: Finding Duplicates</h2>
          
          <CodeBlock
            title="SQL: Find Duplicate Emails"
            language="sql"
            code={`-- Find users with duplicate emails (if email wasn't unique)
SELECT 
  email,
  COUNT(*) AS count,
  ARRAY_AGG(id) AS user_ids,
  ARRAY_AGG(name) AS names
FROM users
GROUP BY email
HAVING COUNT(*) > 1;

-- Find duplicate posts (same title and author)
SELECT 
  title,
  "authorId",
  COUNT(*) AS count
FROM posts
GROUP BY title, "authorId"
HAVING COUNT(*) > 1;`}
          />
          
          <CodeBlock
            title="Prisma: Find Duplicates"
            language="typescript"
            code={`// Find duplicates using groupBy
const duplicateEmails = await prisma.user.groupBy({
  by: ['email'],
  _count: {
    id: true,
  },
  having: {
    id: {
      _count: {
        gt: 1,
      },
    },
  },
});

// Get details of duplicates
const duplicateEmailList = duplicateEmails.map(dup => dup.email);

const duplicateUsers = await prisma.user.findMany({
  where: {
    email: {
      in: duplicateEmailList,
    },
  },
});

// Group in application
const grouped = duplicateUsers.reduce((acc, user) => {
  if (!acc[user.email]) acc[user.email] = [];
  acc[user.email].push(user);
  return acc;
}, {} as Record<string, typeof duplicateUsers>);`}
          />
        </section>
      </div>
    </LessonLayout>
  );
}


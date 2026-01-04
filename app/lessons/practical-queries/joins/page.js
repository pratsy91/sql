import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';

export const metadata = {
  title: 'JOINs - Practical Queries',
  description: 'INNER JOIN, LEFT JOIN, RIGHT JOIN, FULL OUTER JOIN with SQL and Prisma',
};

export default function Joins() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">JOINs</h1>
        <p className="mb-4">
          Learn how to combine data from multiple tables using JOINs in both SQL and Prisma.
        </p>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Prisma Schema Reference</h2>
          <CodeBlock
            title="Schema for JOIN Examples"
            language="prisma"
            code={`model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  posts     Post[]
  profile   UserProfile?
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String?
  published Boolean  @default(false)
  authorId  Int
  author    User     @relation(fields: [authorId], references: [id])
  category  Category? @relation(fields: [categoryId], references: [id])
  categoryId Int?
}

model Category {
  id    Int    @id @default(autoincrement())
  name  String
  posts Post[]
}

model UserProfile {
  id        Int    @id @default(autoincrement())
  bio       String?
  userId    Int    @unique
  user      User   @relation(fields: [userId], references: [id])
}`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. INNER JOIN</h2>
          
          <div className="bg-blue-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <p className="text-sm">
              <strong>INNER JOIN:</strong> Returns only rows that have matching values in both tables.
            </p>
          </div>
          
          <CodeBlock
            title="SQL: INNER JOIN"
            language="sql"
            code={`-- Get users with their posts
SELECT 
  u.id,
  u.name,
  u.email,
  p.id AS post_id,
  p.title,
  p.published
FROM users u
INNER JOIN posts p ON u.id = p."authorId";

-- Multiple INNER JOINs
SELECT 
  u.name,
  p.title,
  c.name AS category_name
FROM users u
INNER JOIN posts p ON u.id = p."authorId"
INNER JOIN categories c ON p."categoryId" = c.id;`}
          />
          
          <CodeBlock
            title="Prisma: INNER JOIN (include)"
            language="typescript"
            code={`// Get users with their posts
const usersWithPosts = await prisma.user.findMany({
  include: {
    posts: true,
  },
});

// Multiple relations
const usersWithPostsAndCategories = await prisma.user.findMany({
  include: {
    posts: {
      include: {
        category: true,
      },
    },
  },
});

// Select specific fields
const usersWithPostTitles = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    email: true,
    posts: {
      select: {
        id: true,
        title: true,
        published: true,
      },
    },
  },
});`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. LEFT JOIN (LEFT OUTER JOIN)</h2>
          
          <div className="bg-blue-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <p className="text-sm">
              <strong>LEFT JOIN:</strong> Returns all rows from the left table, and matched rows from the right table. 
              Returns NULL for non-matching right table rows.
            </p>
          </div>
          
          <CodeBlock
            title="SQL: LEFT JOIN"
            language="sql"
            code={`-- Get all users, even if they have no posts
SELECT 
  u.id,
  u.name,
  u.email,
  p.id AS post_id,
  p.title
FROM users u
LEFT JOIN posts p ON u.id = p."authorId";

-- Get all posts with their authors (should use INNER, but LEFT works too)
SELECT 
  p.id,
  p.title,
  u.name AS author_name
FROM posts p
LEFT JOIN users u ON p."authorId" = u.id;

-- Filter on joined table
SELECT 
  u.id,
  u.name,
  p.title
FROM users u
LEFT JOIN posts p ON u.id = p."authorId" AND p.published = true;`}
          />
          
          <CodeBlock
            title="Prisma: LEFT JOIN (include)"
            language="typescript"
            code={`// Get all users, even if they have no posts
const allUsers = await prisma.user.findMany({
  include: {
    posts: true,  // This is LEFT JOIN behavior
  },
});

// Filter included relation
const usersWithPublishedPosts = await prisma.user.findMany({
  include: {
    posts: {
      where: {
        published: true,
      },
    },
  },
});

// Get posts with optional author (rare case)
const postsWithAuthors = await prisma.post.findMany({
  include: {
    author: true,  // Since authorId is required, this behaves like INNER JOIN
  },
});`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Multiple JOINs</h2>
          
          <CodeBlock
            title="SQL: Multiple JOINs"
            language="sql"
            code={`-- Users → Posts → Categories
SELECT 
  u.name AS user_name,
  p.title AS post_title,
  c.name AS category_name
FROM users u
INNER JOIN posts p ON u.id = p."authorId"
LEFT JOIN categories c ON p."categoryId" = c.id;

-- Complex join chain
SELECT 
  u.name,
  p.title,
  c.name AS category,
  up.bio
FROM users u
LEFT JOIN posts p ON u.id = p."authorId"
LEFT JOIN categories c ON p."categoryId" = c.id
LEFT JOIN "UserProfile" up ON u.id = up."userId";`}
          />
          
          <CodeBlock
            title="Prisma: Multiple JOINs (nested include)"
            language="typescript"
            code={`// Users → Posts → Categories
const usersWithPostsAndCategories = await prisma.user.findMany({
  include: {
    posts: {
      include: {
        category: true,
      },
    },
  },
});

// Complex nested relations
const usersWithEverything = await prisma.user.findMany({
  include: {
    posts: {
      include: {
        category: true,
      },
    },
    profile: true,
  },
});

// With filtering at each level
const filteredUsers = await prisma.user.findMany({
  where: {
    role: 'admin',
  },
  include: {
    posts: {
      where: {
        published: true,
      },
      include: {
        category: {
          where: {
            name: {
              contains: 'Tech',
            },
          },
        },
      },
    },
  },
});`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Self-JOINs</h2>
          
          <div className="bg-yellow-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <p className="text-sm">
              <strong>Self-JOIN:</strong> Joining a table with itself. Common for hierarchical data.
            </p>
          </div>
          
          <CodeBlock
            title="SQL: Self-JOIN"
            language="sql"
            code={`-- Employee and Manager (if you had this structure)
-- Assuming you added managerId to users table
SELECT 
  e.id,
  e.name AS employee_name,
  m.name AS manager_name
FROM users e
LEFT JOIN users m ON e."managerId" = m.id;

-- Get all pairs of users
SELECT 
  u1.name AS user1,
  u2.name AS user2
FROM users u1
CROSS JOIN users u2
WHERE u1.id < u2.id;  -- Avoid duplicates`}
          />
          
          <CodeBlock
            title="Prisma: Self-JOIN"
            language="typescript"
            code={`// Note: Prisma doesn't directly support self-joins
// Use raw query or extend schema

// Option 1: Use raw query
const employeesWithManagers = await prisma.$queryRaw\`
  SELECT 
    e.id,
    e.name AS employee_name,
    m.name AS manager_name
  FROM "User" e
  LEFT JOIN "User" m ON e."managerId" = m.id
\`;

// Option 2: Extend schema to add relation
// In schema.prisma:
/*
model User {
  id        Int      @id @default(autoincrement())
  name      String
  managerId Int?
  manager   User?    @relation("UserManagers", fields: [managerId], references: [id])
  reports   User[]   @relation("UserManagers")
}
*/

// Then use:
const employees = await prisma.user.findMany({
  include: {
    manager: true,
    reports: true,
  },
});`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Joining with Conditions</h2>
          
          <CodeBlock
            title="SQL: JOIN with WHERE and ON conditions"
            language="sql"
            code={`-- Filter in ON clause
SELECT 
  u.name,
  p.title
FROM users u
LEFT JOIN posts p ON u.id = p."authorId" AND p.published = true;

-- Filter in WHERE clause (affects final result)
SELECT 
  u.name,
  p.title
FROM users u
LEFT JOIN posts p ON u.id = p."authorId"
WHERE p.published = true;  -- This converts LEFT JOIN to INNER JOIN!

-- Multiple conditions in ON
SELECT 
  u.name,
  p.title
FROM users u
LEFT JOIN posts p ON u.id = p."authorId" 
  AND p.published = true 
  AND p."createdAt" > '2024-01-01';`}
          />
          
          <CodeBlock
            title="Prisma: Filtering Relations"
            language="typescript"
            code={`// Filter in include (equivalent to ON clause filter)
const usersWithPublishedPosts = await prisma.user.findMany({
  include: {
    posts: {
      where: {
        published: true,
        createdAt: {
          gt: new Date('2024-01-01'),
        },
      },
    },
  },
});

// To filter users (equivalent to WHERE clause)
const usersWithAnyPublishedPosts = await prisma.user.findMany({
  where: {
    posts: {
      some: {
        published: true,
      },
    },
  },
  include: {
    posts: {
      where: {
        published: true,
      },
    },
  },
});`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. EXISTS and NOT EXISTS Patterns</h2>
          
          <CodeBlock
            title="SQL: EXISTS"
            language="sql"
            code={`-- Users who have at least one post
SELECT * FROM users u
WHERE EXISTS (
  SELECT 1 FROM posts p 
  WHERE p."authorId" = u.id
);

-- Users who have NO posts
SELECT * FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM posts p 
  WHERE p."authorId" = u.id
);

-- Users with published posts
SELECT * FROM users u
WHERE EXISTS (
  SELECT 1 FROM posts p 
  WHERE p."authorId" = u.id AND p.published = true
);`}
          />
          
          <CodeBlock
            title="Prisma: EXISTS Pattern"
            language="typescript"
            code={`// Users who have at least one post
const usersWithPosts = await prisma.user.findMany({
  where: {
    posts: {
      some: {},  // At least one post
    },
  },
});

// Users who have NO posts
const usersWithoutPosts = await prisma.user.findMany({
  where: {
    posts: {
      none: {},  // No posts
    },
  },
});

// Users with published posts
const usersWithPublishedPosts = await prisma.user.findMany({
  where: {
    posts: {
      some: {
        published: true,
      },
    },
  },
});`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Practical Examples</h2>
          
          <CodeBlock
            title="SQL: Get User with Post Count"
            language="sql"
            code={`-- Using JOIN with COUNT
SELECT 
  u.id,
  u.name,
  u.email,
  COUNT(p.id) AS post_count
FROM users u
LEFT JOIN posts p ON u.id = p."authorId"
GROUP BY u.id, u.name, u.email
ORDER BY post_count DESC;`}
          />
          
          <CodeBlock
            title="Prisma: Get User with Post Count"
            language="typescript"
            code={`// Using include and count in application
const usersWithPostCount = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    email: true,
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
});`}
          />

          <CodeBlock
            title="SQL: Latest Post per User"
            language="sql"
            code={`-- Using window function
SELECT DISTINCT ON (u.id)
  u.id,
  u.name,
  p.title AS latest_post_title,
  p."createdAt" AS latest_post_date
FROM users u
LEFT JOIN posts p ON u.id = p."authorId"
ORDER BY u.id, p."createdAt" DESC;`}
          />
          
          <CodeBlock
            title="Prisma: Latest Post per User"
            language="typescript"
            code={`// Using include with orderBy and take
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

// Or using raw query for DISTINCT ON
const result = await prisma.$queryRaw\`
  SELECT DISTINCT ON (u.id)
    u.id,
    u.name,
    p.title AS latest_post_title,
    p."createdAt" AS latest_post_date
  FROM "User" u
  LEFT JOIN "Post" p ON u.id = p."authorId"
  ORDER BY u.id, p."createdAt" DESC
\`;`}
          />
        </section>
      </div>
    </LessonLayout>
  );
}


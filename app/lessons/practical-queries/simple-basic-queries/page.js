import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';

export const metadata = {
  title: 'Simple to Basic Queries - Practical Queries',
  description: 'Simple SELECT, WHERE, ORDER BY, and LIMIT queries with SQL and Prisma',
};

export default function SimpleBasicQueries() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Simple to Basic Queries</h1>
        <p className="mb-4">
          Learn fundamental query patterns with both SQL and Prisma. These are the building blocks for all database queries.
        </p>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Prisma Schema Setup</h2>
          <CodeBlock
            title="Example Prisma Schema"
            language="prisma"
            code={`// schema.prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  age       Int?
  role      String
  createdAt DateTime @default(now())
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
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model UserProfile {
  id        Int      @id @default(autoincrement())
  bio       String?
  avatarUrl String?
  userId    Int      @unique
  user      User     @relation(fields: [userId], references: [id])
}`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Simple SELECT - All Records</h2>
          
          <CodeBlock
            title="SQL: Get All Users"
            language="sql"
            code={`-- Get all users
SELECT * FROM users;`}
          />
          
          <CodeBlock
            title="Prisma: Get All Users"
            language="typescript"
            code={`// Get all users
const users = await prisma.user.findMany();`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. SELECT Specific Columns</h2>
          
          <CodeBlock
            title="SQL: Select Specific Columns"
            language="sql"
            code={`-- Select only name and email
SELECT id, name, email FROM users;`}
          />
          
          <CodeBlock
            title="Prisma: Select Specific Fields"
            language="typescript"
            code={`// Select only specific fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    email: true,
  },
});`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. WHERE Clause - Filtering</h2>
          
          <CodeBlock
            title="SQL: Filter by Single Condition"
            language="sql"
            code={`-- Get users with specific role
SELECT * FROM users WHERE role = 'admin';

-- Get users older than 25
SELECT * FROM users WHERE age > 25;

-- Get users with email containing 'gmail'
SELECT * FROM users WHERE email LIKE '%gmail%';`}
          />
          
          <CodeBlock
            title="Prisma: Filter by Single Condition"
            language="typescript"
            code={`// Get users with specific role
const admins = await prisma.user.findMany({
  where: {
    role: 'admin',
  },
});

// Get users older than 25
const adults = await prisma.user.findMany({
  where: {
    age: {
      gt: 25,
    },
  },
});

// Get users with email containing 'gmail'
const gmailUsers = await prisma.user.findMany({
  where: {
    email: {
      contains: 'gmail',
    },
  },
});`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Multiple Conditions (AND, OR, NOT)</h2>
          
          <CodeBlock
            title="SQL: Multiple Conditions"
            language="sql"
            code={`-- AND condition
SELECT * FROM users 
WHERE role = 'admin' AND age > 30;

-- OR condition
SELECT * FROM users 
WHERE role = 'admin' OR role = 'moderator';

-- NOT condition
SELECT * FROM users 
WHERE role != 'user';

-- Complex conditions
SELECT * FROM users 
WHERE (role = 'admin' OR role = 'moderator') 
  AND age >= 25 
  AND email LIKE '%@company.com';`}
          />
          
          <CodeBlock
            title="Prisma: Multiple Conditions"
            language="typescript"
            code={`// AND condition
const seniorAdmins = await prisma.user.findMany({
  where: {
    role: 'admin',
    age: {
      gt: 30,
    },
  },
});

// OR condition
const staff = await prisma.user.findMany({
  where: {
    OR: [
      { role: 'admin' },
      { role: 'moderator' },
    ],
  },
});

// NOT condition
const nonUsers = await prisma.user.findMany({
  where: {
    role: {
      not: 'user',
    },
  },
});

// Complex conditions
const companyStaff = await prisma.user.findMany({
  where: {
    OR: [
      { role: 'admin' },
      { role: 'moderator' },
    ],
    age: {
      gte: 25,
    },
    email: {
      endsWith: '@company.com',
    },
  },
});`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. IN, NOT IN, BETWEEN</h2>
          
          <CodeBlock
            title="SQL: IN, NOT IN, BETWEEN"
            language="sql"
            code={`-- IN clause
SELECT * FROM users WHERE role IN ('admin', 'moderator', 'editor');

-- NOT IN clause
SELECT * FROM users WHERE role NOT IN ('user', 'guest');

-- BETWEEN clause
SELECT * FROM users WHERE age BETWEEN 18 AND 65;

-- Date range
SELECT * FROM users 
WHERE createdAt BETWEEN '2024-01-01' AND '2024-12-31';`}
          />
          
          <CodeBlock
            title="Prisma: IN, NOT IN, BETWEEN"
            language="typescript"
            code={`// IN clause
const staff = await prisma.user.findMany({
  where: {
    role: {
      in: ['admin', 'moderator', 'editor'],
    },
  },
});

// NOT IN clause
const nonBasicUsers = await prisma.user.findMany({
  where: {
    role: {
      notIn: ['user', 'guest'],
    },
  },
});

// BETWEEN (using gte and lte)
const workingAge = await prisma.user.findMany({
  where: {
    age: {
      gte: 18,
      lte: 65,
    },
  },
});

// Date range
const users2024 = await prisma.user.findMany({
  where: {
    createdAt: {
      gte: new Date('2024-01-01'),
      lte: new Date('2024-12-31'),
    },
  },
});`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. NULL Handling</h2>
          
          <CodeBlock
            title="SQL: NULL Checks"
            language="sql"
            code={`-- IS NULL
SELECT * FROM users WHERE name IS NULL;

-- IS NOT NULL
SELECT * FROM users WHERE name IS NOT NULL;

-- COALESCE (default value)
SELECT id, COALESCE(name, 'Anonymous') AS display_name 
FROM users;`}
          />
          
          <CodeBlock
            title="Prisma: NULL Handling"
            language="typescript"
            code={`// IS NULL
const unnamedUsers = await prisma.user.findMany({
  where: {
    name: null,
  },
});

// IS NOT NULL
const namedUsers = await prisma.user.findMany({
  where: {
    name: {
      not: null,
    },
  },
});

// Note: Prisma doesn't have COALESCE in query, use application logic
const users = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
  },
});
// Then in JavaScript:
const usersWithDefaults = users.map(user => ({
  ...user,
  displayName: user.name || 'Anonymous',
}));`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. ORDER BY - Sorting</h2>
          
          <CodeBlock
            title="SQL: Sorting"
            language="sql"
            code={`-- Single column ascending (default)
SELECT * FROM users ORDER BY name;

-- Single column descending
SELECT * FROM users ORDER BY createdAt DESC;

-- Multiple columns
SELECT * FROM users ORDER BY role ASC, name ASC;

-- NULLS FIRST/LAST
SELECT * FROM users ORDER BY name NULLS LAST;`}
          />
          
          <CodeBlock
            title="Prisma: Sorting"
            language="typescript"
            code={`// Single column ascending
const users = await prisma.user.findMany({
  orderBy: {
    name: 'asc',
  },
});

// Single column descending
const recentUsers = await prisma.user.findMany({
  orderBy: {
    createdAt: 'desc',
  },
});

// Multiple columns
const sortedUsers = await prisma.user.findMany({
  orderBy: [
    { role: 'asc' },
    { name: 'asc' },
  ],
});

// Note: Prisma doesn't support NULLS FIRST/LAST directly
// Use raw query if needed`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. LIMIT and OFFSET - Pagination</h2>
          
          <CodeBlock
            title="SQL: LIMIT and OFFSET"
            language="sql"
            code={`-- Limit results
SELECT * FROM users LIMIT 10;

-- Limit with offset (pagination)
SELECT * FROM users ORDER BY id LIMIT 10 OFFSET 20;

-- Common pagination pattern
-- Page 1: LIMIT 10 OFFSET 0
-- Page 2: LIMIT 10 OFFSET 10
-- Page 3: LIMIT 10 OFFSET 20`}
          />
          
          <CodeBlock
            title="Prisma: Take and Skip (Pagination)"
            language="typescript"
            code={`// Limit results
const firstTen = await prisma.user.findMany({
  take: 10,
});

// Pagination with skip
const page2 = await prisma.user.findMany({
  take: 10,
  skip: 10,  // Skip first 10
  orderBy: {
    id: 'asc',
  },
});

// Common pagination helper function
async function getUsers(page: number, pageSize: number = 10) {
  return await prisma.user.findMany({
    take: pageSize,
    skip: (page - 1) * pageSize,
    orderBy: {
      id: 'asc',
    },
  });
}

// Usage
const page1 = await getUsers(1);  // First 10
const page2 = await getUsers(2);  // Next 10`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. DISTINCT - Unique Values</h2>
          
          <CodeBlock
            title="SQL: DISTINCT"
            language="sql"
            code={`-- Get unique roles
SELECT DISTINCT role FROM users;

-- Distinct on multiple columns
SELECT DISTINCT role, age FROM users;`}
          />
          
          <CodeBlock
            title="Prisma: Distinct"
            language="typescript"
            code={`// Get unique roles
const uniqueRoles = await prisma.user.findMany({
  select: {
    role: true,
  },
  distinct: ['role'],
});

// Distinct on multiple columns
const uniqueCombinations = await prisma.user.findMany({
  select: {
    role: true,
    age: true,
  },
  distinct: ['role', 'age'],
});`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">10. Combining Everything</h2>
          
          <CodeBlock
            title="SQL: Complete Query"
            language="sql"
            code={`-- Get published posts from last 30 days, sorted by date
SELECT 
  id,
  title,
  content,
  "createdAt"
FROM posts
WHERE published = true
  AND "createdAt" >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY "createdAt" DESC
LIMIT 20;`}
          />
          
          <CodeBlock
            title="Prisma: Complete Query"
            language="typescript"
            code={`// Get published posts from last 30 days, sorted by date
const recentPosts = await prisma.post.findMany({
  where: {
    published: true,
    createdAt: {
      gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    },
  },
  select: {
    id: true,
    title: true,
    content: true,
    createdAt: true,
  },
  orderBy: {
    createdAt: 'desc',
  },
  take: 20,
});`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">11. Counting Records</h2>
          
          <CodeBlock
            title="SQL: COUNT"
            language="sql"
            code={`-- Count all users
SELECT COUNT(*) FROM users;

-- Count with condition
SELECT COUNT(*) FROM users WHERE role = 'admin';

-- Count distinct values
SELECT COUNT(DISTINCT role) FROM users;`}
          />
          
          <CodeBlock
            title="Prisma: Count"
            language="typescript"
            code={`// Count all users
const totalUsers = await prisma.user.count();

// Count with condition
const adminCount = await prisma.user.count({
  where: {
    role: 'admin',
  },
});

// Count distinct (use groupBy or raw query)
const roleCount = await prisma.user.groupBy({
  by: ['role'],
  _count: {
    role: true,
  },
});`}
          />
        </section>
      </div>
    </LessonLayout>
  );
}


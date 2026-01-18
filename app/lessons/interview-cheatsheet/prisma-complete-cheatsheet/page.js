import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';

export const metadata = {
  title: 'Prisma Complete Cheatsheet - Interview Cheatsheet',
  description: 'Complete Prisma ORM cheatsheet for interviews with theory and examples',
};

export default function PrismaCompleteCheatsheet() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Prisma Complete Cheatsheet</h1>
        <p className="mb-4 text-lg">
          Comprehensive Prisma ORM reference for interviews - covering all major concepts, patterns, and best practices.
        </p>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Prisma Schema Basics</h2>
          
          <CodeBlock
            title="Basic Prisma Schema"
            language="prisma"
            code={`// schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
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
  id        Int    @id @default(autoincrement())
  bio       String?
  userId    Int    @unique
  user      User   @relation(fields: [userId], references: [id])
}`}
          />

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Field Types</h3>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li><strong>String:</strong> Text data (VARCHAR/TEXT in SQL)</li>
              <li><strong>Int:</strong> Integer (INTEGER in SQL)</li>
              <li><strong>Float:</strong> Floating point (DOUBLE PRECISION in SQL)</li>
              <li><strong>Boolean:</strong> True/false (BOOLEAN in SQL)</li>
              <li><strong>DateTime:</strong> Date and time (TIMESTAMP in SQL)</li>
              <li><strong>Json:</strong> JSON data (JSONB in PostgreSQL)</li>
              <li><strong>Bytes:</strong> Binary data (BYTEA in PostgreSQL)</li>
              <li><strong>?</strong> (optional): Makes field nullable (NULL allowed)</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Prisma Client Methods</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-blue-50 dark:bg-zinc-800 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Query Methods</h3>
              <ul className="list-disc pl-6 space-y-1 text-sm">
                <li><strong>findMany:</strong> Get multiple records (SELECT *)</li>
                <li><strong>findUnique:</strong> Get one by unique field (WHERE unique_field =)</li>
                <li><strong>findFirst:</strong> Get first matching record (SELECT * LIMIT 1)</li>
                <li><strong>findFirstOrThrow:</strong> Find first or throw error</li>
                <li><strong>count:</strong> Count records (SELECT COUNT(*))</li>
                <li><strong>aggregate:</strong> Aggregate functions (SUM, AVG, MIN, MAX)</li>
                <li><strong>groupBy:</strong> Group records (GROUP BY)</li>
              </ul>
            </div>

            <div className="bg-green-50 dark:bg-zinc-800 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Mutation Methods</h3>
              <ul className="list-disc pl-6 space-y-1 text-sm">
                <li><strong>create:</strong> Insert new record (INSERT)</li>
                <li><strong>createMany:</strong> Insert multiple records</li>
                <li><strong>update:</strong> Update record (UPDATE)</li>
                <li><strong>updateMany:</strong> Update multiple records</li>
                <li><strong>upsert:</strong> Update or insert (INSERT ... ON CONFLICT)</li>
                <li><strong>delete:</strong> Delete record (DELETE)</li>
                <li><strong>deleteMany:</strong> Delete multiple records</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Basic CRUD Operations</h2>
          
          <h3 className="text-xl font-semibold mb-3">CREATE</h3>
          <CodeBlock
            title="Prisma: Create Operations"
            language="typescript"
            code={`// Create single record
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    name: 'John Doe',
  },
});

// Create with relation
const post = await prisma.post.create({
  data: {
    title: 'My Post',
    content: 'Content here',
    author: {
      connect: { id: 1 },  // Connect to existing user
    },
  },
});

// Create with nested create
const userWithPost = await prisma.user.create({
  data: {
    email: 'user@example.com',
    name: 'John',
    posts: {
      create: {
        title: 'First Post',
        content: 'Content',
      },
    },
  },
  include: {
    posts: true,
  },
});

// Create many
await prisma.user.createMany({
  data: [
    { email: 'user1@example.com', name: 'User 1' },
    { email: 'user2@example.com', name: 'User 2' },
  ],
  skipDuplicates: true,  // Skip if duplicate
});`}
          />

          <h3 className="text-xl font-semibold mb-3 mt-6">READ</h3>
          <CodeBlock
            title="Prisma: Read Operations"
            language="typescript"
            code={`// Get all records
const users = await prisma.user.findMany();

// Get one by unique field
const user = await prisma.user.findUnique({
  where: { email: 'user@example.com' },
});

// Get one by ID
const user = await prisma.user.findUnique({
  where: { id: 1 },
});

// Get first matching
const firstUser = await prisma.user.findFirst({
  where: { name: { contains: 'John' } },
});

// With conditions
const activeUsers = await prisma.user.findMany({
  where: {
    email: { contains: '@example.com' },
    createdAt: { gte: new Date('2024-01-01') },
  },
});

// With sorting and pagination
const users = await prisma.user.findMany({
  where: { role: 'admin' },
  orderBy: { createdAt: 'desc' },
  take: 10,
  skip: 20,
});`}
          />

          <h3 className="text-xl font-semibold mb-3 mt-6">UPDATE</h3>
          <CodeBlock
            title="Prisma: Update Operations"
            language="typescript"
            code={`// Update single record
const user = await prisma.user.update({
  where: { id: 1 },
  data: {
    name: 'Updated Name',
    email: 'newemail@example.com',
  },
});

// Update many records
const result = await prisma.user.updateMany({
  where: { role: 'user' },
  data: { role: 'member' },
});

// Upsert (update or create)
const user = await prisma.user.upsert({
  where: { email: 'user@example.com' },
  update: { name: 'Updated' },
  create: {
    email: 'user@example.com',
    name: 'New User',
  },
});`}
          />

          <h3 className="text-xl font-semibold mb-3 mt-6">DELETE</h3>
          <CodeBlock
            title="Prisma: Delete Operations"
            language="typescript"
            code={`// Delete single record
const user = await prisma.user.delete({
  where: { id: 1 },
});

// Delete many records
const result = await prisma.user.deleteMany({
  where: { role: 'guest' },
});

// Delete all records (careful!)
await prisma.user.deleteMany({});`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Filtering (WHERE Clause)</h2>
          
          <CodeBlock
            title="Prisma: Filter Operators"
            language="typescript"
            code={`// Equality
await prisma.user.findMany({
  where: { role: 'admin' },
});

// Comparison operators
await prisma.user.findMany({
  where: {
    age: {
      gt: 18,      // Greater than
      gte: 18,     // Greater than or equal
      lt: 65,      // Less than
      lte: 65,     // Less than or equal
    },
  },
});

// String operators
await prisma.user.findMany({
  where: {
    email: {
      contains: '@gmail',    // LIKE '%@gmail%'
      startsWith: 'admin',   // LIKE 'admin%'
      endsWith: '.com',      // LIKE '%.com'
    },
  },
});

// IN and NOT IN
await prisma.user.findMany({
  where: {
    role: {
      in: ['admin', 'moderator'],
      notIn: ['guest', 'banned'],
    },
  },
});

// NULL checks
await prisma.user.findMany({
  where: {
    name: null,        // IS NULL
    email: { not: null },  // IS NOT NULL
  },
});

// AND, OR, NOT
await prisma.user.findMany({
  where: {
    OR: [
      { role: 'admin' },
      { role: 'moderator' },
    ],
    NOT: {
      email: { contains: 'test' },
    },
    age: { gt: 18 },
  },
});`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Relations & JOINs</h2>
          
          <CodeBlock
            title="Prisma: Include (JOIN)"
            language="typescript"
            code={`// Include relations (LEFT JOIN)
const users = await prisma.user.findMany({
  include: {
    posts: true,        // Include all posts
    profile: true,      // Include profile if exists
  },
});

// Nested includes
const users = await prisma.user.findMany({
  include: {
    posts: {
      include: {
        category: true,  // Include category for each post
      },
      where: {
        published: true,  // Filter included posts
      },
    },
  },
});

// Select specific fields (more efficient)
const users = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    email: true,
    posts: {
      select: {
        id: true,
        title: true,
      },
    },
  },
});`}
          />

          <CodeBlock
            title="Prisma: Relation Filters"
            language="typescript"
            code={`// Users who have posts
const authors = await prisma.user.findMany({
  where: {
    posts: {
      some: {},  // At least one post
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

// Users with ALL posts published
const authors = await prisma.user.findMany({
  where: {
    posts: {
      every: {
        published: true,
      },
    },
  },
});

// Users with at least one published post
const activeAuthors = await prisma.user.findMany({
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
          <h2 className="text-2xl font-semibold mb-4">Aggregations</h2>
          
          <CodeBlock
            title="Prisma: Aggregations"
            language="typescript"
            code={`// Basic aggregation
const stats = await prisma.order.aggregate({
  _count: { id: true },
  _sum: { amount: true },
  _avg: { amount: true },
  _min: { amount: true },
  _max: { amount: true },
});

// With conditions
const stats = await prisma.order.aggregate({
  where: {
    createdAt: {
      gte: new Date('2024-01-01'),
    },
  },
  _sum: { amount: true },
  _avg: { amount: true },
});

// Group by
const roleStats = await prisma.user.groupBy({
  by: ['role'],
  _count: {
    id: true,
  },
  _avg: {
    age: true,
  },
  having: {
    // Note: having requires raw query
  },
});

// Count with relation
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
});`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Transactions</h2>
          
          <CodeBlock
            title="Prisma: Transactions"
            language="typescript"
            code={`// Interactive transactions
const result = await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({
    data: { email: 'user@example.com', name: 'John' },
  });

  const post = await tx.post.create({
    data: {
      title: 'Post',
      authorId: user.id,
    },
  });

  return { user, post };
});

// Batch transactions
const result = await prisma.$transaction([
  prisma.user.create({ data: { email: 'user1@example.com' } }),
  prisma.user.create({ data: { email: 'user2@example.com' } }),
  prisma.post.create({ data: { title: 'Post', authorId: 1 } }),
]);

// Transaction with timeout
await prisma.$transaction(
  async (tx) => {
    // ... operations
  },
  {
    maxWait: 5000,  // Max time to wait for transaction
    timeout: 10000, // Max time transaction can run
  }
);`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Raw Queries</h2>
          
          <CodeBlock
            title="Prisma: Raw Queries"
            language="typescript"
            code={`// Raw SQL query
const users = await prisma.$queryRaw\`\`
  SELECT * FROM "User" WHERE age > 18
\`\`;

// Parameterized query (prevents SQL injection)
const users = await prisma.$queryRaw\`\`
  SELECT * FROM "User" WHERE age > \${minAge}
\`\`, minAge);

// Typed raw query
interface User {
  id: number;
  name: string;
  email: string;
}

const users = await prisma.$queryRaw<User[]>\`\`
  SELECT id, name, email FROM "User"
\`\`;

// Raw query for mutations
await prisma.$executeRaw\`\`
  UPDATE "User" SET role = 'admin' WHERE id = 1
\`\`;

// Using Prisma.sql (safer)
import { Prisma } from '@prisma/client';

const users = await prisma.$queryRaw(
  Prisma.sql\`SELECT * FROM "User" WHERE age > \${18}\`
);`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Common Interview Questions</h2>
          
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Q: What is Prisma and how does it differ from raw SQL?</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li><strong>Prisma:</strong> Type-safe ORM with auto-generated types, migrations, query builder</li>
              <li><strong>Raw SQL:</strong> Direct SQL queries, more control, better for complex queries</li>
              <li><strong>Use Prisma:</strong> Type safety, productivity, schema management</li>
              <li><strong>Use Raw SQL:</strong> Complex queries, performance-critical, window functions, CTEs</li>
            </ul>
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Q: How do you handle N+1 queries in Prisma?</h3>
            <CodeBlock
              title="Preventing N+1 Problem"
              language="typescript"
              code={`// BAD: N+1 queries
const users = await prisma.user.findMany();
// Then for each user (separate queries):
for (const user of users) {
  const posts = await prisma.post.findMany({
    where: { authorId: user.id },
  });
}

// GOOD: Single query with include
const users = await prisma.user.findMany({
  include: {
    posts: true,  // All posts loaded in one query
  },
});`}
            />
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Q: How do you handle transactions in Prisma?</h3>
            <p className="text-sm mb-2">
              Use <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">$transaction</code> for atomic operations:
            </p>
            <CodeBlock
              title="Transaction Example"
              language="typescript"
              code={`await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({ data: {...} });
  const post = await tx.post.create({ 
    data: { authorId: user.id, ... } 
  });
  // If any operation fails, all are rolled back
});`}
            />
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Q: When would you use raw queries vs Prisma methods?</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li><strong>Use Prisma:</strong> CRUD operations, simple queries, type safety needed, relations</li>
              <li><strong>Use Raw SQL:</strong> Window functions, CTEs, complex aggregations, performance-critical</li>
              <li><strong>Best Practice:</strong> Use Prisma by default, raw queries for complex cases</li>
            </ul>
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Q: How do you optimize Prisma queries?</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>Use <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">select</code> instead of <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">include</code> when possible</li>
              <li>Avoid N+1 queries with proper includes</li>
              <li>Use indexes on frequently queried fields</li>
              <li>Batch operations with <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">createMany</code></li>
              <li>Use <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">findUnique</code> for unique lookups (uses index)</li>
              <li>Paginate large result sets</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Prisma vs SQL Comparison Table</h2>
          
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Operation</th>
                <th className="text-left p-2">SQL</th>
                <th className="text-left p-2">Prisma</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-2">SELECT all</td>
                <td className="p-2"><code>SELECT * FROM users</code></td>
                <td className="p-2"><code>prisma.user.findMany()</code></td>
              </tr>
              <tr className="border-b">
                <td className="p-2">WHERE</td>
                <td className="p-2"><code>WHERE age &gt; 18</code></td>
                <td className="p-2"><code>where: {`{ age: { gt: 18 } }`}</code></td>
              </tr>
              <tr className="border-b">
                <td className="p-2">JOIN</td>
                <td className="p-2"><code>JOIN posts ON ...</code></td>
                <td className="p-2"><code>include: {`{ posts: true }`}</code></td>
              </tr>
              <tr className="border-b">
                <td className="p-2">GROUP BY</td>
                <td className="p-2"><code>GROUP BY role</code></td>
                <td className="p-2"><code>groupBy: ['role']</code></td>
              </tr>
              <tr className="border-b">
                <td className="p-2">ORDER BY</td>
                <td className="p-2"><code>ORDER BY name DESC</code></td>
                <td className="p-2"><code>orderBy: {`{ name: 'desc' }`}</code></td>
              </tr>
              <tr className="border-b">
                <td className="p-2">LIMIT/OFFSET</td>
                <td className="p-2"><code>LIMIT 10 OFFSET 20</code></td>
                <td className="p-2"><code>take: 10, skip: 20</code></td>
              </tr>
              <tr>
                <td className="p-2">INSERT</td>
                <td className="p-2"><code>INSERT INTO users ...</code></td>
                <td className="p-2"><code>prisma.user.create({`{ data: ... }`})</code></td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>
    </LessonLayout>
  );
}


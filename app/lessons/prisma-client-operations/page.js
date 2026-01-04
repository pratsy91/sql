import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Prisma Client Operations - PostgreSQL Learning',
  description: 'Learn about Prisma Client operations including CRUD operations, querying, and transactions',
};

export default function PrismaClientOperations() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Prisma Client Operations</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">CRUD Operations</h2>

          <CodeBlock
            title="Prisma: Create Operations"
            language="prisma"
            code={`// Create single record
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    name: 'John Doe'
  }
});

// Create with related data
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    name: 'John Doe',
    posts: {
      create: {
        title: 'First Post',
        content: 'Post content'
      }
    }
  },
  include: {
    posts: true
  }
});

// Create multiple records
const users = await prisma.user.createMany({
  data: [
    { email: 'user1@example.com', name: 'User 1' },
    { email: 'user2@example.com', name: 'User 2' },
    { email: 'user3@example.com', name: 'User 3' }
  ],
  skipDuplicates: true  // Skip on unique constraint violation
});

// Create or update (upsert)
const user = await prisma.user.upsert({
  where: { email: 'user@example.com' },
  update: { name: 'Updated Name' },
  create: {
    email: 'user@example.com',
    name: 'John Doe'
  }
});

// SQL equivalent:
-- INSERT INTO users (email, name) VALUES ('user@example.com', 'John Doe') RETURNING *;
-- INSERT INTO users (email, name) VALUES (...) ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name;`}
          />

          <CodeBlock
            title="Prisma: Read Operations"
            language="prisma"
            code={`// Find unique (by unique field)
const user = await prisma.user.findUnique({
  where: { id: 1 }
});

// Find first
const user = await prisma.user.findFirst({
  where: { email: 'user@example.com' }
});

// Find many
const users = await prisma.user.findMany({
  where: { status: 'active' },
  orderBy: { createdAt: 'desc' },
  take: 10,
  skip: 0
});

// Find with relations
const user = await prisma.user.findUnique({
  where: { id: 1 },
  include: {
    posts: true,
    profile: true
  }
});

// Select specific fields
const user = await prisma.user.findUnique({
  where: { id: 1 },
  select: {
    id: true,
    email: true,
    name: true
  }
});

// Count
const count = await prisma.user.count({
  where: { status: 'active' }
});

// SQL equivalent:
-- SELECT * FROM users WHERE id = 1;
-- SELECT * FROM users WHERE status = 'active' ORDER BY created_at DESC LIMIT 10;
-- SELECT COUNT(*) FROM users WHERE status = 'active';`}
          />

          <CodeBlock
            title="Prisma: Update Operations"
            language="prisma"
            code={`// Update single record
const user = await prisma.user.update({
  where: { id: 1 },
  data: {
    name: 'Updated Name',
    email: 'newemail@example.com'
  }
});

// Update many
const result = await prisma.user.updateMany({
  where: { status: 'inactive' },
  data: { status: 'active' }
});

// Update or create
const user = await prisma.user.upsert({
  where: { email: 'user@example.com' },
  update: { name: 'Updated' },
  create: {
    email: 'user@example.com',
    name: 'New User'
  }
});

// Increment/decrement numeric fields
const product = await prisma.product.update({
  where: { id: 1 },
  data: {
    quantity: {
      increment: 5
    },
    price: {
      decrement: 10.00
    }
  }
});

// Update with relations
const user = await prisma.user.update({
  where: { id: 1 },
  data: {
    posts: {
      create: {
        title: 'New Post',
        content: 'Content'
      }
    }
  },
  include: {
    posts: true
  }
});

// SQL equivalent:
-- UPDATE users SET name = 'Updated Name' WHERE id = 1 RETURNING *;
-- UPDATE users SET status = 'active' WHERE status = 'inactive';`}
          />

          <CodeBlock
            title="Prisma: Delete Operations"
            language="prisma"
            code={`// Delete single record
const user = await prisma.user.delete({
  where: { id: 1 }
});

// Delete many
const result = await prisma.user.deleteMany({
  where: { status: 'inactive' }
});

// Delete with cascade (if configured)
const user = await prisma.user.delete({
  where: { id: 1 },
  include: {
    posts: true  // Returns deleted related records
  }
});

// SQL equivalent:
-- DELETE FROM users WHERE id = 1 RETURNING *;
-- DELETE FROM users WHERE status = 'inactive';`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Querying</h2>

          <CodeBlock
            title="Prisma: Advanced Querying"
            language="prisma"
            code={`// Filtering
const users = await prisma.user.findMany({
  where: {
    email: {
      contains: '@example.com'
    },
    status: 'active',
    createdAt: {
      gte: new Date('2024-01-01')
    }
  }
});

// Complex filters
const users = await prisma.user.findMany({
  where: {
    OR: [
      { email: { contains: 'admin' } },
      { role: 'ADMIN' }
    ],
    AND: [
      { status: 'active' },
      { createdAt: { gte: new Date('2024-01-01') } }
    ],
    NOT: {
      email: { contains: 'test' }
    }
  }
});

// Filter by relation
const posts = await prisma.post.findMany({
  where: {
    author: {
      status: 'active'
    }
  }
});

// Nested filters
const users = await prisma.user.findMany({
  where: {
    posts: {
      some: {
        published: true
      }
    }
  }
});

// Sorting
const users = await prisma.user.findMany({
  orderBy: [
    { createdAt: 'desc' },
    { name: 'asc' }
  ]
});

// Pagination
const users = await prisma.user.findMany({
  skip: 20,
  take: 10,
  orderBy: { id: 'asc' }
});

// Cursor-based pagination
const users = await prisma.user.findMany({
  take: 10,
  cursor: {
    id: 20
  },
  orderBy: { id: 'asc' }
});

// Aggregation
const stats = await prisma.user.aggregate({
  _count: { id: true },
  _avg: { age: true },
  _sum: { score: true },
  _min: { createdAt: true },
  _max: { createdAt: true }
});

// Group by
const grouped = await prisma.user.groupBy({
  by: ['status'],
  _count: { id: true },
  _avg: { age: true }
});`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Transactions</h2>

          <CodeBlock
            title="Prisma: Transactions"
            language="prisma"
            code={`// Interactive transaction
const result = await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({
    data: {
      email: 'user@example.com',
      name: 'John Doe'
    }
  });

  const post = await tx.post.create({
    data: {
      title: 'First Post',
      authorId: user.id
    }
  });

  return { user, post };
});

// Sequential operations (array)
const results = await prisma.$transaction([
  prisma.user.create({
    data: { email: 'user1@example.com', name: 'User 1' }
  }),
  prisma.user.create({
    data: { email: 'user2@example.com', name: 'User 2' }
  }),
  prisma.user.create({
    data: { email: 'user3@example.com', name: 'User 3' }
  })
]);

// Transaction with options
const result = await prisma.$transaction(
  async (tx) => {
    // Operations
  },
  {
    maxWait: 5000,  // Max time to wait for transaction
    timeout: 10000,  // Max time for transaction to complete
    isolationLevel: 'ReadCommitted'  // Isolation level
  }
);

// Isolation levels:
// ReadUncommitted, ReadCommitted, RepeatableRead, Serializable

// SQL equivalent:
-- BEGIN;
-- INSERT INTO users ...;
-- INSERT INTO posts ...;
-- COMMIT;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Use transactions</strong> - for multiple related operations</li>
              <li><strong>Select only needed fields</strong> - use select to limit data</li>
              <li><strong>Use include/select</strong> - control relation loading</li>
              <li><strong>Handle errors</strong> - Prisma throws specific error types</li>
              <li><strong>Use pagination</strong> - for large result sets</li>
              <li><strong>Use cursor pagination</strong> - for better performance</li>
              <li><strong>Batch operations</strong> - use createMany, updateMany when possible</li>
              <li><strong>Reuse Prisma Client</strong> - create singleton instance</li>
            </ul>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}


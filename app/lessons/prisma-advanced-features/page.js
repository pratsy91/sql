import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Prisma Advanced Features - PostgreSQL Learning',
  description: 'Learn about Prisma advanced features including raw SQL queries, Prisma Migrate, and Prisma Studio',
};

export default function PrismaAdvancedFeatures() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Prisma Advanced Features</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Raw SQL Queries</h2>

          <CodeBlock
            title="Prisma: Raw SQL Queries"
            language="prisma"
            code={`// $queryRaw - Parameterized queries (safe)
const users = await prisma.$queryRaw\`
  SELECT * FROM "User" WHERE email = $1
\`, 'user@example.com';

// Multiple parameters
const users = await prisma.$queryRaw\`
  SELECT * FROM "User" 
  WHERE email = $1 AND status = $2
\`, 'user@example.com', 'active';

// $queryRawUnsafe - Direct SQL (use with caution)
const users = await prisma.$queryRawUnsafe(
  'SELECT * FROM "User" WHERE email = $1',
  'user@example.com'
);

// $executeRaw - Execute SQL (INSERT, UPDATE, DELETE)
await prisma.$executeRaw\`
  UPDATE "User" SET status = $1 WHERE id = $2
\`, 'active', 1;

// $executeRawUnsafe - Execute unsafe SQL
await prisma.$executeRawUnsafe(
  'UPDATE "User" SET status = $1 WHERE id = $2',
  'active',
  1
);

// Raw query with Prisma.sql (type-safe)
import { Prisma } from '@prisma/client';

const users = await prisma.$queryRaw(
  Prisma.sql\`SELECT * FROM "User" WHERE email = \${email}\`
);

// Complex raw queries
const result = await prisma.$queryRaw\`
  SELECT 
    u.id,
    u.name,
    COUNT(p.id) as post_count
  FROM "User" u
  LEFT JOIN "Post" p ON u.id = p.author_id
  WHERE u.status = $1
  GROUP BY u.id, u.name
  HAVING COUNT(p.id) > $2
\`, 'active', 5;

// Raw query with transactions
await prisma.$transaction(async (tx) => {
  await tx.$executeRaw\`INSERT INTO "User" (email) VALUES ($1)\`, 'user@example.com';
  await tx.$queryRaw\`SELECT * FROM "User" WHERE email = $1\`, 'user@example.com';
});

// SQL equivalent:
-- SELECT * FROM "User" WHERE email = 'user@example.com';
-- UPDATE "User" SET status = 'active' WHERE id = 1;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Prisma Migrate</h2>

          <CodeBlock
            title="Prisma: Migration Commands"
            language="prisma"
            code={`// Prisma Migrate workflow:

// 1. Modify schema.prisma
// 2. Create migration
// npx prisma migrate dev --name migration_name
// - Creates migration file
// - Applies migration to database
// - Regenerates Prisma Client

// 3. Review migration SQL
// Check: prisma/migrations/YYYYMMDDHHMMSS_migration_name/migration.sql

// 4. Apply to production
// npx prisma migrate deploy
// - Applies pending migrations
// - Doesn't regenerate client

// Migration commands:

// Create and apply migration
// npx prisma migrate dev --name add_users_table

// Create migration without applying
// npx prisma migrate dev --create-only --name migration_name

// Apply pending migrations
// npx prisma migrate deploy

// Reset database (development only)
// npx prisma migrate reset
// - Drops database
// - Recreates database
// - Applies all migrations
// - Runs seed script

// View migration status
// npx prisma migrate status
// Shows which migrations are applied

// Resolve migration issues
// npx prisma migrate resolve --applied migration_name
// npx prisma migrate resolve --rolled-back migration_name

// Example migration file:
-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_fkey" 
FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Prisma Studio</h2>

          <CodeBlock
            title="Prisma: Prisma Studio"
            language="prisma"
            code={`// Prisma Studio - Visual database browser
// npx prisma studio
// Opens browser at http://localhost:5555

// Features:
// - Browse tables and data
// - Create, read, update, delete records
// - View relationships
// - Filter and search
// - Export data

// Prisma Studio is useful for:
// - Development and debugging
// - Data inspection
// - Quick data entry
// - Testing queries

// Access Prisma Studio:
// 1. Run: npx prisma studio
// 2. Open browser to http://localhost:5555
// 3. Select table from sidebar
// 4. View and edit data

// Prisma Studio shows:
// - All tables from schema
// - Relationships between tables
// - Data in tables
// - Ability to edit records

// Note: Prisma Studio is read-only by default in some configurations
// Check Prisma documentation for write access configuration`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Prisma Client Extensions</h2>

          <CodeBlock
            title="Prisma: Client Extensions"
            language="prisma"
            code={`// Prisma Client Extensions (Prisma 4.7+)
// Add custom methods to Prisma Client

import { Prisma } from '@prisma/client';

const prisma = new PrismaClient().$extends({
  model: {
    user: {
      async findByEmail(email: string) {
        return prisma.user.findUnique({
          where: { email }
        });
      }
    }
  },
  query: {
    user: {
      async findMany({ args, query }) {
        // Add default filtering
        args.where = { ...args.where, status: 'active' };
        return query(args);
      }
    }
  },
  result: {
    user: {
      fullName: {
        needs: { firstName: true, lastName: true },
        compute(user) {
          return \`\${user.firstName} \${user.lastName}\`;
        }
      }
    }
  }
});

// Use extended client
const user = await prisma.user.findByEmail('user@example.com');
const fullName = user.fullName;  // Computed field

// SQL equivalent:
-- Custom functions would be created in PostgreSQL
-- CREATE FUNCTION find_user_by_email(email TEXT) RETURNS users AS ...`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Prisma Middleware</h2>

          <CodeBlock
            title="Prisma: Middleware"
            language="prisma"
            code={`// Prisma Middleware - Intercept queries

// Logging middleware
prisma.$use(async (params, next) => {
  const before = Date.now();
  const result = await next(params);
  const after = Date.now();
  
  console.log(\`Query \${params.model}.\${params.action} took \${after - before}ms\`);
  
  return result;
});

// Soft delete middleware
prisma.$use(async (params, next) => {
  if (params.model === 'User' && params.action === 'delete') {
    // Convert delete to update
    return prisma.user.update({
      where: params.args.where,
      data: { deletedAt: new Date() }
    });
  }
  return next(params);
});

// Validation middleware
prisma.$use(async (params, next) => {
  if (params.model === 'User' && params.action === 'create') {
    // Validate email
    if (!params.args.data.email.includes('@')) {
      throw new Error('Invalid email');
    }
  }
  return next(params);
});

// Audit logging middleware
prisma.$use(async (params, next) => {
  if (['create', 'update', 'delete'].includes(params.action)) {
    await prisma.auditLog.create({
      data: {
        model: params.model,
        action: params.action,
        timestamp: new Date()
      }
    });
  }
  return next(params);
});

// SQL equivalent:
-- Triggers in PostgreSQL
-- CREATE TRIGGER audit_trigger AFTER INSERT OR UPDATE OR DELETE ON users ...`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Use $queryRaw with parameters</strong> - prevents SQL injection</li>
              <li><strong>Avoid $queryRawUnsafe</strong> - only when necessary</li>
              <li><strong>Review migration SQL</strong> - before applying to production</li>
              <li><strong>Use Prisma Studio</strong> - for development and debugging</li>
              <li><strong>Use middleware</strong> - for cross-cutting concerns</li>
              <li><strong>Use client extensions</strong> - for reusable query patterns</li>
              <li><strong>Test migrations</strong> - on staging before production</li>
              <li><strong>Backup before migrations</strong> - in production</li>
            </ul>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}


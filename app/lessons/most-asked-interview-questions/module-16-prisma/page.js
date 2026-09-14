import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';
import InterviewQACard from '../../../components/InterviewQACard';

export const metadata = {
  title: 'Module 16: Prisma ORM - Most Asked Interview Questions',
  description:
    'Most asked Prisma ORM interview questions covering Client, Migrate, schema, CRUD, relations, transactions, extensions, pooling, and Prisma vs TypeORM/Drizzle — Junior to Senior.',
};

export default function Module16Prisma() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Module 16: Prisma ORM</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Most asked interview questions for Phase 16 — Junior → Senior. Densest Prisma module: Client,
          Migrate, schema, relations, transactions, extensions, serverless pooling, and tradeoffs vs other ORMs.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard
            level="Junior"
            question="What is Prisma? How do Prisma Client, Prisma Migrate, and Prisma Studio differ?"
          >
            <p>
              Prisma is a next-generation TypeScript ORM for PostgreSQL (and other databases). It gives you a
              typed query API generated from a declarative schema, plus migration and inspection tools.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Prisma Client:</strong> Generated TypeScript/JavaScript library for queries (
                <code>findMany</code>, <code>create</code>, etc.)
              </li>
              <li>
                <strong>Prisma Migrate:</strong> Schema-diff + SQL migration workflow (
                <code>migrate dev</code> / <code>migrate deploy</code>)
              </li>
              <li>
                <strong>Prisma Studio:</strong> Local GUI to browse and edit data in the database
              </li>
              <li>
                Supporting pieces: <code>schema.prisma</code>, <code>prisma generate</code>, optional
                Accelerate / Pulse / driver adapters
              </li>
            </ul>
            <CodeBlock
              title="Typical workflow commands"
              language="bash"
              code={`npx prisma init
npx prisma migrate dev --name init   # create + apply migration (dev)
npx prisma generate                  # regenerate Client
npx prisma studio                    # open data browser
npx prisma migrate deploy            # apply pending migrations (prod/CI)`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Junior"
            question="Explain schema.prisma model basics: @id, @default, @unique, @relation."
          >
            <p>
              Models map to tables. Field attributes declare primary keys, defaults, uniqueness, and
              relationships. Table/index-level rules use <code>@@</code> attributes.
            </p>
            <CodeBlock
              title="schema.prisma essentials"
              language="typescript"
              code={`// schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid()) // or uuid(), autoincrement()
  email     String   @unique
  name      String?
  role      Role     @default(USER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  posts     Post[]
  profile   Profile?
}

model Profile {
  id     Int    @id @default(autoincrement())
  bio    String?
  userId String @unique
  user   User   @relation(fields: [userId], references: [id])
}

model Post {
  id       Int    @id @default(autoincrement())
  title    String
  authorId String
  author   User   @relation(fields: [authorId], references: [id])

  @@index([authorId])
}

enum Role {
  USER
  ADMIN
}`}
            />
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <code>@id</code> — primary key; <code>@@id([a, b])</code> for composite
              </li>
              <li>
                <code>@default(...)</code> — DB or Prisma-side default; <code>@updatedAt</code> auto-touches
                on update
              </li>
              <li>
                <code>@unique</code> / <code>@@unique</code> — unique constraint
              </li>
              <li>
                <code>@relation</code> — links models; side with foreign key uses{' '}
                <code>fields</code> / <code>references</code>
              </li>
            </ul>
          </InterviewQACard>

          <InterviewQACard
            level="Junior"
            question="How do you model 1:1, 1:N, and M:N (implicit vs explicit) in Prisma?"
          >
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>1:1:</strong> FK on one side is <code>@unique</code> (e.g. User ↔ Profile)
              </li>
              <li>
                <strong>1:N:</strong> FK on the “many” side; parent has an array field (User → Post[])
              </li>
              <li>
                <strong>M:N implicit:</strong> both sides have array fields; Prisma creates a hidden join table
              </li>
              <li>
                <strong>M:N explicit:</strong> you define a join model when you need extra columns (role,
                assignedAt)
              </li>
            </ul>
            <CodeBlock
              title="Implicit vs explicit many-to-many"
              language="typescript"
              code={`// Implicit M:N — Prisma manages _PostToTag join table
model Post {
  id   Int   @id @default(autoincrement())
  tags Tag[]
}
model Tag {
  id    Int    @id @default(autoincrement())
  posts Post[]
}

// Explicit M:N — join model with payload
model Enrollment {
  studentId Int
  courseId  Int
  grade     String?
  enrolledAt DateTime @default(now())
  student   Student @relation(fields: [studentId], references: [id])
  course    Course  @relation(fields: [courseId], references: [id])

  @@id([studentId, courseId])
}`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Junior"
            question="Show findUnique, findFirst, findMany, create, update, upsert, and delete."
          >
            <CodeBlock
              title="Prisma CRUD patterns"
              language="typescript"
              code={`// Unique lookup (needs @id / @unique / @@unique)
const user = await prisma.user.findUnique({ where: { email: 'a@b.com' } });

// First match (any filter; order matters)
const draft = await prisma.post.findFirst({
  where: { published: false },
  orderBy: { createdAt: 'desc' },
});

const posts = await prisma.post.findMany({
  where: { authorId: user.id },
  orderBy: { createdAt: 'desc' },
  take: 20,
});

const created = await prisma.user.create({
  data: { email: 'a@b.com', name: 'Ada' },
});

const updated = await prisma.user.update({
  where: { id: created.id },
  data: { name: 'Ada Lovelace' },
});

// Insert or update on unique conflict
const upserted = await prisma.user.upsert({
  where: { email: 'a@b.com' },
  create: { email: 'a@b.com', name: 'Ada' },
  update: { name: 'Ada Lovelace' },
});

await prisma.post.delete({ where: { id: 1 } });`}
            />
            <CodeBlock
              title="Equivalent SQL mindset"
              language="sql"
              code={`SELECT * FROM "User" WHERE email = 'a@b.com'; -- findUnique
SELECT * FROM "Post" WHERE published = false ORDER BY "createdAt" DESC LIMIT 1;
INSERT INTO "User" (email, name) VALUES (...);
UPDATE "User" SET name = 'Ada Lovelace' WHERE id = ...;
INSERT ... ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name;
DELETE FROM "Post" WHERE id = 1;`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Junior"
            question="What is the difference between include and select? Why does it matter for performance?"
          >
            <p>
              Both shape the returned object. <code>include</code> keeps all scalar fields and adds relations.
              <code>select</code> returns <em>only</em> the fields you list (scalars and nested selects).
              You cannot mix top-level <code>include</code> and <code>select</code> on the same query.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Prefer <code>select</code> when you need a slim payload (APIs, lists) — less data over the wire
              </li>
              <li>
                Prefer <code>include</code> for convenience when you want the full row plus relations
              </li>
              <li>
                Over-including deep trees causes heavy JOINs / extra queries — a common production smell
              </li>
            </ul>
            <CodeBlock
              title="include vs select"
              language="typescript"
              code={`// Full user + all posts (can be large)
await prisma.user.findUnique({
  where: { id },
  include: { posts: true },
});

// Only what the UI needs
await prisma.user.findUnique({
  where: { id },
  select: {
    id: true,
    email: true,
    posts: { select: { id: true, title: true }, take: 5 },
  },
});`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Junior"
            question="How do you create a PrismaClient singleton in Next.js / serverless?"
          >
            <p>
              Hot reload and serverless invocations can create many <code>PrismaClient</code> instances and
              exhaust the connection pool. Cache one client on <code>globalThis</code> in development.
            </p>
            <CodeBlock
              title="lib/prisma.ts singleton"
              language="typescript"
              code={`import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard
            level="Mid"
            question="What are the limitations of createMany, updateMany, and deleteMany?"
          >
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <code>createMany</code> / <code>updateMany</code> / <code>deleteMany</code> return a{' '}
                <strong>count</strong>, not the full rows (no automatic RETURNING of all fields like{' '}
                <code>create</code>)
              </li>
              <li>
                <code>createMany</code> does not support nested relation writes
              </li>
              <li>
                <code>skipDuplicates: true</code> on <code>createMany</code> skips unique conflicts (Postgres{' '}
                <code>ON CONFLICT DO NOTHING</code>)
              </li>
              <li>
                For “insert many and get rows back,” use a transaction of <code>create</code>s, or{' '}
                <code>$queryRaw</code> with <code>RETURNING</code>, or <code>createManyAndReturn</code> (Prisma
                5.14+ where supported)
              </li>
            </ul>
            <CodeBlock
              title="Bulk create with skipDuplicates"
              language="typescript"
              code={`const result = await prisma.user.createMany({
  data: [
    { email: 'a@b.com', name: 'A' },
    { email: 'c@d.com', name: 'C' },
  ],
  skipDuplicates: true,
});
// result.count === number of rows actually inserted

await prisma.post.updateMany({
  where: { published: false, authorId: id },
  data: { published: true },
});`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="How do Prisma transactions work ($transaction)?"
          >
            <p>
              Use interactive or sequential transactions when multiple writes must succeed or fail together.
            </p>
            <CodeBlock
              title="Array form vs interactive transaction"
              language="typescript"
              code={`// Sequential batch — all or nothing
const [user, post] = await prisma.$transaction([
  prisma.user.create({ data: { email: 'a@b.com' } }),
  prisma.post.create({ data: { title: 'Hello', authorId: '...' } }), // careful: needs known id
]);

// Interactive — read then write with shared tx client
await prisma.$transaction(async (tx) => {
  const from = await tx.account.update({
    where: { id: fromId },
    data: { balance: { decrement: 100 } },
  });
  if (from.balance < 0) throw new Error('Insufficient funds');

  await tx.account.update({
    where: { id: toId },
    data: { balance: { increment: 100 } },
  });
}, {
  maxWait: 5000,
  timeout: 10000,
  isolationLevel: 'Serializable', // optional
});`}
            />
            <CodeBlock
              title="SQL equivalent mindset"
              language="sql"
              code={`BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = $1;
UPDATE accounts SET balance = balance + 100 WHERE id = $2;
COMMIT; -- or ROLLBACK on error`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="What is the N+1 problem, and how does Prisma load relations?"
          >
            <p>
              N+1 means 1 query for parents plus N queries for each parent’s children. In Prisma, looping with
              a separate <code>findMany</code> / relation call per row causes N+1. Using <code>include</code> /{' '}
              <code>select</code> lets Prisma batch relation loading efficiently for that query tree.
            </p>
            <CodeBlock
              title="Bad vs good"
              language="typescript"
              code={`// ❌ N+1 — one query per user
const users = await prisma.user.findMany();
for (const u of users) {
  u.posts = await prisma.post.findMany({ where: { authorId: u.id } });
}

// ✅ Single query tree with include
const usersWithPosts = await prisma.user.findMany({
  include: { posts: true },
});

// ✅ Or filter relation existence (EXISTS-style)
const authors = await prisma.user.findMany({
  where: { posts: { some: { published: true } } },
});`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="When and how do you use $queryRaw / $executeRaw and Prisma.sql?"
          >
            <p>
              Use raw SQL for features Prisma does not express well (complex CTEs, window functions,{' '}
              <code>FOR UPDATE SKIP LOCKED</code>, DB-specific operators). Prefer the tagged template{' '}
              <code>Prisma.sql</code> / <code>{'$queryRaw`...`'}</code> so parameters are safely bound (avoids SQL
              injection).
            </p>
            <CodeBlock
              title="Safe tagged template + typed result"
              language="typescript"
              code={`import { Prisma } from '@prisma/client';

const minViews = 100;
const rows = await prisma.$queryRaw<{ id: number; title: string }[]>\`
  SELECT id, title
  FROM "Post"
  WHERE views > \${minViews}
  ORDER BY views DESC
  LIMIT 10
\`;

// Dynamic identifiers carefully (not user input!)
const table = Prisma.raw('"Post"');
await prisma.$executeRaw\`UPDATE \${table} SET published = true WHERE id = \${1}\`;

// Unsafe string concat — NEVER with user input
// await prisma.$queryRawUnsafe(\`SELECT * FROM "Post" WHERE title = '\${title}'\`)`}
            />
            <p className="text-sm">
              Prisma 5+ also offers <strong>TypedSQL</strong> (preview/GA depending on version): write{' '}
              <code>.sql</code> files and get generated typed functions — common senior talking point.
            </p>
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="migrate dev vs migrate deploy vs db push — when do you use each?"
          >
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>
                  <code>prisma migrate dev</code>:
                </strong>{' '}
                local development — creates migration SQL from schema diff, applies it, regenerates client.
                May reset shadow DB; not for production.
              </li>
              <li>
                <strong>
                  <code>prisma migrate deploy</code>:
                </strong>{' '}
                CI/production — applies pending migrations from <code>prisma/migrations</code> only; does not
                invent new ones.
              </li>
              <li>
                <strong>
                  <code>prisma db push</code>:
                </strong>{' '}
                pushes schema without creating migration history — fine for prototypes/spikes, risky for
                shared/prod DBs.
              </li>
            </ul>
            <CodeBlock
              title="CI/CD pattern"
              language="bash"
              code={`# Local
npx prisma migrate dev --name add_user_role

# Pipeline / production release
npx prisma migrate deploy
npx prisma generate`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How do you seed a Prisma database?">
            <CodeBlock
              title="prisma/seed.ts + package.json"
              language="typescript"
              code={`// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: { email: 'admin@example.com', name: 'Admin', role: 'ADMIN' },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

// package.json
// "prisma": { "seed": "tsx prisma/seed.ts" }
// then: npx prisma db seed`}
            />
            <ul className="list-disc pl-6 space-y-1">
              <li>Use upserts so seeds are idempotent</li>
              <li>
                <code>migrate dev</code> can run seed when configured; keep prod seed separate/controlled
              </li>
            </ul>
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How do you implement soft deletes with Prisma?">
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Add <code>deletedAt DateTime?</code> (or <code>isDeleted</code>) and filter it on reads
              </li>
              <li>
                Enforce via client extension / middleware so developers cannot forget the filter
              </li>
              <li>Unique constraints must account for soft-deleted rows (partial unique indexes in raw SQL)</li>
            </ul>
            <CodeBlock
              title="Soft delete field + filtered query"
              language="typescript"
              code={`model User {
  id        String    @id @default(cuid())
  email     String
  deletedAt DateTime?

  @@unique([email]) // often replaced by partial unique index in SQL
}

await prisma.user.update({
  where: { id },
  data: { deletedAt: new Date() },
});

await prisma.user.findMany({
  where: { deletedAt: null },
});`}
            />
            <CodeBlock
              title="Partial unique index (SQL migration)"
              language="sql"
              code={`CREATE UNIQUE INDEX user_email_active_uidx
ON "User" (email)
WHERE "deletedAt" IS NULL;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How do you filter JSON / JSONB fields in Prisma?">
            <p>
              Prisma maps Postgres JSONB to <code>Json</code>. Use path filters (
              <code>path</code> + <code>equals</code> / <code>string_contains</code>, etc.) or raw SQL for
              advanced JSONPath / GIN queries.
            </p>
            <CodeBlock
              title="JSON filters"
              language="typescript"
              code={`model Event {
  id   Int  @id @default(autoincrement())
  meta Json
}

// meta = { "source": "web", "tags": ["a"] }
await prisma.event.findMany({
  where: {
    meta: {
      path: ['source'],
      equals: 'web',
    },
  },
});

await prisma.$queryRaw\`
  SELECT * FROM "Event"
  WHERE meta @> '{"source":"web"}'::jsonb
\`;`}
            />
            <CodeBlock
              title="Index JSONB in SQL"
              language="sql"
              code={`CREATE INDEX event_meta_gin ON "Event" USING GIN (meta);
-- or expression index for a hot key:
CREATE INDEX event_meta_source ON "Event" ((meta->>'source'));`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="What are common Prisma error codes (e.g. P2002) you should know in interviews?"
          >
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>P2002</strong> — unique constraint violation
              </li>
              <li>
                <strong>P2003</strong> — foreign key constraint failed
              </li>
              <li>
                <strong>P2025</strong> — record to update/delete not found
              </li>
              <li>
                <strong>P1001 / P1002</strong> — cannot reach database / timed out
              </li>
              <li>
                <strong>P2034</strong> — transaction conflict / write conflict (retry candidate)
              </li>
            </ul>
            <CodeBlock
              title="Handle P2002 in an API"
              language="typescript"
              code={`import { Prisma } from '@prisma/client';

try {
  await prisma.user.create({ data: { email } });
} catch (e) {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
    // e.meta?.target → ['email']
    return Response.json({ error: 'Email already registered' }, { status: 409 });
  }
  throw e;
}`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard
            level="Senior"
            question="Middleware vs Client Extensions — what changed in modern Prisma?"
          >
            <p>
              Legacy <code>$use</code> middleware is superseded by <strong>Client Extensions</strong> (
              <code>$extends</code>) for query hooks, custom methods, computed fields, and result shaping.
              Extensions compose cleanly and are the recommended approach in Prisma 5/6.
            </p>
            <CodeBlock
              title="Client extension examples"
              language="typescript"
              code={`const prisma = new PrismaClient().$extends({
  query: {
    user: {
      async findMany({ args, query }) {
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
    },
  },
  model: {
    user: {
      async softDelete(id: string) {
        return prisma.user.update({
          where: { id },
          data: { deletedAt: new Date() },
        });
      },
    },
  },
  result: {
    user: {
      displayName: {
        needs: { name: true, email: true },
        compute(u) {
          return u.name ?? u.email;
        },
      },
    },
  },
});`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Senior"
            question="How do you handle connection pooling and serverless with Prisma (PgBouncer, Accelerate, adapters)?"
          >
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Serverless (Vercel/Lambda) + many cold starts × open connections = pool exhaustion
              </li>
              <li>
                Use an external pooler (PgBouncer, Neon/Supabase pooler) with{' '}
                <code>?pgbouncer=true</code> / transaction mode; often separate <code>DATABASE_URL</code>{' '}
                (pooled) and <code>DIRECT_URL</code> (migrations)
              </li>
              <li>
                <strong>Prisma Accelerate:</strong> managed connection pool + global cache in front of your DB
              </li>
              <li>
                <strong>Driver adapters</strong> (Prisma 5+): run Prisma on top of <code>node-postgres</code>,{' '}
                <code>neon</code>, PlanetScale, etc., instead of only the built-in engine binary — common in
                edge/serverless setups
              </li>
              <li>
                Still keep a singleton Client; set low <code>connection_limit</code> per instance when using
                poolers
              </li>
            </ul>
            <CodeBlock
              title="Pooled + direct URLs"
              language="typescript"
              code={`// schema.prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")   // pooled
  directUrl = env("DIRECT_URL")     // for migrate
}

// .env
// DATABASE_URL="postgresql://user:pass@pooler:6543/db?pgbouncer=true&connection_limit=1"
// DIRECT_URL="postgresql://user:pass@primary:5432/db"`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Senior"
            question="What are relationMode, Accelerate, and Pulse at a high level?"
          >
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>relationMode = "prisma":</strong> emulates relations in the Client when the database
                lacks foreign keys (historically PlanetScale/MySQL). With PostgreSQL you normally keep native
                FKs (default). Knowing this shows you understand Prisma on non-FK databases.
              </li>
              <li>
                <strong>Accelerate:</strong> connection pooling + query caching edge network;{' '}
                <code>withAccelerate()</code> extension; cache strategy on queries.
              </li>
              <li>
                <strong>Pulse:</strong> change-data-capture style subscriptions to DB changes (real-time /
                event-driven patterns) — mention at high level if asked about Prisma Data Platform.
              </li>
            </ul>
          </InterviewQACard>

          <InterviewQACard
            level="Senior"
            question="Prisma vs TypeORM vs Drizzle — what tradeoffs do interviewers expect?"
          >
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Prisma:</strong> best-in-class DX and generated types; migrations opinionated; some
                complex SQL still needs raw; historically heavier engine binary (adapters mitigate)
              </li>
              <li>
                <strong>TypeORM:</strong> decorator/Active Record or Data Mapper; flexible but weaker typing
                and more footguns; still common in NestJS codebases
              </li>
              <li>
                <strong>Drizzle:</strong> SQL-like TypeScript schema, lightweight, close to SQL, great for
                performance-minded teams; less “batteries included” studio/migrate UX than Prisma
              </li>
              <li>
                Pick Prisma for typed CRUD velocity; Drizzle when you want SQL transparency; TypeORM when
                matching an existing Nest/TypeORM stack
              </li>
            </ul>
          </InterviewQACard>

          <InterviewQACard
            level="Senior"
            question="How would you design production-safe Prisma usage for a high-traffic Nest/Next API?"
          >
            <ul className="list-disc pl-6 space-y-1">
              <li>Singleton Client + pooled URL + direct URL for migrations</li>
              <li>
                Explicit <code>select</code> on public endpoints; avoid unbounded <code>include</code>
              </li>
              <li>
                Transactions for multi-row invariants; retry on <code>P2034</code> where appropriate
              </li>
              <li>
                Extensions for soft delete / multi-tenant <code>WHERE tenantId = …</code> enforcement
              </li>
              <li>
                <code>migrate deploy</code> in CI before traffic shifts; never <code>db push</code> in prod
              </li>
              <li>
                Monitor pool wait, query latency, and Prisma error rates (see Module 17)
              </li>
              <li>
                Use <code>$queryRaw</code> / TypedSQL for hot paths that need hand-tuned SQL and indexes
              </li>
            </ul>
            <CodeBlock
              title="Tenant-scoped extension sketch"
              language="typescript"
              code={`const db = prisma.$extends({
  query: {
    $allModels: {
      async findMany({ model, args, query }) {
        if (model !== 'AuditLog') {
          args.where = { ...args.where, tenantId };
        }
        return query(args);
      },
    },
  },
});`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

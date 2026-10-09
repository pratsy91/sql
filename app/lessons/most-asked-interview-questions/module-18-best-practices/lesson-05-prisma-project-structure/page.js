import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 5: Prisma Project Structure - Module 18 - Most Asked Interview Questions',
  description:
    'Most asked Prisma architecture interview questions: multi-file schemas, the PrismaClient singleton in Next.js, a repository or service layer, where shared select objects live, testing against a real database versus mocks, and patterns that keep Prisma codebases maintainable.',
};

export default function M18L5PrismaProjectStructure() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 5: Prisma Project Structure</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Prisma is easy to start with and easy to spread everywhere. This lesson is about the structural decisions
          that keep a growing codebase understandable: where the schema lives, where the client lives, who is
          allowed to call the database, and how you test any of it.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard
            level="Junior"
            question="How do you organise a large Prisma schema across multiple files?"
          >
            <p>
              Prisma 5.15 and later supports <strong>multi-file schemas</strong>. Instead of one giant{' '}
              <code>schema.prisma</code>, you put several <code>.prisma</code> files in a folder, usually{' '}
              <code>prisma/schema/</code>, and split them by domain.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                One file holds the <code>generator</code> and <code>datasource</code> blocks; there can only be one
                of each across the whole folder
              </li>
              <li>Models are grouped by business area, which matches how teams own code</li>
              <li>
                Relations still work across files, because Prisma loads the folder as one schema before validating
                it
              </li>
              <li>Enums live next to the models that use them</li>
            </ul>
            <CodeBlock
              title="Multi-file layout"
              language="bash"
              code={`prisma/
  schema/
    base.prisma      # generator + datasource only
    user.prisma      # User, Profile, Session
    billing.prisma   # Customer, Invoice, InvoiceLine
    catalog.prisma   # Product, Sku, Category
  migrations/
  seed.ts`}
            />
            <CodeBlock
              title="Point the tooling at the folder"
              language="json"
              code={`{
  "prisma": {
    "schema": "prisma/schema",
    "seed": "tsx prisma/seed.ts"
  }
}`}
            />
            <CodeBlock
              title="Relations across files are unchanged"
              language="typescript"
              code={`// prisma/schema/user.prisma
model User {
  id       Int       @id @default(autoincrement())
  email    String    @unique
  invoices Invoice[]
}

// prisma/schema/billing.prisma
model Invoice {
  id     Int    @id @default(autoincrement())
  userId Int
  user   User   @relation(fields: [userId], references: [id])

  @@index([userId])
}`}
            />
            <p>
              Everything else works the same: <code>prisma format</code>,{' '}
              <code>prisma migrate dev</code> and <code>prisma generate</code> all accept the directory, and
              migrations are still a single shared history. On older versions the workaround was a build step that
              concatenated files, which is worth knowing only so you can say why you no longer need it.
            </p>
          </InterviewQACard>

          <InterviewQACard
            level="Junior"
            question="Where should the PrismaClient instance live in a Next.js app?"
          >
            <p>
              In exactly one module that everything imports. Creating a new <code>PrismaClient</code> per file or
              per request opens a new connection pool each time, and you run out of database connections.
            </p>
            <p>
              In development this needs one extra trick. Next.js hot reload re-executes modules, so each save would
              create another client. Storing it on the <code>globalThis</code> object survives the reload.
            </p>
            <CodeBlock
              title="lib/prisma.js — the singleton"
              language="javascript"
              code={`import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}`}
            />
            <CodeBlock
              title="Use it everywhere"
              language="javascript"
              code={`import { prisma } from '@/lib/prisma';

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  return <UserList users={users} />;
}`}
            />
            <p>
              Two related points that come up straight after. Prisma must only run on the server: importing it into
              a client component leaks database credentials into the browser bundle, which is why it belongs in
              server components, route handlers and server actions only.
            </p>
            <p>
              And in a serverless environment each function instance has its own pool, so the total number of
              connections is instances multiplied by pool size. That is the case for an external pooler such as
              pgBouncer or Prisma Accelerate, plus a small{' '}
              <code>connection_limit</code> in the connection string.
            </p>
          </InterviewQACard>

          <InterviewQACard
            level="Junior"
            question="Where should shared select objects live?"
          >
            <p>
              In a small module next to the model they describe, exported as named constants. A{' '}
              <code>select</code> object is the shape of data your API returns, so it deserves a name and a single
              definition rather than being retyped in twelve route handlers.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                One file per domain, such as <code>lib/db/selects/user.ts</code>
              </li>
              <li>Name them by intent: the public shape, the list shape, the detail shape</li>
              <li>
                Use <code>Prisma.validator</code> so a typo is a compile error, and{' '}
                <code>Prisma.UserGetPayload</code> to derive the return type
              </li>
              <li>
                Keep them small. A giant nested <code>select</code> reused everywhere becomes the{' '}
                <code>SELECT *</code> you were trying to avoid
              </li>
            </ul>
            <CodeBlock
              title="lib/db/selects/user.ts"
              language="typescript"
              code={`import { Prisma } from '@prisma/client';

// Safe to send to a browser: no passwordHash, no internal flags
export const userPublicSelect = Prisma.validator<Prisma.UserSelect>()({
  id: true,
  email: true,
  displayName: true,
  createdAt: true,
});

export const userWithTeamSelect = Prisma.validator<Prisma.UserSelect>()({
  ...userPublicSelect,
  team: { select: { id: true, name: true } },
});

// The return type comes from the select, so it can never drift
export type UserPublic = Prisma.UserGetPayload<{ select: typeof userPublicSelect }>;`}
            />
            <CodeBlock
              title="Reuse it"
              language="typescript"
              code={`import { prisma } from '@/lib/prisma';
import { userPublicSelect } from '@/lib/db/selects/user';

export async function listUsers(take = 20) {
  return prisma.user.findMany({
    select: userPublicSelect,
    orderBy: { createdAt: 'desc' },
    take,
  });
}`}
            />
            <p>
              The real payoff is security. When someone adds a <code>passwordHash</code> or{' '}
              <code>internalNotes</code> column, it does not appear in any response, because every response is
              built from a named allow-list. That is much easier to audit than hunting for places that forgot to
              exclude it.
            </p>
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard
            level="Mid"
            question="Should you put a repository or service layer over Prisma?"
          >
            <p>
              Prisma is already a data-access layer, so wrapping every model in a thin class that just forwards
              calls adds files and no value. What does earn its place is a module per use case that owns the
              queries and the rules around them.
            </p>
            <p>
              The distinction is worth stating clearly in an interview. A <strong>repository</strong> hides the
              query: callers ask for <code>findActiveByTeam(teamId)</code> and do not know the filter. A{' '}
              <strong>service</strong> owns the business operation: <code>publishPost</code> validates, writes and
              records an audit row, possibly across several tables in one transaction.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Worth doing:</strong> queries reused in more than one place, anything involving a
                transaction, anything with an authorisation rule, and any query complex enough to need a comment
              </li>
              <li>
                <strong>Not worth doing:</strong> a one-line <code>findUnique</code> called from one server
                component
              </li>
              <li>
                Pass the transaction client as an argument so the same function works inside and outside a
                transaction
              </li>
              <li>Keep transaction boundaries in the service, never in a React component or a repository method</li>
            </ul>
            <CodeBlock
              title="lib/db/posts.ts — the query layer"
              language="typescript"
              code={`import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// Accept either the normal client or a transaction client
type Db = Prisma.TransactionClient | typeof prisma;

export function findPublishedByAuthor(authorId: number, db: Db = prisma) {
  return db.post.findMany({
    where: { authorId, publishedAt: { not: null } },
    select: { id: true, title: true, publishedAt: true },
    orderBy: { publishedAt: 'desc' },
  });
}

export function markPublished(id: string, db: Db = prisma) {
  return db.post.update({
    where: { id },
    data: { publishedAt: new Date() },
  });
}`}
            />
            <CodeBlock
              title="lib/services/publishPost.ts — the use case"
              language="typescript"
              code={`import { prisma } from '@/lib/prisma';
import { markPublished } from '@/lib/db/posts';

export async function publishPost(postId: string, actorId: number) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, authorId: true, publishedAt: true },
  });

  if (!post) throw new Error('NOT_FOUND');
  if (post.authorId !== actorId) throw new Error('FORBIDDEN');
  if (post.publishedAt) return post;   // already published, idempotent

  return prisma.$transaction(async (tx) => {
    const updated = await markPublished(postId, tx);
    await tx.auditLog.create({
      data: { actorId, action: 'post.published', targetId: postId },
    });
    return updated;
  });
}`}
            />
            <p>
              The common failure mode without this layer is authorisation drift. If <code>where</code> clauses live
              in route handlers, the day someone adds a new endpoint and forgets the{' '}
              <code>teamId</code> filter is the day one customer sees another customer&apos;s data. Prisma Client
              Extensions can enforce such filters globally, which is the stronger version of the same idea.
            </p>
            <CodeBlock
              title="A client extension that cannot be forgotten"
              language="typescript"
              code={`const withoutDeleted = prisma.$extends({
  query: {
    $allModels: {
      async findMany({ args, query }) {
        args.where = { deletedAt: null, ...args.where };
        return query(args);
      },
    },
  },
});`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="Should you test Prisma code against a real database or mock it?"
          >
            <p>
              Test against a real PostgreSQL database. Mocking Prisma verifies that you called Prisma the way your
              test expects, which is the one thing that is never in doubt. It cannot catch the bugs that actually
              happen: a wrong <code>where</code> clause, a missing index, a unique violation, a cascade that
              deleted more than you meant, or SQL that Prisma generated differently from your mental model.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Run PostgreSQL in Docker for local and CI runs, or use Testcontainers so the test suite starts it
                itself
              </li>
              <li>
                Apply the schema with <code>prisma migrate deploy</code>, which also tests that your migrations
                work from scratch
              </li>
              <li>
                Isolate tests by giving each worker its own schema, or by wrapping each test in a transaction that
                rolls back
              </li>
              <li>
                Build data with factory functions, not a giant shared seed file that every test secretly depends on
              </li>
              <li>
                Mock only the things outside your system: payment providers, email, third-party HTTP
              </li>
            </ul>
            <CodeBlock
              title="CI service container"
              language="yaml"
              code={`services:
  postgres:
    image: postgres:16
    env:
      POSTGRES_PASSWORD: postgres
    options: --health-cmd pg_isready --health-interval 5s --health-retries 10
    ports:
      - 5432:5432`}
            />
            <CodeBlock
              title="Per-worker schema keeps parallel tests isolated"
              language="typescript"
              code={`import { execSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';

const schema = 'test_' + process.env.VITEST_WORKER_ID;
const url = process.env.BASE_DATABASE_URL + '?schema=' + schema;

execSync('npx prisma migrate deploy', { env: { ...process.env, DATABASE_URL: url } });

export const prisma = new PrismaClient({ datasources: { db: { url } } });`}
            />
            <CodeBlock
              title="Roll back after each test, so nothing leaks between them"
              language="typescript"
              code={`// Each test runs inside a transaction that is always aborted
export async function inRollback(fn) {
  const ROLLBACK = Symbol('rollback');
  try {
    await prisma.$transaction(async (tx) => {
      await fn(tx);
      throw ROLLBACK;
    });
  } catch (e) {
    if (e !== ROLLBACK) throw e;
  }
}

test('cannot publish a post you do not own', async () => {
  await inRollback(async (tx) => {
    const author = await tx.user.create({ data: { email: 'a@example.com' } });
    const post = await tx.post.create({ data: { title: 'x', authorId: author.id } });
    await expect(publishPost(post.id, 999)).rejects.toThrow('FORBIDDEN');
  });
});`}
            />
            <p>
              Be honest about the cost: real-database tests are slower than unit tests and need infrastructure in
              CI. The usual shape is a wide layer of fast pure-function tests for business logic that does not
              touch the database, plus a focused set of database tests for queries, constraints and transactions.
            </p>
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard
            level="Senior"
            question="What application patterns keep Prisma codebases maintainable at scale?"
          >
            <p>
              At scale the problems are not query syntax. They are that nobody can find where a query lives, that
              internal fields leak into responses, and that a rule like tenant isolation is enforced in 200 places
              and therefore in 199.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                A data-access layer per domain. Client calls scattered through UI components make it impossible to
                audit what touches which table
              </li>
              <li>
                Explicit response shapes via <code>select</code>. Never return a full Prisma entity from an API,
                because the response shape then changes every time someone adds a column
              </li>
              <li>
                Enforce cross-cutting rules in Client Extensions rather than ad-hoc filters: tenant scoping, soft
                delete, and audit timestamps
              </li>
              <li>
                Transaction boundaries at the use-case level, and kept short. Never open one around an external HTTP
                call
              </li>
              <li>
                Reach for raw SQL for the small share of queries that need it. TypedSQL gives you a typed result
                for hand-written SQL, so you do not lose type safety when you drop down a level
              </li>
              <li>
                Watch the N+1 pattern. Prisma&apos;s <code>include</code> issues one extra query per relation, which
                is fine, but a loop that calls <code>findUnique</code> per item is not
              </li>
              <li>
                Turn on query logging with durations in staging, and connect it to{' '}
                <code>pg_stat_statements</code> so a slow endpoint can be traced to a statement
              </li>
              <li>
                Treat the schema file as a reviewed interface. Every field needs an owner, and dead fields get
                removed through expand and contract
              </li>
            </ul>
            <CodeBlock
              title="Tenant scoping that cannot be forgotten"
              language="typescript"
              code={`export function forTenant(tenantId: string) {
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          if (args && typeof args === 'object' && 'where' in args) {
            args.where = { tenantId, ...args.where };
          }
          return query(args);
        },
      },
    },
  });
}

// Every query in this request is scoped to one tenant
const db = forTenant(session.tenantId);
const projects = await db.project.findMany({ select: { id: true, name: true } });`}
            />
            <CodeBlock
              title="Typed raw SQL for the queries the query builder cannot express"
              language="typescript"
              code={`// prisma/sql/topAuthors.sql  ->  generated, fully typed
import { topAuthors } from '@prisma/client/sql';

const rows = await prisma.$queryRawTyped(topAuthors(10));

// Or without TypedSQL: parameters as arguments, never in the string
const busy = await prisma.$queryRawUnsafe(
  'SELECT author_id, count(*) AS n FROM posts WHERE created_at > $1 GROUP BY 1 ORDER BY n DESC LIMIT $2',
  since,
  10
);`}
            />
            <CodeBlock
              title="Spot slow queries before users do"
              language="typescript"
              code={`const prisma = new PrismaClient({ log: [{ emit: 'event', level: 'query' }] });

prisma.$on('query', (e) => {
  if (e.duration > 200) {
    console.warn('slow query', { ms: e.duration, query: e.query });
  }
});`}
            />
            <p>
              The honest caveat about extensions: they are powerful enough to be surprising. An extension that
              silently rewrites every <code>where</code> clause is wonderful for safety and confusing for the next
              engineer, so it needs a comment, a test, and a documented escape hatch for the admin queries that
              legitimately need to see everything.
            </p>
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

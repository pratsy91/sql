import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 7: Client Setup and Connection Pooling - Module 16 - Most Asked Interview Questions',
  description:
    'Most asked Prisma interview questions on the PrismaClient singleton, why a client per request breaks, connection_limit, directUrl for migrations, PgBouncer and serverless pooling, driver adapters, relationMode, Accelerate, and Pulse',
};

export default function MaiqM16L07ClientSetupAndPooling() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 7: Client Setup and Connection Pooling</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          How many Prisma clients your app should have, how many database connections each one opens, and
          what changes when the app runs on serverless.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="How do you create a PrismaClient singleton in Next.js or serverless?">
            <p>
              Hot reload in development and repeated serverless invocations can create many{' '}
              <code>PrismaClient</code> instances and exhaust the connection pool. Cache one client on{' '}
              <code>globalThis</code> so reloads reuse it.
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
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Import this one module everywhere. Never call <code>new PrismaClient()</code> inside a route
                handler or a React component
              </li>
              <li>
                The <code>globalThis</code> cache survives the module reloads that Next.js does in
                development, which is why the guard checks for development
              </li>
              <li>
                In production one process creates one client at startup and keeps it for the life of the
                process
              </li>
            </ul>
          </InterviewQACard>

          <InterviewQACard level="Junior" question="Why does creating a new PrismaClient per request break things?">
            <p>
              Each <code>PrismaClient</code> owns its own connection pool. Ten clients do not share ten
              connections, they open ten pools. On a database with a hundred connection slots that runs out
              almost immediately.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Constructing a client is expensive: it loads the query engine, reads the schema, and opens
                connections. Doing that per request adds real latency
              </li>
              <li>
                Clients that go out of scope do not close politely. Their connections linger until the
                database or the pooler times them out, so the count climbs even after traffic drops
              </li>
              <li>
                The symptoms are the classic pair: too many clients already from PostgreSQL, and P2024 from
                Prisma, meaning it timed out waiting for a connection from the pool
              </li>
              <li>
                It often looks fine locally, where one request at a time means one client at a time, and only
                falls over under real traffic
              </li>
              <li>
                Exception: a short lived script or a one off job may create a client, but it should call{' '}
                <code>$disconnect</code> when it finishes
              </li>
            </ul>
            <CodeBlock
              title="The anti pattern and the fix"
              language="typescript"
              code={`// BAD - a new pool on every request
export async function GET() {
  const prisma = new PrismaClient();
  return Response.json(await prisma.user.findMany());
}

// GOOD - import the shared singleton
import { prisma } from '@/lib/prisma';

export async function GET() {
  return Response.json(await prisma.user.findMany());
}

// Scripts and jobs: close what you opened
const client = new PrismaClient();
try {
  await client.user.count();
} finally {
  await client.$disconnect();
}`}
            />
            <CodeBlock
              title="Proving it from the database side"
              language="sql"
              code={`SELECT application_name, count(*)
FROM pg_stat_activity
GROUP BY 1
ORDER BY 2 DESC;
-- a climbing count for one app after deploy usually means a missing singleton`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="What is connection_limit, and how do you choose a value?">
            <p>
              <code>connection_limit</code> is a query parameter on the database URL that caps how many
              connections one Prisma Client opens. It is the main dial you have for keeping total connections
              under the database limit.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                The default is the number of CPU cores times two plus one, which is fine for one long running
                server and far too high for many small instances
              </li>
              <li>
                The arithmetic that matters is: instances multiplied by connection_limit must stay below
                max_connections, with headroom left for migrations, admin tools, and monitoring
              </li>
              <li>
                Set it to 1 for serverless functions behind a transaction mode pooler. Each invocation needs
                only one connection at a time, and the pooler multiplexes them
              </li>
              <li>
                Too low on a busy server means requests queue and eventually fail with P2024. The partner dial
                is <code>pool_timeout</code>, which is how long a query waits for a free connection before
                giving up
              </li>
              <li>
                Raising <code>max_connections</code> instead is usually the wrong move. Every PostgreSQL
                connection is a process with its own memory, so a pooler scales better
              </li>
            </ul>
            <CodeBlock
              title="Sizing by deployment shape"
              language="bash"
              code={`# One long running container, 4 cores, 100 max_connections
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=10"

# Many serverless instances behind a transaction pooler
DATABASE_URL="postgresql://user:pass@pooler:6543/db?pgbouncer=true&connection_limit=1&pool_timeout=10"

# Turn off the wait entirely so failures are instant and loud
# ?pool_timeout=0`}
            />
            <CodeBlock
              title="Check the ceiling you are working against"
              language="sql"
              code={`SHOW max_connections;

SELECT count(*) AS total,
       count(*) FILTER (WHERE state = 'active') AS active,
       count(*) FILTER (WHERE state = 'idle') AS idle
FROM pg_stat_activity;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What is directUrl for, and why do migrations need it?">
            <p>
              <code>directUrl</code> is a second connection string that bypasses the pooler and talks to the
              database directly. Prisma uses the pooled <code>url</code> for normal queries and{' '}
              <code>directUrl</code> for schema work.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                A transaction mode pooler such as PgBouncer hands you a different backend connection for each
                transaction. Migrations need session level features like advisory locks and prepared
                statements that must stay on one connection
              </li>
              <li>
                Without <code>directUrl</code>, <code>migrate dev</code> and <code>migrate deploy</code>{' '}
                fail with confusing prepared statement errors, or they hang holding an advisory lock
              </li>
              <li>
                The advisory lock matters: it is what stops five app replicas running the same migration at
                the same time
              </li>
              <li>
                It is also used by <code>prisma db pull</code>, <code>prisma studio</code>, and creating the
                shadow database
              </li>
              <li>
                Both URLs point at the same database. Only the port and the host differ, for example 6543 for
                the pooler and 5432 for the primary
              </li>
            </ul>
            <CodeBlock
              title="Pooled URL for queries, direct URL for migrations"
              language="typescript"
              code={`datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")   // pooled, used by the app
  directUrl = env("DIRECT_URL")     // direct, used by migrate
}

// .env
// DATABASE_URL="postgresql://user:pass@pooler:6543/db?pgbouncer=true&connection_limit=1"
// DIRECT_URL="postgresql://user:pass@primary:5432/db"`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard
            level="Senior"
            question="How do you handle connection pooling and serverless with Prisma (PgBouncer, Accelerate, adapters)?"
          >
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Serverless platforms such as Vercel or Lambda scale out to many short lived instances. Many
                cold starts multiplied by open connections equals pool exhaustion
              </li>
              <li>
                Put an external pooler in front: PgBouncer, or the built in pooler from Neon or Supabase.
                Run it in transaction mode and add <code>?pgbouncer=true</code> so Prisma disables prepared
                statements
              </li>
              <li>
                Keep two URLs: the pooled <code>DATABASE_URL</code> for queries and{' '}
                <code>DIRECT_URL</code> for migrations
              </li>
              <li>
                <strong>Prisma Accelerate:</strong> a managed connection pool plus a global cache that sits in
                front of your database, which also removes the cold start connection problem at the edge
              </li>
              <li>
                <strong>Driver adapters</strong> in Prisma 5 and later let Prisma run on top of a normal
                JavaScript driver such as node-postgres or the Neon serverless driver, instead of only the
                built in engine binary. That is what makes edge runtimes possible
              </li>
              <li>
                Still keep a singleton client, and still set a low <code>connection_limit</code> per instance
                when a pooler is in play
              </li>
              <li>
                Transaction mode has a real cost: no session state, no LISTEN and NOTIFY, and interactive
                transactions hold a pooler slot for their whole duration, so keep them short
              </li>
            </ul>
            <CodeBlock
              title="Pooled plus direct URLs"
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
            <CodeBlock
              title="Driver adapter setup"
              language="typescript"
              code={`import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
export const prisma = new PrismaClient({ adapter });

// schema.prisma needs:
// generator client {
//   provider        = "prisma-client-js"
//   previewFeatures = ["driverAdapters"]
// }`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="What are relationMode, Accelerate, and Pulse at a high level?">
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>relationMode:</strong> decides who enforces relations. The default,{' '}
                <code>foreignKeys</code>, lets the database do it with real foreign key constraints. Setting
                it to <code>prisma</code> means Prisma emulates the checks in the client, which is needed on
                databases without foreign keys such as PlanetScale. On PostgreSQL you keep native foreign
                keys. The catch with the emulated mode is that it needs extra queries, it cannot protect
                against writes from outside Prisma, and you must add <code>@@index</code> on every foreign key
                yourself
              </li>
              <li>
                <strong>Accelerate:</strong> a hosted connection pool plus a query cache on an edge network.
                You add the <code>withAccelerate</code> extension and then set a cache strategy per query,
                with a time to live and a stale while revalidate window
              </li>
              <li>
                <strong>Pulse:</strong> change data capture as a managed service. It streams inserts, updates,
                and deletes from PostgreSQL logical replication into your application, which is the clean way
                to build live updates without polling
              </li>
              <li>
                All three are worth one clear sentence each in an interview. The useful signal is knowing when
                you would not use them: Accelerate adds a network hop and is wasted on a query that is already
                fast and never repeated, and Pulse needs logical replication enabled on the database
              </li>
            </ul>
            <CodeBlock
              title="Accelerate caching per query"
              language="typescript"
              code={`import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

const prisma = new PrismaClient().$extends(withAccelerate());

const posts = await prisma.post.findMany({
  where: { published: true },
  cacheStrategy: { ttl: 60, swr: 300 },
});`}
            />
            <CodeBlock
              title="relationMode set to prisma needs manual indexes"
              language="typescript"
              code={`datasource db {
  provider     = "postgresql"
  url          = env("DATABASE_URL")
  relationMode = "prisma"
}

model Post {
  id       Int  @id @default(autoincrement())
  authorId Int
  author   User @relation(fields: [authorId], references: [id])

  @@index([authorId]) // required: no foreign key means no automatic index
}`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

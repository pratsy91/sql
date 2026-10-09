import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 8: Patterns and Error Handling - Module 16 - Most Asked Interview Questions',
  description:
    'Most asked senior Prisma interview questions: the N+1 problem, soft deletes, error codes P2002 P2025 P2003 P2034, retrying unique conflicts, client extensions vs middleware, schema drift, Prisma vs TypeORM vs Drizzle, and production-safe design',
};

export default function MaiqM16L08PatternsAndErrors() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 8: Patterns and Error Handling</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          The questions that separate a senior answer from a junior one: what goes wrong at scale, which
          errors you must handle by name, and how you keep a large Prisma codebase safe.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="What is the N+1 problem, and how does Prisma load relations?">
            <p>
              N plus 1 means one query to fetch the parents, then one more query for each parent to fetch its
              children. Twenty users turns into twenty one round trips. In Prisma it happens when you loop
              over results and call the database inside the loop.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Using <code>include</code> or <code>select</code> lets Prisma load the whole tree in one
                planned set of queries instead
              </li>
              <li>
                Prisma does not do lazy loading. A relation is only fetched when you ask for it, so N plus 1
                is always something you wrote, never something that happens behind your back
              </li>
              <li>
                Prisma also batches <code>findUnique</code> calls made in the same tick into a single IN
                query, which quietly rescues a lot of GraphQL resolver code
              </li>
              <li>
                The way to catch it is to turn on query logging in development and count the statements for
                one request
              </li>
            </ul>
            <CodeBlock
              title="Bad vs good"
              language="typescript"
              code={`// BAD - one extra query per user
const users = await prisma.user.findMany();
for (const u of users) {
  u.posts = await prisma.post.findMany({ where: { authorId: u.id } });
}

// GOOD - a single query tree
const usersWithPosts = await prisma.user.findMany({
  include: { posts: { select: { id: true, title: true }, take: 5 } },
});

// GOOD - filter on relation existence instead of loading it
const authors = await prisma.user.findMany({
  where: { posts: { some: { published: true } } },
});`}
            />
            <CodeBlock
              title="Seeing the queries a request really makes"
              language="typescript"
              code={`const prisma = new PrismaClient({ log: [{ emit: 'event', level: 'query' }] });

let count = 0;
prisma.$on('query', () => count++);
// log count per request in development and watch for numbers that grow with the data`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How do you implement soft deletes with Prisma?">
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Add a nullable <code>deletedAt DateTime?</code> column and filter it out on every read
              </li>
              <li>
                Enforce the filter with a client extension so a developer cannot forget it. Relying on
                everyone remembering is how deleted rows leak into an API
              </li>
              <li>
                Unique constraints must account for soft deleted rows. Otherwise a user who deletes their
                account can never sign up with that email again. The fix is a partial unique index, written in
                raw SQL inside a migration
              </li>
              <li>
                Relations are the hard part. Filtering the parent does not filter nested children, so relation
                filters need the same condition
              </li>
              <li>
                Plan for real deletion too. A retention job that hard deletes rows after ninety days keeps the
                table from growing forever and keeps you compliant with delete my data requests
              </li>
            </ul>
            <CodeBlock
              title="Soft delete field and filtered query"
              language="typescript"
              code={`model User {
  id        String    @id @default(cuid())
  email     String
  deletedAt DateTime?

  @@index([deletedAt])
}

await prisma.user.update({
  where: { id },
  data: { deletedAt: new Date() },
});

await prisma.user.findMany({
  where: { deletedAt: null },
});

// nested relations need the filter too
await prisma.user.findMany({
  where: { deletedAt: null },
  include: { posts: { where: { deletedAt: null } } },
});`}
            />
            <CodeBlock
              title="Partial unique index in a SQL migration"
              language="sql"
              code={`CREATE UNIQUE INDEX user_email_active_uidx
ON "User" (email)
WHERE "deletedAt" IS NULL;`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="What are the common Prisma error codes you should know in interviews?"
          >
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>P2002</strong> — unique constraint violation. Map it to HTTP 409
              </li>
              <li>
                <strong>P2003</strong> — foreign key constraint failed
              </li>
              <li>
                <strong>P2025</strong> — the record to update or delete was not found. Map it to HTTP 404
              </li>
              <li>
                <strong>P2034</strong> — write conflict or deadlock. This one is a retry candidate
              </li>
              <li>
                <strong>P2024</strong> — timed out fetching a connection from the pool. A capacity problem,
                not a query problem
              </li>
              <li>
                <strong>P1001 and P1002</strong> — cannot reach the database, or the connection timed out
              </li>
              <li>
                They arrive as <code>Prisma.PrismaClientKnownRequestError</code>. Check{' '}
                <code>e.code</code>, and read <code>e.meta</code> for the details, such as which field
                conflicted
              </li>
            </ul>
            <CodeBlock
              title="Handle P2002 in an API route"
              language="typescript"
              code={`import { Prisma } from '@prisma/client';

try {
  await prisma.user.create({ data: { email } });
} catch (e) {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
    // e.meta?.target tells you which field conflicted
    return Response.json({ error: 'Email already registered' }, { status: 409 });
  }
  throw e;
}`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How do you handle P2025 and P2003 specifically?">
            <p>
              P2025 means the row you tried to change is not there. P2003 means you pointed at a parent row
              that does not exist, or you tried to delete a parent that still has children. Both are user
              errors, not server errors, so they should never become a 500.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>P2025 on update or delete:</strong> return 404. It also fires when a nested{' '}
                <code>connect</code> cannot find its target, which is a common surprise
              </li>
              <li>
                Two ways to avoid it entirely: use <code>updateMany</code> or <code>deleteMany</code>, which
                return a count of zero instead of throwing, or use <code>upsert</code> when create-if-missing
                is what you actually want
              </li>
              <li>
                A useful trick is to put the ownership check in the same where clause. Then a missing row and
                a row belonging to someone else both give the same 404, which leaks nothing
              </li>
              <li>
                <strong>P2003 on insert or update:</strong> the foreign key points at nothing. Return 400 with
                a message naming the field, since the client sent a bad id
              </li>
              <li>
                <strong>P2003 on delete:</strong> children still reference this row. Decide deliberately:
                block it and return 409, cascade it in the schema, or null the link with SetNull
              </li>
              <li>
                Do all of this in one shared error mapper rather than repeating try and catch in every route
              </li>
            </ul>
            <CodeBlock
              title="Ownership check and 404 in one query"
              language="typescript"
              code={`// zero rows means either missing or not yours - same answer either way
const result = await prisma.post.updateMany({
  where: { id: postId, authorId: currentUserId, deletedAt: null },
  data: { title },
});

if (result.count === 0) {
  return Response.json({ error: 'Post not found' }, { status: 404 });
}`}
            />
            <CodeBlock
              title="One shared error mapper"
              language="typescript"
              code={`import { Prisma } from '@prisma/client';

export function toHttpError(e: unknown) {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    switch (e.code) {
      case 'P2002':
        return { status: 409, error: 'Already exists' };
      case 'P2025':
        return { status: 404, error: 'Not found' };
      case 'P2003':
        return { status: 400, error: 'Related record is missing or still in use' };
      case 'P2024':
        return { status: 503, error: 'Database busy, please retry' };
      default:
        return { status: 500, error: 'Database error' };
    }
  }
  return { status: 500, error: 'Unexpected error' };
}`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How do you retry safely on a unique conflict or a write conflict?">
            <p>
              Some database errors are worth retrying and some are not. The rule is simple: retry when the
              same call could plausibly succeed a second time, and do not retry when it never will.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Worth retrying:</strong> P2034 write conflict or deadlock, and P2024 pool timeout.
                Both are temporary contention
              </li>
              <li>
                <strong>Not worth retrying:</strong> a plain P2002 where the user really did pick a taken
                email. Retrying just fails again
              </li>
              <li>
                <strong>The middle case:</strong> a P2002 from a race where two requests both checked then
                both inserted. The right fix is not a retry, it is an <code>upsert</code> or a{' '}
                <code>createMany</code> with <code>skipDuplicates</code>, so the database resolves the race in
                one statement
              </li>
              <li>
                If you must retry, use exponential backoff with jitter, cap the attempts at around three, and
                make sure the operation is idempotent or carries an idempotency key. Blind retries on a
                payment are how customers get charged twice
              </li>
              <li>
                Never wrap a retry around an interactive transaction that also calls an external API. The
                external side effect will happen more than once
              </li>
              <li>
                For counters, avoid the race entirely: <code>{'{ increment: 1 }'}</code> updates in place, so
                there is no read then write gap to lose
              </li>
            </ul>
            <CodeBlock
              title="Retry only the transient codes"
              language="typescript"
              code={`import { Prisma } from '@prisma/client';

const RETRYABLE = new Set(['P2034', 'P2024']);

export async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      const transient =
        e instanceof Prisma.PrismaClientKnownRequestError && RETRYABLE.has(e.code);
      if (!transient || i === attempts - 1) throw e;

      const backoff = 50 * Math.pow(2, i) + Math.random() * 50;
      await new Promise((r) => setTimeout(r, backoff));
    }
  }
  throw new Error('unreachable');
}`}
            />
            <CodeBlock
              title="Design the race away instead of retrying it"
              language="typescript"
              code={`// Instead of: check then insert, then catch P2002 and retry
const tag = await prisma.tag.upsert({
  where: { name },
  create: { name },
  update: {},
});

// Counters: no read then write gap
await prisma.post.update({
  where: { id },
  data: { views: { increment: 1 } },
});`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="Middleware vs client extensions — what changed in modern Prisma?">
            <p>
              The old <code>$use</code> middleware is deprecated and replaced by client extensions, written
              with <code>$extends</code>. Extensions cover query hooks, custom model methods, computed
              fields, and result shaping, and they compose cleanly.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Middleware was a single global chain with weak typing. Every call went through it, and a
                mistake there affected the whole application
              </li>
              <li>
                Extensions are scoped and fully typed. A <code>model</code> extension adds real methods that
                autocomplete, and a <code>result</code> extension declares the fields it needs
              </li>
              <li>
                The important behavioural difference: <code>$extends</code> returns a new client rather than
                mutating the existing one, so you must use the returned value. It also means you can build a
                per request client, which is how row level multi tenancy is usually done
              </li>
              <li>
                The four extension components are <code>query</code>, <code>model</code>,{' '}
                <code>result</code>, and <code>client</code>
              </li>
            </ul>
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
            <CodeBlock
              title="Timing every query with a query extension"
              language="typescript"
              code={`const timed = prisma.$extends({
  query: {
    async $allOperations({ model, operation, args, query }) {
      const start = Date.now();
      const result = await query(args);
      const ms = Date.now() - start;
      if (ms > 200) console.warn('slow_prisma_call', { model, operation, ms });
      return result;
    },
  },
});`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="How do you keep the Prisma schema and the database in sync?">
            <p>
              Drift is when the real database no longer matches your migration history. It happens when
              someone runs SQL by hand, when <code>db push</code> is mixed with Migrate, or when two branches
              create migrations at the same time.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Detect it:</strong> <code>prisma migrate status</code> tells you if migrations are
                missing or if the database has changed underneath. Run it in CI against staging so drift is
                caught before release day
              </li>
              <li>
                <strong>Compare precisely:</strong> <code>prisma migrate diff</code> prints the exact SQL gap
                between two states, for example between the migration folder and a live database. This is the
                tool that tells you what someone changed by hand
              </li>
              <li>
                <strong>Adopt an existing database:</strong> <code>prisma db pull</code> rewrites{' '}
                <code>schema.prisma</code> from the live database. Pair it with a baseline migration so Prisma
                stops trying to recreate tables that already exist
              </li>
              <li>
                <strong>Branch conflicts:</strong> two feature branches each add a migration, and merged
                together the order is wrong. Rebase and regenerate the migration rather than hand editing
                timestamps
              </li>
              <li>
                <strong>Prevent it:</strong> take DDL rights away from the application user, so only the
                migration job can change the schema. Make <code>migrate deploy</code> the only path to
                production, and ban <code>db push</code> outside local work
              </li>
              <li>
                <strong>The generated client counts too:</strong> if <code>prisma generate</code> did not run
                after a schema change, the types describe a database that no longer exists. Make generate part
                of the build, not a manual step
              </li>
            </ul>
            <CodeBlock
              title="Detecting drift"
              language="bash"
              code={`npx prisma migrate status

# exact SQL difference between migrations on disk and the live database
npx prisma migrate diff \\
  --from-migrations ./prisma/migrations \\
  --to-url "$DATABASE_URL" \\
  --script`}
            />
            <CodeBlock
              title="Baselining a database that already exists"
              language="bash"
              code={`npx prisma db pull
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma \\
  --script > prisma/migrations/0_init/migration.sql
npx prisma migrate resolve --applied 0_init`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="Prisma vs TypeORM vs Drizzle — what tradeoffs do interviewers expect?">
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Prisma:</strong> the best developer experience and genuinely generated types.
                Migrations are opinionated and safe. The costs are that complex SQL still needs the raw
                escape hatch, and the generate step must run everywhere the code is built
              </li>
              <li>
                <strong>TypeORM:</strong> decorators on entity classes, with both Active Record and Data
                Mapper styles. Flexible, but the typing is weaker and there are more sharp edges. Still very
                common in existing NestJS codebases
              </li>
              <li>
                <strong>Drizzle:</strong> the schema is TypeScript and the queries look like SQL. Very light,
                no engine binary, and it runs anywhere. You give up the batteries included tooling such as
                Studio and the polished migration workflow
              </li>
              <li>
                Choose Prisma for fast typed CRUD on a product team, Drizzle when you want SQL transparency
                and the smallest possible runtime, and TypeORM mainly when you are already in a TypeORM
                codebase
              </li>
              <li>
                The answer interviewers actually want: name the tradeoff you would accept, not the tool you
                like. Prisma buys speed and safety at the cost of some control over the generated SQL
              </li>
            </ul>
          </InterviewQACard>

          <InterviewQACard
            level="Senior"
            question="How would you design production-safe Prisma usage for a high-traffic Nest or Next API?"
          >
            <ul className="list-disc pl-6 space-y-1">
              <li>One singleton client, a pooled URL for queries, and a direct URL for migrations</li>
              <li>
                Explicit <code>select</code> on every public endpoint, and never an unbounded{' '}
                <code>include</code>. Always a <code>take</code> on list queries
              </li>
              <li>
                Transactions only where an invariant spans two writes, kept short, with retries on{' '}
                <code>P2034</code>
              </li>
              <li>
                Client extensions to enforce cross cutting rules such as soft delete filtering and tenant
                scoping, so correctness does not depend on every developer remembering
              </li>
              <li>
                <code>migrate deploy</code> as a separate release step in CI before traffic moves, and never{' '}
                <code>db push</code> in production
              </li>
              <li>
                One shared error mapper so P2002, P2025, and P2003 become 409, 404, and 400 instead of 500s
              </li>
              <li>
                Monitoring on pool wait time, query latency percentiles, and Prisma error rates by code, which
                is covered in Module 17
              </li>
              <li>
                Hand tuned SQL through TypedSQL or <code>$queryRaw</code> for the handful of hot paths that
                need it, with the indexes to match
              </li>
            </ul>
            <CodeBlock
              title="Tenant scoped extension sketch"
              language="typescript"
              code={`function forTenant(tenantId: string) {
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, args, query }) {
          if (model !== 'AuditLog' && args.where) {
            args.where = { ...args.where, tenantId };
          }
          return query(args);
        },
      },
    },
  });
}

// one scoped client per request
const db = forTenant(req.tenantId);
await db.invoice.findMany({ take: 50 });`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 4: Constraints in Production - Module 4 - Most Asked Interview Questions',
  description:
    'Senior interview questions on constraints in production: adding constraints to big tables with no downtime, partial unique indexes for soft deletes, unique on lower(email), unique violation error codes, concurrency with upserts, and advanced uniqueness in Prisma.',
};

export default function M4L4ConstraintsInProduction() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 4: Constraints in Production</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Writing a constraint on an empty table is easy. The interview question is how you add one to a
          table with 200 million rows, while users are still writing to it.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="How do you add a constraint to an existing table without long downtime?">
            <ul className="list-disc pl-6 space-y-1">
              <li>For CHECK/FK: <code>NOT VALID</code> then <code>VALIDATE CONSTRAINT</code> — the quick step takes a brief strong lock, and the slow scan runs under a weaker lock that still allows reads and writes</li>
              <li>For UNIQUE: build the index with <code>CREATE UNIQUE INDEX CONCURRENTLY</code> first, then attach it with <code>ADD CONSTRAINT ... USING INDEX</code>, which is nearly instant</li>
              <li>Clean bad data first; monitor lock waits</li>
              <li>Always set a short <code>lock_timeout</code> so a blocked <code>ALTER TABLE</code> does not queue up behind a long query and freeze every other connection</li>
              <li><code>CONCURRENTLY</code> cannot run inside a transaction block, and a failed run leaves an invalid index you must drop and retry</li>
            </ul>
            <CodeBlock
              title="NOT VALID then VALIDATE"
              language="sql"
              code={`ALTER TABLE orders
  ADD CONSTRAINT orders_total_chk CHECK (total >= 0) NOT VALID;

ALTER TABLE orders VALIDATE CONSTRAINT orders_total_chk;`}
            />
            <CodeBlock
              title="Safe UNIQUE on a live table"
              language="sql"
              code={`-- 1. Find duplicates and fix them first
SELECT email, count(*)
FROM users
GROUP BY email
HAVING count(*) > 1;

-- 2. Build the index without blocking writes (cannot be inside BEGIN/COMMIT)
CREATE UNIQUE INDEX CONCURRENTLY users_email_uidx ON users (email);

-- 3. If it failed, the index is left INVALID: drop and retry
SELECT indexrelid::regclass FROM pg_index WHERE NOT indisvalid;
DROP INDEX CONCURRENTLY IF EXISTS users_email_uidx;

-- 4. Promote the finished index to a real constraint
SET lock_timeout = '3s';
ALTER TABLE users
  ADD CONSTRAINT users_email_key UNIQUE USING INDEX users_email_uidx;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How do you enforce unique emails that ignore letter case?">
            <p>
              A plain <code>UNIQUE (email)</code> treats <code>Ada@Example.com</code> and
              <code>ada@example.com</code> as two different users, because text comparison is case sensitive.
              Put the lowercase form in the index instead.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>A <strong>unique index on an expression</strong> is the standard fix: <code>ON users (lower(email))</code></li>
              <li>The function inside must be <code>IMMUTABLE</code>. <code>lower()</code> is, so this is allowed</li>
              <li>Queries must use the same expression to hit the index. Search with <code>WHERE lower(email) = lower($1)</code></li>
              <li>An alternative is the <code>citext</code> data type, which compares case insensitively everywhere. It is simpler for developers but less portable and weaker for indexing choices</li>
              <li>The cleanest option for a new system is to normalise to lowercase in the application before storing, and keep the unique index as the safety net</li>
              <li>This cannot be expressed in the Prisma schema DSL, so it goes in a hand-written migration</li>
            </ul>
            <CodeBlock
              title="Case-insensitive unique email"
              language="sql"
              code={`CREATE UNIQUE INDEX users_lower_email_uidx ON users (lower(email));

-- Uses the index
SELECT id FROM users WHERE lower(email) = lower('Ada@Example.com');

-- Does NOT use it: the expression must match
SELECT id FROM users WHERE email = 'Ada@Example.com';

-- Alternative: citext
CREATE EXTENSION IF NOT EXISTS citext;
CREATE TABLE accounts (
  id    BIGSERIAL PRIMARY KEY,
  email CITEXT NOT NULL UNIQUE
);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What error does a unique violation raise, and how should code handle it?">
            <p>
              PostgreSQL raises SQLSTATE <code>23505</code>, called <code>unique_violation</code>. Catch that
              specific code and turn it into a friendly message, such as “that email is already registered.”
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>The whole <code>23xxx</code> family is integrity errors: <code>23502</code> not null, <code>23503</code> foreign key, <code>23505</code> unique, <code>23514</code> check, <code>23P01</code> exclusion</li>
              <li>Prisma wraps unique violations as error code <code>P2002</code> and tells you which fields collided; <code>P2003</code> is a foreign key failure and <code>P2025</code> is “record not found”</li>
              <li>Never match on the error message text — it changes between versions and locales. Match on the code</li>
              <li>Checking “does this email exist?” before inserting does not remove the race. Two requests can both pass the check. Let the constraint fail and handle the error, or use <code>ON CONFLICT</code></li>
              <li>The failed statement aborts the transaction, so plan a <code>SAVEPOINT</code> or a retry if you want to continue</li>
            </ul>
            <CodeBlock
              title="Handle P2002 in Prisma"
              language="typescript"
              code={`import { Prisma } from '@prisma/client';

try {
  await prisma.user.create({ data: { email } });
} catch (err) {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    // err.meta.target lists the conflicting field(s)
    return { ok: false, message: 'That email is already registered.' };
  }
  throw err;
}`}
            />
            <CodeBlock
              title="Or avoid the error entirely"
              language="sql"
              code={`INSERT INTO users (email, name)
VALUES ('ada@example.com', 'Ada')
ON CONFLICT (email) DO NOTHING
RETURNING id;   -- returns no row when it was already there`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="How do you keep emails unique when you use soft deletes?">
            <p>
              With soft deletes you keep the row and set <code>deleted_at</code>. A normal unique index then
              blocks a new signup with the same email as a deleted account. A <strong>partial</strong> unique
              index fixes this: it only indexes the rows you care about.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Add a <code>WHERE</code> clause so deleted rows are simply not in the index</li>
              <li>The same pattern encodes rules like “one active subscription per user” or “one default address per customer”</li>
              <li>The condition must appear in your queries too, or the planner will not use the index</li>
              <li>Careful trade-off: you can now have many deleted rows with that email, so reporting queries must filter on <code>deleted_at</code> as well</li>
              <li>An alternative used by some teams is to move deleted rows to an archive table, which keeps the live table simple</li>
            </ul>
            <CodeBlock
              title="Partial unique index for soft deletes"
              language="sql"
              code={`-- Only live rows must have a unique email
CREATE UNIQUE INDEX users_active_email_uidx
  ON users (email)
  WHERE deleted_at IS NULL;

-- One active subscription per user
CREATE UNIQUE INDEX one_active_sub_per_user
  ON subscriptions (user_id)
  WHERE status = 'active';

-- Both combined: case-insensitive and soft-delete aware
CREATE UNIQUE INDEX users_live_lower_email_uidx
  ON users (lower(email))
  WHERE deleted_at IS NULL;`}
            />
            <p>
              Note: a partial unique index cannot be used as an <code>ON CONFLICT (email)</code> target unless
              you repeat the same <code>WHERE</code> clause in the statement.
            </p>
            <CodeBlock
              title="Upsert against a partial index"
              language="sql"
              code={`INSERT INTO users (email, name)
VALUES ('ada@example.com', 'Ada')
ON CONFLICT (email) WHERE deleted_at IS NULL
DO UPDATE SET name = EXCLUDED.name;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="How do constraints interact with concurrency and upserts?">
            <ul className="list-disc pl-6 space-y-1">
              <li>Unique violations under concurrency are expected — handle with retry or <code>ON CONFLICT</code></li>
              <li>FK checks can block on parent row locks</li>
              <li>Partial unique indexes encode business rules (“one active subscription per user”)</li>
              <li>Two concurrent <code>ON CONFLICT DO UPDATE</code> statements on the same key can still deadlock if they touch keys in different orders — sort your batch by key before writing</li>
              <li><code>ON CONFLICT DO UPDATE</code> takes a row lock, so hot keys serialise. That is correct, but it is also your throughput ceiling</li>
            </ul>
            <CodeBlock
              title="Partial unique index"
              language="sql"
              code={`CREATE UNIQUE INDEX one_active_sub_per_user
  ON subscriptions (user_id)
  WHERE status = 'active';`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="What constraint design mistakes do interviewers listen for?">
            <ul className="list-disc pl-6 space-y-1">
              <li>Relying only on the application for integrity (race conditions, other writers)</li>
              <li><code>ON DELETE CASCADE</code> everywhere without thinking about blast radius</li>
              <li>Missing indexes on FK columns → slow deletes and joins</li>
              <li>CHECK constraints that call non-immutable functions or depend on other tables (not allowed / fragile)</li>
              <li>Composite keys without documenting access patterns</li>
              <li>Unnamed constraints, so the auto-generated name differs between environments and your migration or error handling breaks</li>
              <li>Running a plain <code>ALTER TABLE ADD CONSTRAINT</code> on a large live table with no <code>lock_timeout</code> and no <code>NOT VALID</code> step</li>
              <li>Constraints that encode a policy which changes monthly, so every business tweak needs a migration</li>
            </ul>
          </InterviewQACard>

          <InterviewQACard level="Senior" question="How do you express advanced uniqueness in Prisma when the schema DSL is limited?">
            <ul className="list-disc pl-6 space-y-1">
              <li>Use <code>@@unique</code>, <code>@@id</code>, and relation <code>onDelete</code>/<code>onUpdate</code> first</li>
              <li>Partial unique indexes, expression indexes, CHECK constraints, and EXCLUDE often need custom SQL in migrations</li>
              <li>Keep Prisma schema in sync with comments / ignored maps so <code>db pull</code> does not surprise you</li>
              <li>Workflow: run <code>prisma migrate dev --create-only</code>, hand-edit the generated SQL file, then apply it. The change is then versioned like any other migration</li>
              <li>Because Prisma does not know about the extra index, <code>prisma migrate diff</code> may keep suggesting to drop it. Guard the SQL with <code>IF NOT EXISTS</code> and document it</li>
            </ul>
            <CodeBlock
              title="Custom partial unique in migration"
              language="sql"
              code={`-- prisma/migrations/.../migration.sql
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS users_email_active_uidx
  ON users (email)
  WHERE deleted_at IS NULL;`}
            />
            <CodeBlock
              title="What the DSL can express"
              language="typescript"
              code={`model Subscription {
  id     Int    @id @default(autoincrement())
  userId Int
  status String

  @@unique([userId, status])   // close, but not "only one ACTIVE per user"
  @@index([userId])
}`}
            />
            <p>
              When the rule cannot be expressed, keep the raw SQL migration as the source of truth and use
              <code>prisma.$queryRawUnsafe(&apos;SELECT ...&apos;)</code> only for reads that need the same expression.
            </p>
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

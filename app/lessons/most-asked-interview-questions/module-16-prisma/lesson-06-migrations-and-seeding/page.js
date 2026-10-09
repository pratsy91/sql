import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 6: Migrations and Seeding - Module 16 - Most Asked Interview Questions',
  description:
    'Most asked Prisma Migrate interview questions: migrate dev vs migrate deploy vs db push, seeding, the _prisma_migrations table, editing generated migration SQL, the shadow database, and resolving a failed migration',
};

export default function MaiqM16L06MigrationsAndSeeding() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 6: Migrations and Seeding</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          How schema changes travel from your laptop to production, what Prisma records along the way, and
          what to do when a migration gets stuck.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard
            level="Junior"
            question="migrate dev vs migrate deploy vs db push — when do you use each?"
          >
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>
                  <code>prisma migrate dev</code>:
                </strong>{' '}
                local development only. It compares your schema to the database, writes a new migration SQL
                file, applies it, and regenerates the client. It may reset the database, so it must never
                touch production
              </li>
              <li>
                <strong>
                  <code>prisma migrate deploy</code>:
                </strong>{' '}
                CI and production. It applies the pending migration files in{' '}
                <code>prisma/migrations</code> and nothing else. It never invents a migration and never
                resets anything
              </li>
              <li>
                <strong>
                  <code>prisma db push</code>:
                </strong>{' '}
                pushes the schema straight into the database with no migration history. Fine for a prototype
                or a throwaway branch, risky on any shared or production database because there is no record
                of what changed
              </li>
              <li>
                Pick one style per project. Mixing <code>db push</code> and Migrate on the same database is
                how schemas drift out of sync
              </li>
            </ul>
            <CodeBlock
              title="CI/CD pattern"
              language="bash"
              code={`# Local
npx prisma migrate dev --name add_user_role

# Pipeline / production release
npx prisma migrate deploy
npx prisma generate

# See what state the database is in without changing anything
npx prisma migrate status`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="How do you seed a Prisma database?">
            <p>
              Seeding fills a fresh database with the rows an app needs to work: an admin user, lookup tables,
              plan names, sample data for local development.
            </p>
            <CodeBlock
              title="prisma/seed.ts plus package.json"
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
              <li>
                Use <code>upsert</code> so the seed is idempotent and running it twice does not create
                duplicates or crash
              </li>
              <li>
                <code>migrate dev</code> and <code>migrate reset</code> run the seed automatically when it is
                configured in package.json
              </li>
              <li>
                Keep reference data, which production needs, separate from demo data, which it must not have.
                A common split is a seed script plus a separate fixtures script
              </li>
              <li>
                Reference data that must exist everywhere is often better written as SQL inside a migration,
                so it ships with the schema change that needs it
              </li>
            </ul>
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="What is the _prisma_migrations table?">
            <p>
              It is the bookkeeping table Prisma creates inside your database to record which migrations have
              already run. It is the single source of truth for what state the database is in.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                One row per migration folder, with the migration name, a checksum of the SQL,{' '}
                <code>started_at</code>, <code>finished_at</code>, and <code>applied_steps_count</code>
              </li>
              <li>
                <code>migrate deploy</code> reads it, compares against the folders on disk, and applies only
                the ones missing
              </li>
              <li>
                A row where <code>finished_at</code> is null means a migration started and never completed.
                That is the failed state that blocks every later deploy
              </li>
              <li>
                <code>rolled_back_at</code> marks a migration you told Prisma to treat as undone
              </li>
              <li>
                The checksum is why editing an already applied migration file breaks things. The file no
                longer matches the recorded hash and Prisma refuses to continue
              </li>
              <li>
                Never edit this table by hand in production. Use <code>prisma migrate resolve</code>, which
                exists exactly for that job
              </li>
            </ul>
            <CodeBlock
              title="Inspecting migration state"
              language="sql"
              code={`SELECT migration_name,
       started_at,
       finished_at,
       rolled_back_at,
       applied_steps_count
FROM _prisma_migrations
ORDER BY started_at DESC
LIMIT 10;

-- the dangerous one: started but never finished
SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NULL;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Can you edit a generated migration SQL file?">
            <p>
              Yes, before it has been applied anywhere. After it has run on a shared database, treat it as
              frozen and write a new migration instead.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Editing is not just allowed, it is sometimes required. Prisma generates a plain{' '}
                <code>migration.sql</code> file precisely so you can adjust it
              </li>
              <li>
                Use <code>prisma migrate dev --create-only</code> to generate the file without applying it,
                edit it, then run <code>migrate dev</code> to apply
              </li>
              <li>
                Common reasons to edit: add a data backfill step, add CONCURRENTLY to an index build, rename a
                column instead of letting Prisma drop and recreate it, add a CHECK constraint or a partial
                unique index that the schema language cannot express
              </li>
              <li>
                The classic case is a rename. Prisma sees a dropped column and a new column, and it will
                destroy your data. Replace those two statements with a single RENAME
              </li>
              <li>
                Once applied, the checksum is recorded. Editing the file afterwards makes Prisma report that
                the migration was modified, and the fix is either a new migration or{' '}
                <code>migrate resolve</code>
              </li>
            </ul>
            <CodeBlock
              title="Create only, then fix the rename by hand"
              language="bash"
              code={`npx prisma migrate dev --create-only --name rename_username
# edit prisma/migrations/xxxx_rename_username/migration.sql
npx prisma migrate dev`}
            />
            <CodeBlock
              title="What Prisma wrote vs what you want"
              language="sql"
              code={`-- generated: destroys data
ALTER TABLE "User" DROP COLUMN "username";
ALTER TABLE "User" ADD COLUMN "handle" TEXT;

-- edited: keeps data
ALTER TABLE "User" RENAME COLUMN "username" TO "handle";`}
            />
            <CodeBlock
              title="Adding an index without locking writes"
              language="sql"
              code={`-- Prisma generates this, which blocks writes on a big table
-- CREATE INDEX "Post_authorId_idx" ON "Post"("authorId");

CREATE INDEX CONCURRENTLY "Post_authorId_idx" ON "Post"("authorId");
-- note: CONCURRENTLY cannot run inside a transaction block`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What is the shadow database for?">
            <p>
              The shadow database is a second, temporary database that <code>migrate dev</code> creates,
              migrates from scratch, inspects, and then throws away. It is how Prisma works out what SQL your
              new migration needs.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Prisma replays every existing migration into the empty shadow database. That gives it a clean
                picture of what the schema should look like
              </li>
              <li>
                It then compares that picture with your edited <code>schema.prisma</code>, and the difference
                becomes the new migration SQL
              </li>
              <li>
                It also detects drift. If your real development database does not match the migration history,
                for example because someone ran SQL by hand, Prisma can tell you
              </li>
              <li>
                It is a development only concept. <code>migrate deploy</code> never creates one, which is why
                production needs no extra permissions
              </li>
              <li>
                The user in your development connection string therefore needs permission to create and drop
                databases. On hosted providers that is often blocked, and the fix is to set{' '}
                <code>shadowDatabaseUrl</code> to a second database you created yourself
              </li>
              <li>
                Cloud databases behind a connection pooler also need <code>directUrl</code>, because migration
                work cannot run through a transaction mode pooler
              </li>
            </ul>
            <CodeBlock
              title="Pointing Prisma at a shadow database you control"
              language="typescript"
              code={`datasource db {
  provider          = "postgresql"
  url               = env("DATABASE_URL")
  directUrl         = env("DIRECT_URL")
  shadowDatabaseUrl = env("SHADOW_DATABASE_URL")
}

// .env
// DATABASE_URL="postgresql://user:pass@host:5432/app"
// SHADOW_DATABASE_URL="postgresql://user:pass@host:5432/app_shadow"`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="How do you resolve a failed migration in production?">
            <p>
              A failed migration leaves a row in <code>_prisma_migrations</code> with no finish time. Every
              later <code>migrate deploy</code> then refuses to run until you tell Prisma how that migration
              ended. PostgreSQL runs each migration in a transaction, so partial DDL is usually already rolled
              back, but Prisma still needs you to make the call.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Step one, look:</strong> run <code>prisma migrate status</code> and read the database
                logs to find out why it failed. Usually it is a constraint that existing data violates, a
                lock timeout, or a statement timeout on a large table
              </li>
              <li>
                <strong>Step two, decide the truth:</strong> did the SQL actually change anything? Check the
                tables directly. Do not guess
              </li>
              <li>
                <strong>If nothing was applied:</strong> mark it rolled back with{' '}
                <code>migrate resolve --rolled-back</code>, fix the SQL in the migration file, and deploy
                again
              </li>
              <li>
                <strong>If it really did complete, or you finished it by hand:</strong> mark it applied with{' '}
                <code>migrate resolve --applied</code> so Prisma skips it and moves on
              </li>
              <li>
                <strong>Never</strong> run <code>migrate dev</code> or <code>migrate reset</code> against
                production. Reset drops the data
              </li>
              <li>
                <strong>Prevention:</strong> test every migration against a restored copy of production, set a
                <code>lock_timeout</code> and <code>statement_timeout</code> so a blocked DDL fails fast
                rather than freezing the table, split risky changes into expand and contract steps, and run
                migrations as a separate release step before new code goes live
              </li>
              <li>
                Expand and contract in practice: add the new nullable column, deploy code that writes both,
                backfill in batches, then in a later release make it required and drop the old column. Each
                step is safe to roll back on its own
              </li>
            </ul>
            <CodeBlock
              title="Recovering a stuck deploy"
              language="bash"
              code={`npx prisma migrate status

# nothing was applied - clear it and retry with fixed SQL
npx prisma migrate resolve --rolled-back 20260401120000_add_unique_email

# it did complete, or you applied the SQL manually
npx prisma migrate resolve --applied 20260401120000_add_unique_email

npx prisma migrate deploy`}
            />
            <CodeBlock
              title="Guards that stop a migration freezing a table"
              language="sql"
              code={`SET lock_timeout = '3s';
SET statement_timeout = '60s';

-- fails fast instead of queueing behind a long running query
ALTER TABLE "User" ADD COLUMN "phone" TEXT;`}
            />
            <CodeBlock
              title="Backfilling in batches instead of one giant UPDATE"
              language="sql"
              code={`UPDATE "User"
SET handle = lower(email)
WHERE handle IS NULL
  AND id IN (
    SELECT id FROM "User" WHERE handle IS NULL ORDER BY id LIMIT 5000
  );
-- repeat until zero rows are affected`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

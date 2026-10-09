import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';
import InterviewQACard from '../../../components/InterviewQACard';

export const metadata = {
  title: 'Module 1: Foundations - Output-Based Interview Questions',
  description: 'Predict output of session/catalog SQL and spot wrong Prisma/connection code',
};

export default function OutputModule01() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Module 1: Foundations &amp; Setup</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Output-based: given SQL/Prisma, what prints, what errors, what is the fix. Junior → Senior.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard
            level="Junior"
            question="What does this print, and can it ever return two different users in one session?"
          >
            <CodeBlock
              title="Given"
              language="sql"
              code={`SELECT current_user, session_user;`}
            />
            <p>
              <strong>Output:</strong> one row with two names. They are usually the same. They differ after{' '}
              <code>SET ROLE</code> — <code>current_user</code> becomes the role; <code>session_user</code> stays
              the login role.
            </p>
          </InterviewQACard>

          <InterviewQACard
            level="Junior"
            question="This Prisma snippet is used to 'list tables'. What is wrong, and what is the right approach?"
          >
            <CodeBlock
              title="Given (wrong)"
              language="typescript"
              code={`const tables = await prisma.user.findMany();`}
            />
            <p>
              <strong>Output:</strong> user rows, not table names. Prisma Client maps models, not the catalog.
            </p>
            <CodeBlock
              title="Correct"
              language="typescript"
              code={`const tables = await prisma.$queryRawUnsafe(
  'SELECT table_name FROM information_schema.tables WHERE table_schema = $1',
  'public'
);`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard
            level="Mid"
            question="Given search_path = public, pg_temp — what table does SELECT * FROM t hit if both pg_temp.t and public.t exist?"
          >
            <p>
              <strong>Output:</strong> temp table <code>pg_temp.t</code> (temp schemas are searched first). A common
              surprise in interviews.
            </p>
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="What does SELECT datname FROM pg_database WHERE datistemplate return on a default cluster?"
          >
            <p>
              Template databases (typically <code>template0</code>, <code>template1</code>), not your app DB. App DBs
              have <code>datistemplate = false</code>.
            </p>
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard
            level="Senior"
            question="This connection string is used with PgBouncer transaction pooling. What breaks?"
          >
            <CodeBlock
              title="Given"
              language="text"
              code={`postgresql://app:pw@localhost:6432/appdb`}
            />
            <p>
              Prepared statements / Prisma&apos;s default session features can fail. Fix: port to the pooler with{' '}
              <code>pgbouncer=true</code> on a <strong>transaction</strong> URL, and a direct URL for migrations.
            </p>
            <CodeBlock
              title="Correct (Prisma)"
              language="text"
              code={`DATABASE_URL="postgresql://app:pw@localhost:6432/appdb?pgbouncer=true"
DIRECT_URL="postgresql://app:pw@localhost:5432/appdb"`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

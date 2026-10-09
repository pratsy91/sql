import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';
import InterviewQACard from '../../../components/InterviewQACard';

export const metadata = {
  title: 'Module 11: Security - Most Asked Query Interview Questions',
  description: 'Most asked GRANT, RLS policy, and parameterized-query interview SQL with Prisma',
};

export default function Module11SecurityQueries() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Module 11: Security</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Most asked security SQL: GRANT, RLS, roles, parameterized queries.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="Write GRANT / REVOKE for a least-privilege app role.">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`CREATE ROLE app_user LOGIN PASSWORD 'change-me';
GRANT CONNECT ON DATABASE appdb TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
REVOKE ALL ON SCHEMA public FROM PUBLIC;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="Write current_user vs session_user.">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`SELECT current_user, session_user;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="Write RLS policies so a tenant only sees their rows.">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY orders_tenant ON orders
  USING (tenant_id = current_setting('app.tenant_id')::bigint)
  WITH CHECK (tenant_id = current_setting('app.tenant_id')::bigint);

SET app.tenant_id = '9';
SELECT * FROM orders;`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="Show a safe parameterized lookup vs unsafe string concat (do not concatenate user input)."
          >
            <CodeBlock
              title="Prisma (safe)"
              language="typescript"
              code={`const email = req.query.email;
const user = await prisma.user.findUnique({ where: { email } });

const rows = await prisma.$queryRawUnsafe(
  'SELECT id, email FROM users WHERE email = $1',
  email
);`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="Write column-level GRANT so analysts cannot see email.">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`GRANT SELECT (id, created_at, status) ON users TO analyst;
REVOKE SELECT (email) ON users FROM analyst;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="Write FORCE ROW LEVEL SECURITY for table owners.">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`ALTER TABLE orders FORCE ROW LEVEL SECURITY;`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

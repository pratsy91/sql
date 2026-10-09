import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';
import InterviewQACard from '../../../components/InterviewQACard';

export const metadata = {
  title: 'Module 11: Security - Output-Based Interview Questions',
  description: 'Predict GRANT/RLS filtered rows, injection mistakes, Prisma $queryRawUnsafe outcomes',
};

export default function OutputModule11() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Module 11: Security</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          What rows come back under RLS? What error on GRANT? What does unsafe Prisma do?
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard
            level="Junior"
            question="Role app_user has SELECT on users. It runs DELETE FROM users. Output?"
          >
            <p>
              Permission denied. GRANT SELECT does not include DELETE. Least privilege interviews expect that split.
            </p>
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard
            level="Mid"
            question="RLS policy USING (tenant_id = 9). Table has 10 rows, 3 with tenant 9. SET ROLE to non-owner. SELECT COUNT(*)?"
          >
            <p>
              <strong>3</strong> (policy filters). Table owner bypasses RLS unless <code>FORCE ROW LEVEL SECURITY</code>.
            </p>
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="This Prisma is given email from the query string. What is wrong vs findUnique?"
          >
            <CodeBlock
              title="Given (wrong)"
              language="typescript"
              code={`const email = req.query.email;
await prisma.$queryRawUnsafe(
  'SELECT * FROM users WHERE email = ''' + email + ''''
);`}
            />
            <p>
              Output with <code>email = a' OR '1'='1</code>: extra rows / dump. That is injection.
            </p>
            <CodeBlock
              title="Correct"
              language="typescript"
              code={`await prisma.user.findUnique({ where: { email } });
await prisma.$queryRawUnsafe('SELECT * FROM users WHERE email = $1', email);`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard
            level="Senior"
            question="Policy WITH CHECK (tenant_id = current_setting('app.tenant_id')::bigint). INSERT with another tenant_id. Output?"
          >
            <p>
              RLS violation error. USING filters reads; WITH CHECK blocks writes that would not be visible / allowed.
            </p>
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: "Lesson 2: Over-Privileged Roles and RLS Gaps - Production Scenarios",
  description: "How to fix grants and row level security holes",
};

export default function ScenarioM11L02() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 2: Over-Privileged Roles and RLS Gaps</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          The login works. The permissions are wider than the product.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>
          <InterviewQACard level="Junior" question="A bug in a script dropped a table in production. How do you fix the access so it cannot happen again?">
            <p><strong>What you see:</strong> The app role is the table owner, or it is a superuser. DROP succeeded.</p>
            <p><strong>Why it happens:</strong> The same role that serves HTTP traffic owns the schema.</p>
            <p><strong>How to confirm:</strong> Check rolsuper and table ownership.</p>
            <p><strong>How to fix:</strong> Restore the table from backup. Create a migration role that owns objects and an app role with SELECT, INSERT, UPDATE, DELETE only. Point the app at the app role.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SELECT rolname, rolsuper FROM pg_roles WHERE rolname = 'app_user';
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>
          <InterviewQACard level="Mid" question="Row level security is enabled and a test user still sees every row. How do you fix it?">
            <p><strong>What you see:</strong> The policy looks right. The bypass happens only for one role.</p>
            <p><strong>Why it happens:</strong> Table owners bypass RLS unless FORCE ROW LEVEL SECURITY is set. Superusers bypass it too. The app might be connecting as the owner.</p>
            <p><strong>How to confirm:</strong> current_user and the table owner. relrowsecurity and relforcerowsecurity.</p>
            <p><strong>How to fix:</strong> Connect as a non-owner. ALTER TABLE ... FORCE ROW LEVEL SECURITY if the owner must be subject to policies. Set the tenant id in the session at the start of each request.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`ALTER TABLE orders FORCE ROW LEVEL SECURITY;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>
          <InterviewQACard level="Senior" question="A DATABASE_URL with a password was committed, and the repo is public for an hour. What do you do?">
            <p><strong>What you see:</strong> The secret is in git history. You cannot be sure who cloned it.</p>
            <p><strong>Why it happens:</strong> Anyone with the URL can log in as that role until the password changes. Deleting the commit does not help if it was fetched.</p>
            <p><strong>How to confirm:</strong> See successful logins from unknown IPs after the commit time.</p>
            <p><strong>How to fix:</strong> Rotate the password immediately. Revoke old sessions. Remove the secret from the current tree and stop logging URLs. Treat the data as exposed if the role could read it. Use a secret manager afterward.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`ALTER ROLE app_user PASSWORD 'new-secret-from-the-secret-manager';`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

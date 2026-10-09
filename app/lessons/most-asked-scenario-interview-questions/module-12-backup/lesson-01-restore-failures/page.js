import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: "Lesson 1: Restore Failures - Production Scenarios",
  description: "How to fix failed restores and bad PITR targets",
};

export default function ScenarioM12L01() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 1: Restore Failures</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          A backup you have never restored is a hope, not a backup.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>
          <InterviewQACard level="Junior" question="pg_restore fails with &quot;unsupported version&quot; or a server version mismatch. How do you fix it?">
            <p><strong>What you see:</strong> The dump file exists. Restore stops before the data loads.</p>
            <p><strong>Why it happens:</strong> The client is older than the server that created the dump, or you are restoring a custom dump with psql.</p>
            <p><strong>How to confirm:</strong> pg_restore --version and the dump header. Check whether the file is plain SQL or custom format.</p>
            <p><strong>How to fix:</strong> Install a client at least as new as the source server. Use pg_restore for custom format and psql for plain SQL. Restore into a server of the same major version when you can.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SELECT version();`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>
          <InterviewQACard level="Mid" question="The restore finishes and the app crashes because uuid or postgis functions are missing. How do you fix it?">
            <p><strong>What you see:</strong> Tables are back. The first query calls a function that does not exist.</p>
            <p><strong>Why it happens:</strong> Extensions were not in the dump, or they were skipped, or the new server has no extension packages installed.</p>
            <p><strong>How to confirm:</strong> SELECT * FROM pg_extension on the old and new databases.</p>
            <p><strong>How to fix:</strong> Install the packages on the host, then CREATE EXTENSION in the restored database before you open it to traffic. Add extensions to the restore checklist.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS postgis;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>
          <InterviewQACard level="Senior" question="Point-in-time recovery came up, but the bad delete is already in the database. How do you fix the target?">
            <p><strong>What you see:</strong> You recovered, and the deleted rows are still gone. Or you stopped too early and the database is missing later good writes.</p>
            <p><strong>Why it happens:</strong> recovery_target_time was after the delete, or the time zone of the timestamp you typed was not UTC.</p>
            <p><strong>How to confirm:</strong> Compare the target time to the log line of the delete. Check the timezone of that timestamp.</p>
            <p><strong>How to fix:</strong> Run recovery again on a fresh copy of the base backup with an earlier target. Promote only after you see the rows. Keep the original broken primary untouched until you have copied the data you need.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`-- postgresql.auto.conf on the recovery copy
-- recovery_target_time = '2026-04-01 09:55:00+00'
-- recovery_target_action = 'pause'`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

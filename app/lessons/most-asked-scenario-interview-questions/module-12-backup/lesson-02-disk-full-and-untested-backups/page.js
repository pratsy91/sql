import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: "Lesson 2: Disk Full and Untested Backups - Production Scenarios",
  description: "How to recover from a full WAL disk and prove backups restore",
};

export default function ScenarioM12L02() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 2: Disk Full and Untested Backups</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          The database stops accepting writes when it cannot write WAL.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>
          <InterviewQACard level="Junior" question="Postgres is up but every write fails and the disk is at 100 percent. How do you fix it?">
            <p><strong>What you see:</strong> Reads may work. Inserts fail. The volume that holds pg_wal is full.</p>
            <p><strong>Why it happens:</strong> WAL could not be archived or recycled. A slot, a broken archive_command, or a crashed replica is holding it.</p>
            <p><strong>How to confirm:</strong> df on the data volume. Check pg_replication_slots and the archive failure in the log.</p>
            <p><strong>How to fix:</strong> Free space first: remove old logs that are not inside the data directory. Do not delete files in pg_wal by hand. Fix archive_command or drop the unused slot so Postgres can recycle WAL. Then writes resume.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SELECT slot_name, active, wal_status
FROM pg_replication_slots;
SELECT pg_switch_wal();`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>
          <InterviewQACard level="Mid" question="The backup job has been green for months. A restore test found an empty or truncated file. How do you fix the process?">
            <p><strong>What you see:</strong> The cron mail says success. The object in storage is tiny, or the checksum fails.</p>
            <p><strong>Why it happens:</strong> The script ignored pg_dump's exit code, uploaded a partial file, or dumped the wrong database.</p>
            <p><strong>How to confirm:</strong> Open the latest object. Check size against the database. Run a restore into a scratch instance.</p>
            <p><strong>How to fix:</strong> Fail the job when pg_dump returns non-zero. Store a checksum. Restore on a schedule into a clean server and run a row-count check. Alert when the dump is much smaller than yesterday.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SELECT datname, pg_size_pretty(pg_database_size(datname)) FROM pg_database;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>
          <InterviewQACard level="Senior" question="pg_dump on the primary made the site slow and then the dump was canceled. How do you take a backup without that hit?">
            <p><strong>What you see:</strong> A long dump held a snapshot, dead tuples piled up, and IO spiked.</p>
            <p><strong>Why it happens:</strong> A logical dump on a busy primary reads everything and keeps a transaction open for the whole dump.</p>
            <p><strong>How to confirm:</strong> The dump session is the old xact_start during the incident.</p>
            <p><strong>How to fix:</strong> Dump from a replica, or use physical base backups and WAL archiving for PITR. If you must dump the primary, do it in a quiet window and watch the snapshot age.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SELECT pid, xact_start, query FROM pg_stat_activity WHERE query ILIKE 'COPY%' OR query ILIKE '%pg_dump%';`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';
import InterviewQACard from '../../../components/InterviewQACard';

export const metadata = {
  title: 'Module 12: Backup - Output-Based Interview Questions',
  description: 'Interpret dump/restore and catalog query output; Prisma migrate is not a backup',
};

export default function OutputModule12() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Module 12: Backup &amp; Recovery</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          What does this dump contain? What does restore print? What is missing?
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard
            level="Junior"
            question="pg_dump -s appdb vs pg_dump appdb. What is in the output file?"
          >
            <p>
              <code>-s</code>: schema only (DDL). Default dump: schema + data. Neither is WAL/PITR. Prisma migrate
              history is not a substitute.
            </p>
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard
            level="Mid"
            question="SELECT COUNT(*) FROM _prisma_migrations is 12. Database was dropped and recreated empty. Output of that query?"
          >
            <p>
              Error (table missing) or 0 if you only restored schema without data. Migrations table is data — restore
              from backup, do not assume git migrations replayed themselves.
            </p>
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="pg_restore -c on a live DB with connected users. Typical output?"
          >
            <p>
              Drops objects; may fail while sessions hold locks. Interviews: restore on empty/staging, not a hot
              primary without a plan.
            </p>
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard
            level="Senior"
            question="archive_mode=off. You take only pg_dump nightly. Can you answer 'restore to 15:07 yesterday'?"
          >
            <p>
              <strong>No PITR</strong>. Dump output is a point-in-time snapshot of dump start, not arbitrary WAL
              replay. Need base backup + WAL archive.
            </p>
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

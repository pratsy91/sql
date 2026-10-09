import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: "Lesson 3: Data Looks Wrong After a Release - Production Scenarios",
  description: "How to debug wrong data after a deploy: migrations, replicas, time zones, and caches",
};

export default function ScenarioM20L03() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 3: Data Looks Wrong After a Release</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Treat this as a bug in the newest change until you prove the data itself changed.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>
          <InterviewQACard level="Junior" question="After a deploy, new rows are missing from the list for a few seconds, then they appear. How do you fix it?">
            <p><strong>What you see:</strong> The create call succeeds. The list is stale, then correct.</p>
            <p><strong>Why it happens:</strong> The list reads a replica. Or the app cached the list.</p>
            <p><strong>How to confirm:</strong> The row is on the primary immediately. Replica lag or a cache key explains the delay.</p>
            <p><strong>How to fix:</strong> Read-your-writes from the primary for that user. Invalidate the cache on write. Do not tell people the save failed if the row is committed.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SELECT now() - pg_last_xact_replay_timestamp() AS lag;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>
          <InterviewQACard level="Mid" question="Totals changed the hour you deployed, and no rows were deleted. How do you fix the report?">
            <p><strong>What you see:</strong> Yesterday's revenue moved. The raw rows look the same.</p>
            <p><strong>Why it happens:</strong> The report time zone changed, a join started duplicating, or a filter that used to drop nulls no longer does. A code change is more likely than silent data loss.</p>
            <p><strong>How to confirm:</strong> Run the old SQL and the new SQL on the same database. Diff one order id.</p>
            <p><strong>How to fix:</strong> Restore the old predicate or the old zone conversion. Add a test that pins a known total. If a migration rewrote values, stop the job and restore those columns from backup.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SELECT date_trunc('day', created_at AT TIME ZONE 'Asia/Kolkata') AS day, sum(total)
FROM orders
GROUP BY 1
ORDER BY 1 DESC
LIMIT 5;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>
          <InterviewQACard level="Senior" question="Half the servers show the new behavior and half show the old, and some rows were written in both shapes. How do you fix it?">
            <p><strong>What you see:</strong> A rolling deploy. Some rows have the new column filled. Some do not. Users flap between versions.</p>
            <p><strong>Why it happens:</strong> Two app versions wrote at once. The migration backfill was still running.</p>
            <p><strong>How to confirm:</strong> Split rows by the presence of the new column and by updated_at during the deploy window.</p>
            <p><strong>How to fix:</strong> Finish the backfill. Make readers accept both shapes until the backfill is done. Roll forward rather than back if the new write path is safe. If the new path corrupted values, stop the new writers, restore the bad id range from a backup taken before the deploy, and replay only the good writes you can prove.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SELECT count(*) FILTER (WHERE source IS NULL) AS missing_source,
       count(*) FILTER (WHERE source IS NOT NULL) AS has_source
FROM orders
WHERE updated_at > now() - interval '2 hours';`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

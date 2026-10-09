import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: "Lesson 1: Partition Incidents - Production Scenarios",
  description: "How to fix partition routing and constraint gaps",
};

export default function ScenarioM15L01() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 1: Partition Incidents</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          The parent table looks normal until a row falls outside every partition.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>
          <InterviewQACard level="Junior" question="Inserts fail with &quot;no partition of relation events found for row&quot;. How do you fix it?">
            <p><strong>What you see:</strong> Rows for the new month fail. Older months still insert.</p>
            <p><strong>Why it happens:</strong> There is no partition for that key. A monthly job that creates the next partition did not run.</p>
            <p><strong>How to confirm:</strong> List child partitions and their bounds. Compare to the row you tried to insert.</p>
            <p><strong>How to fix:</strong> Create the missing partition, including a little future range. Add a monitor that alerts when the next partition does not exist. A default partition catches stragglers but makes later splits harder, so use it only if you will move rows out.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`CREATE TABLE events_2026_05 PARTITION OF events
  FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>
          <InterviewQACard level="Mid" question="A query on a partitioned table is slower than before you partitioned it. How do you fix it?">
            <p><strong>What you see:</strong> EXPLAIN shows every child being scanned. The WHERE does not mention the partition key.</p>
            <p><strong>Why it happens:</strong> Partition pruning only works when the planner can prove which partitions match. A function on the key, or a filter on a different column, disables pruning.</p>
            <p><strong>How to confirm:</strong> EXPLAIN should list fewer partitions when the key is in the WHERE as a plain range.</p>
            <p><strong>How to fix:</strong> Include the partition key in the query. Do not wrap it in a function. Add indexes on each child for the columns you filter besides the key. Partition by the column you always filter on, or do not partition.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`EXPLAIN SELECT * FROM events
WHERE created_at >= '2026-04-01' AND created_at < '2026-05-01'
  AND user_id = 42;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>
          <InterviewQACard level="Senior" question="You have a unique order number, but two partitions both contain it. How do you fix it?">
            <p><strong>What you see:</strong> A unique index exists on each partition. The parent still has duplicates of order_no.</p>
            <p><strong>Why it happens:</strong> Unique constraints on partitioned tables must include the partition key. Uniqueness of order_no alone is not enforced across partitions.</p>
            <p><strong>How to confirm:</strong> Read the unique index columns. Find duplicate order_no values in different children.</p>
            <p><strong>How to fix:</strong> Include the partition key in the unique constraint if that matches the business rule. If order_no must be unique globally, do not rely on per-partition unique indexes. Clean the duplicates and enforce uniqueness in a non-partitioned lookup table.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SELECT order_no, count(*) FROM events GROUP BY 1 HAVING count(*) > 1;`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

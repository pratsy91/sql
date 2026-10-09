import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';
import InterviewQACard from '../../../components/InterviewQACard';

export const metadata = {
  title: 'Module 15: Advanced - Output-Based Interview Questions',
  description: 'Predict partition pruning, FTS matches, window frames, generated column output',
};

export default function OutputModule15() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Module 15: Advanced Features</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          What partitions are scanned? Does FTS match? What does the window return?
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard
            level="Junior"
            question="GENERATED ALWAYS AS (lower(email)) STORED. UPDATE email. What is email_lower after?"
          >
            <p>
              Automatically recomputed. Direct <code>UPDATE ... SET email_lower =</code> errors.
            </p>
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard
            level="Mid"
            question="Partitioned by month. WHERE date_trunc('month', created_at) = '2026-01-01'. EXPLAIN scans all partitions. Why?"
          >
            <p>
              Function on the partition key hides the range. Output: no pruning. Filter{' '}
              <code>created_at &gt;= ... AND created_at &lt; ...</code> instead.
            </p>
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="to_tsvector('english', 'The Cats') @@ to_tsquery('english', 'cat'). Output?"
          >
            <p>
              <code>true</code> (stemming). Query <code>'cats'</code> as tsquery without stemming config may differ.
            </p>
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard
            level="Senior"
            question="SUM(total) OVER (ORDER BY id) vs ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW. Same output?"
          >
            <p>
              Default frame with ORDER BY is RANGE UNBOUNDED PRECEDING — ties in ORDER BY can include peer rows.
              Explicit ROWS is safer for running totals. Interviews love this gotcha.
            </p>
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

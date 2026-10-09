import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';
import InterviewQACard from '../../../components/InterviewQACard';

export const metadata = {
  title: 'Module 10: Performance - Output-Based Interview Questions',
  description: 'Interpret EXPLAIN output, OFFSET vs keyset, Prisma N+1 vs include results',
};

export default function OutputModule10() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Module 10: Performance</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Read the plan / the Prisma logs — what does it mean, and what is the fix?
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard
            level="Junior"
            question="EXPLAIN shows Seq Scan on users (1000000 rows) Filter: (email = ...). What does that output mean?"
          >
            <p>
              Full table scan; index on email is missing or not used (e.g. wrapped in <code>LOWER()</code> without a
              matching expression index). Fix: btree on <code>email</code> or <code>(LOWER(email))</code>.
            </p>
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard
            level="Mid"
            question="Page 500 with LIMIT 20 OFFSET 9980 vs keyset WHERE id &lt; last LIMIT 20. Same 20 rows?"
          >
            <p>
              Not necessarily if concurrent inserts/deletes happen. OFFSET also gets slower (must skip 9980 rows).
              Keyset is stable relative to the cursor values you pass.
            </p>
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="Prisma: for 50 users, await posts.findMany in a loop. What N+1 output do you see in query logs?"
          >
            <p>
              1 query for users + 50 for posts. Fix: one <code>findMany</code> with <code>include</code> /{' '}
              <code>in: ids</code>.
            </p>
            <CodeBlock
              title="Correct"
              language="typescript"
              code={`await prisma.user.findMany({
  take: 50,
  include: { posts: true },
});`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard
            level="Senior"
            question="Index exists on (user_id, created_at). Query is WHERE created_at &gt; $1 only. Plan still Seq Scan. Why?"
          >
            <p>
              Leading column <code>user_id</code> is not constrained. B-tree cannot efficiently use the second column
              alone. Output: seq scan or skip-scan (PG 17+ in some cases). Fix: extra index on <code>created_at</code>.
            </p>
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

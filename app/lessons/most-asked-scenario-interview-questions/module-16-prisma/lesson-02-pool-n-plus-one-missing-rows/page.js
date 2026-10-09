import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: "Lesson 2: Pool Timeouts, N+1, and Missing Rows - Production Scenarios",
  description: "How to fix Prisma pool timeouts, N+1 queries, and updates that find no row",
};

export default function ScenarioM16L02() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 2: Pool Timeouts, N+1, and Missing Rows</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          These are the Prisma errors that show up in production logs every week.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>
          <InterviewQACard level="Junior" question="prisma.order.update throws P2025 &quot;record not found&quot;, but the order exists. How do you fix it?">
            <p><strong>What you see:</strong> The id is valid. The update still throws. A direct SQL update works.</p>
            <p><strong>Why it happens:</strong> The where clause is not only the id. A tenant filter, a soft-delete flag, or a stale id from another environment does not match. Prisma update requires exactly one row.</p>
            <p><strong>How to confirm:</strong> Run the same where as a findFirst. Check the middleware that adds tenant_id.</p>
            <p><strong>How to fix:</strong> Include every predicate you intend. If the row is in another tenant, this is a bug in the caller, not a reason to drop the filter. Handle P2025 as not found, not as a crash.</p>
            <CodeBlock
              title="App-side fix"
              language="typescript"
              code={`const order = await prisma.order.findFirst({
  where: { id: orderId, tenantId },
});`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>
          <InterviewQACard level="Mid" question="One API call runs hundreds of queries and the page times out. How do you fix it?">
            <p><strong>What you see:</strong> The log shows the same SELECT with a different id, once per row. Postgres is fine. The app is chatty.</p>
            <p><strong>Why it happens:</strong> A loop calls prisma inside it, or an include is nested so deep that Prisma still fans out.</p>
            <p><strong>How to confirm:</strong> Count statements for one request in the log or in pg_stat_statements.</p>
            <p><strong>How to fix:</strong> Load the related rows in one query with include or an IN list. Do not query inside the loop. Cap the include. If the graph is huge, paginate it.</p>
            <CodeBlock
              title="App-side fix"
              language="typescript"
              code={`const orders = await prisma.order.findMany({
  where: { userId },
  include: { items: true },
  take: 20,
});`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>
          <InterviewQACard level="Senior" question="Under load you get P2024, timed out fetching a connection. The SQL itself is fast. How do you fix it?">
            <p><strong>What you see:</strong> Errors spike with traffic. pg_stat_activity is full of idle app sessions or a few idle transactions.</p>
            <p><strong>Why it happens:</strong> connection_limit times the number of Node processes is too high, or too low and requests wait. Interactive transactions hold slots while they do other work.</p>
            <p><strong>How to confirm:</strong> Multiply process count by connection_limit. Compare to max_connections and to active versus idle sessions.</p>
            <p><strong>How to fix:</strong> Set an explicit connection_limit. Put PgBouncer in transaction mode only if you are not using session features. Shorten transactions. Raise the pool only if Postgres still has memory and connection headroom.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SELECT state, count(*) FROM pg_stat_activity
WHERE usename = 'app_user' GROUP BY 1;`}
            />
            <CodeBlock
              title="App-side fix"
              language="typescript"
              code={`// DATABASE_URL
// postgresql://app:pw@pooler:5432/app?connection_limit=5&pool_timeout=10`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

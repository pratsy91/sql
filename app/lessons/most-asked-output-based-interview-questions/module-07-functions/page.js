import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';
import InterviewQACard from '../../../components/InterviewQACard';

export const metadata = {
  title: 'Module 7: Functions - Output-Based Interview Questions',
  description: 'Predict COALESCE, CONCAT, COUNT, date_trunc, JSONB operator, and DISTINCT ON results',
};

export default function OutputModule07() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Module 7: Functions &amp; Operators</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Given expressions, what value comes back (including NULL traps).
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard
            level="Junior"
            question="SELECT 'a' || NULL; vs CONCAT('a', NULL); vs COALESCE(NULL, 'x');"
          >
            <p>
              <code>||</code> with NULL → <code>NULL</code>. <code>CONCAT</code> skips NULLs → <code>a</code>.
              COALESCE → <code>x</code>.
            </p>
          </InterviewQACard>

          <InterviewQACard
            level="Junior"
            question="SELECT ROUND(2.5), ROUND(2.5::numeric, 0); Output difference?"
          >
            <p>
              Float round-to-even can surprise; NUMERIC rounding is what money interviews expect. Always{' '}
              <code>::numeric</code> for money.
            </p>
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard
            level="Mid"
            question="date_trunc('month', timestamptz '2026-01-31 20:00+00') with TimeZone Asia/Kolkata — what month?"
          >
            <p>
              Truncation uses session TZ. 20:00 UTC is 01:30 next day IST → February in Kolkata, January in UTC.
              Output depends on <code>TimeZone</code>.
            </p>
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="Orders: user 1 has two rows (old then new). DISTINCT ON (user_id) ... ORDER BY user_id, created_at DESC. Which order id?"
          >
            <p>
              The <strong>newest</strong> row per user. If ORDER BY created_at ASC you get the oldest. Mismatch of
              DISTINCT ON and ORDER BY leftmost keys → error.
            </p>
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard
            level="Senior"
            question="COUNT(*) FILTER (WHERE status = 'paid') when some status are NULL. Are NULL statuses counted in FILTER?"
          >
            <p>
              No. FILTER keeps rows where the predicate is TRUE. <code>NULL = 'paid'</code> is unknown → excluded.
            </p>
          </InterviewQACard>

          <InterviewQACard
            level="Senior"
            question="Prisma: orderBy: { email: 'asc' } on mixed-case emails. Same as SQL ORDER BY email?"
          >
            <p>
              Yes for default collation (case-sensitive in typical C/POSIX). <code>ORDER BY LOWER(email)</code> is a
              different order — Prisma needs <code>queryRawUnsafe</code> or a generated column for that.
            </p>
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';
import InterviewQACard from '../../../components/InterviewQACard';

export const metadata = {
  title: 'Module 3: DDL - Output-Based Interview Questions',
  description: 'Predict DDL outcomes: IF EXISTS, CASCADE, IDENTITY, Prisma db push vs migrate mistakes',
};

export default function OutputModule03() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Module 3: DDL</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          What happens after CREATE/ALTER/DROP — errors, cascades, Prisma migrate mistakes.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard
            level="Junior"
            question="Table users exists. What is the output of CREATE TABLE users (id int); vs CREATE TABLE IF NOT EXISTS?"
          >
            <p>
              First: error <code>already exists</code>. Second: notice, no error, table unchanged (does not alter
              columns).
            </p>
          </InterviewQACard>

          <InterviewQACard
            level="Junior"
            question="This Prisma snippet is used as a 'migration'. What is wrong?"
          >
            <CodeBlock
              title="Given (wrong)"
              language="typescript"
              code={`await prisma.$executeRawUnsafe('ALTER TABLE users ADD COLUMN age int');`}
            />
            <p>
              Works once, not tracked, drifts from <code>schema.prisma</code>. Right: change the schema and{' '}
              <code>prisma migrate dev</code>.
            </p>
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard
            level="Mid"
            question="orders.user_id REFERENCES users(id). What does DROP TABLE users; vs DROP TABLE users CASCADE; do?"
          >
            <p>
              Without CASCADE: error (dependent FK). With CASCADE: drops <code>users</code> and the FK (and possibly
              dependent objects). <code>orders</code> may remain with the constraint gone — dangerous.
            </p>
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="After CREATE TABLE t (id SERIAL PRIMARY KEY); INSERT two rows. What is the next id if you INSERT an explicit id=10 then a default row?"
          >
            <p>
              SERIAL sequence does not jump to 11 unless you <code>setval</code>. Next default insert may retry and
              fail unique, or succeed at 3, then later collide with 10. IDENTITY <code>GENERATED ALWAYS</code> blocks
              explicit ids unless <code>OVERRIDING SYSTEM VALUE</code>.
            </p>
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard
            level="Senior"
            question="REFRESH MATERIALIZED VIEW CONCURRENTLY monthly; — when does it error?"
          >
            <p>
              Needs a unique index on the MV. Without it: error. Regular <code>REFRESH</code> locks reads; concurrent
              does not, but cannot run inside a transaction block.
            </p>
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';
import InterviewQACard from '../../../components/InterviewQACard';

export const metadata = {
  title: 'Module 2: Data Types - Output-Based Interview Questions',
  description: 'Predict output of CAST, NULL, JSONB, timestamps, BOOLEAN, and Prisma type mistakes',
};

export default function OutputModule02() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Module 2: Data Types</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Predict results of type coercion, JSON operators, and Prisma scalar mistakes.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="What is the output of each boolean/NULL comparison?">
            <CodeBlock
              title="Given"
              language="sql"
              code={`SELECT TRUE AND NULL;
SELECT TRUE OR NULL;
SELECT NOT NULL;
SELECT NULL = NULL;
SELECT NULL IS NULL;`}
            />
            <p>
              <strong>Output:</strong> <code>NULL</code>, <code>TRUE</code>, <code>NULL</code>, <code>NULL</code>,{' '}
              <code>TRUE</code>. Equality with NULL is never TRUE; use <code>IS NULL</code>.
            </p>
          </InterviewQACard>

          <InterviewQACard
            level="Junior"
            question="Prisma model uses Float for money. What is wrong, and what is the right type?"
          >
            <CodeBlock
              title="Given (wrong)"
              language="prisma"
              code={`model Invoice {
  id     Int
  amount Float
}`}
            />
            <p>
              Binary floats round. Interviews expect <code>Decimal</code> / <code>NUMERIC</code>.
            </p>
            <CodeBlock
              title="Correct"
              language="prisma"
              code={`model Invoice {
  id     Int     @id @default(autoincrement())
  amount Decimal @db.Decimal(12, 2)
}`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard
            level="Mid"
            question={'payload = {"a": {"b": 1}, "n": 10}. What does each expression return?'}
          >
            <CodeBlock
              title="Given"
              language="sql"
              code={`SELECT payload->'a';
SELECT payload->>'a';
SELECT payload #>> '{a,b}';
SELECT (payload->>'n') + 1;`}
            />
            <p>
              JSONB object; text of that object; text <code>1</code>; last line <strong>errors</strong> (text + int)
              unless you <code>::int</code>.
            </p>
            <CodeBlock
              title="Correct last line"
              language="sql"
              code={`SELECT (payload->>'n')::int + 1;`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="What is stored vs displayed for TIMESTAMPTZ vs TIMESTAMP if session TimeZone is Asia/Kolkata?"
          >
            <p>
              <code>TIMESTAMPTZ</code> stores UTC, displays in session TZ. Plain <code>TIMESTAMP</code> stores the
              wall clock as given with no zone conversion. Mixing them in Prisma <code>DateTime</code> without{' '}
              <code>@db.Timestamptz</code> is a frequent bug.
            </p>
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard
            level="Senior"
            question="'SELECT 1/0' vs 'SELECT 1.0/0' vs NUMERIC overflow — what happens?"
          >
            <p>
              Integer <code>1/0</code> → division by zero error. <code>1.0/0</code> is float →{' '}
              <code>Infinity</code> (IEEE). <code>NUMERIC</code> division by zero still errors. Interviewers use this
              to see if you know type families.
            </p>
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

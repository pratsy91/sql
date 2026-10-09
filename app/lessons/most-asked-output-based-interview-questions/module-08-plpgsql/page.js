import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';
import InterviewQACard from '../../../components/InterviewQACard';

export const metadata = {
  title: 'Module 8: PL/pgSQL - Output-Based Interview Questions',
  description: 'Predict function/trigger/NEW-OLD output and Prisma raw-call mistakes',
};

export default function OutputModule08() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Module 8: PL/pgSQL</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          What does the function return? What does the trigger change? What Prisma call is wrong?
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard
            level="Junior"
            question="RETURNS integer SQL function SELECT 1+1; SELECT bonus(); Output?"
          >
            <p>
              <code>2</code>. SQL-language functions are just queries. Missing RETURN in plpgsql would error.
            </p>
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard
            level="Mid"
            question="BEFORE INSERT trigger sets NEW.email := LOWER(NEW.email) then RETURN NEW. INSERT 'Ann@X.com'. Stored value?"
          >
            <p>
              <code>ann@x.com</code>. If the trigger <code>RETURN NULL</code> instead, the insert is skipped (0 rows)
              — classic output question.
            </p>
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="AFTER UPDATE trigger uses NEW and OLD. Which is the pre-image?"
          >
            <p>
              <code>OLD</code> is before, <code>NEW</code> is after. INSERT has no OLD; DELETE has no NEW (NULL).
            </p>
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard
            level="Senior"
            question="EXCEPTION WHEN OTHERS THEN RETURN 0; around 1/0. What does the caller see? Why is this a bad pattern?"
          >
            <p>
              Output: <code>0</code>, no error. It hides real bugs. Interviews want you to catch specific SQLSTATEs
              and re-raise others.
            </p>
          </InterviewQACard>

          <InterviewQACard
            level="Senior"
            question="This Prisma call to a function is wrong. What happens and what is the fix?"
          >
            <CodeBlock
              title="Given (wrong)"
              language="typescript"
              code={`await prisma.debit({ id: 1, amount: 10 });`}
            />
            <p>
              Prisma does not generate Client methods for arbitrary SQL functions → TypeScript/runtime error. Call
              SQL explicitly:
            </p>
            <CodeBlock
              title="Correct"
              language="typescript"
              code={`await prisma.$queryRawUnsafe('SELECT debit($1, $2)', 1, 10);`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

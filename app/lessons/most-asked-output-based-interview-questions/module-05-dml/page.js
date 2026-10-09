import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';
import InterviewQACard from '../../../components/InterviewQACard';

export const metadata = {
  title: 'Module 5: DML - Output-Based Interview Questions',
  description: 'Predict INSERT RETURNING, UPSERT, DELETE counts, Prisma createMany output mistakes',
};

export default function OutputModule05() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Module 5: DML</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Predict write results and Prisma return shapes. Junior → Senior.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard
            level="Junior"
            question="UPDATE users SET name = 'A'; with 5 rows. What does it return in psql vs Prisma updateMany?"
          >
            <p>
              psql: <code>UPDATE 5</code>. Prisma <code>updateMany</code>: <code>{'{ count: 5 }'}</code> — not the
              rows. <code>update</code> (singular) needs a unique where and returns the row.
            </p>
          </InterviewQACard>

          <InterviewQACard
            level="Junior"
            question="This Prisma is expected to return inserted users. What is the actual output?"
          >
            <CodeBlock
              title="Given"
              language="typescript"
              code={`const result = await prisma.user.createMany({
  data: [{ email: 'a@x.com' }, { email: 'b@x.com' }],
});`}
            />
            <p>
              <strong>Output:</strong> <code>{'{ count: 2 }'}</code>, not an array of users. Use{' '}
              <code>createManyAndReturn</code> (Prisma 5.14+) or individual <code>create</code>.
            </p>
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard
            level="Mid"
            question="Row email=a@x.com name=Old exists. What is the name after this UPSERT?"
          >
            <CodeBlock
              title="Given"
              language="sql"
              code={`INSERT INTO users (email, name) VALUES ('a@x.com', 'New')
ON CONFLICT (email) DO UPDATE SET name = users.name;`}
            />
            <p>
              Stays <strong>Old</strong> because SET uses the existing table column, not <code>EXCLUDED.name</code>.
            </p>
            <CodeBlock
              title="Correct if you wanted New"
              language="sql"
              code={`ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name;`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="DELETE FROM t; vs TRUNCATE t; — both empty. What differs in output / identity?"
          >
            <p>
              DELETE reports row count, fires row triggers, can ROLLBACK, does not reset IDENTITY by default.
              TRUNCATE is faster, typically resets identity, cannot WHERE, still transactional in Postgres.
            </p>
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard
            level="Senior"
            question="createMany skipDuplicates: true with one duplicate email. Output of count?"
          >
            <p>
              <code>count</code> is rows actually inserted (e.g. 1 if 2 were sent and 1 conflicted). No error. Without
              skipDuplicates: <code>P2002</code> and nothing committed for that statement (single statement).
            </p>
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

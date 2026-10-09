import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';
import InterviewQACard from '../../../components/InterviewQACard';

export const metadata = {
  title: 'Module 4: Constraints - Output-Based Interview Questions',
  description: 'Predict constraint errors, FK cascade row effects, Prisma onDelete mismatches',
};

export default function OutputModule04() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Module 4: Constraints</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Given inserts/deletes, what error or remaining rows do you get?
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard
            level="Junior"
            question="UNIQUE(email). Two inserts of the same email — what is the output of the second?"
          >
            <p>
              Error <code>23505 unique_violation</code>. In Prisma: <code>P2002</code> on the target field{' '}
              <code>email</code>.
            </p>
          </InterviewQACard>

          <InterviewQACard
            level="Junior"
            question="CHECK (price >= 0). INSERT price = -1. Output?"
          >
            <p>
              Error <code>23514 check_violation</code>. Prisma does not always model CHECK — the DB still rejects.
            </p>
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard
            level="Mid"
            question="Parent users id=1 has 3 orders ON DELETE CASCADE. DELETE FROM users WHERE id=1. How many orders remain for that user?"
          >
            <p>
              <strong>Output:</strong> 0 orders. CASCADE deleted children. With <code>RESTRICT</code> the DELETE
              itself fails and 3 orders remain.
            </p>
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="Prisma schema says onDelete: Cascade but the DB FK was created as NO ACTION. You prisma.user.delete(). What happens?"
          >
            <p>
              Client intent is ignored at runtime. Postgres uses the real FK: delete fails if children exist (
              <code>P2003</code>). Fix: migrate the actual constraint.
            </p>
            <CodeBlock
              title="Correct Prisma (must match DB)"
              language="prisma"
              code={`user User @relation(fields: [userId], references: [id], onDelete: Restrict)`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard
            level="Senior"
            question="Two NULL emails with UNIQUE(email). How many rows can you insert? Why?"
          >
            <p>
              In PostgreSQL, UNIQUE allows multiple NULLs (NULL is distinct from NULL). Output: both inserts succeed.
              Prisma <code>String?</code> + <code>@unique</code> has the same DB behavior.
            </p>
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

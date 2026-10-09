import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';
import InterviewQACard from '../../../components/InterviewQACard';

export const metadata = {
  title: 'Module 14: Extensions - Output-Based Interview Questions',
  description: 'Predict gen_random_uuid, pg_trgm similarity, citext, vector distance output',
};

export default function OutputModule14() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Module 14: Extensions</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Missing extension errors vs actual function output.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard
            level="Junior"
            question="SELECT gen_random_uuid(); before CREATE EXTENSION pgcrypto (PG 12). Output?"
          >
            <p>
              Function does not exist (error). PG 13+ has <code>gen_random_uuid()</code> in core. Interview: know
              version + extension.
            </p>
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard
            level="Mid"
            question="citext email UNIQUE. Insert 'A@x.com' then 'a@x.com'. Second output?"
          >
            <p>
              Unique violation (case-insensitive type). Plain TEXT unique would accept both — a common Prisma{' '}
              <code>String @unique</code> footgun unless you normalize.
            </p>
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="similarity('postgres', 'postgre') with pg_trgm. Range of output?"
          >
            <p>
              Real in 0..1 (higher = closer). <code>%</code> operator uses a threshold (default ~0.3). Without
              extension: operator/function missing error.
            </p>
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard
            level="Senior"
            question="ORDER BY embedding &lt;-&gt; query LIMIT 5 without vector index. Output rows still correct?"
          >
            <p>
              Yes — correct k-NN, but sequential. Index (IVFFlat/HNSW) changes <em>speed</em>, approximate on some
              types. Missing <code>vector</code> extension → type error in schema.prisma too.
            </p>
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

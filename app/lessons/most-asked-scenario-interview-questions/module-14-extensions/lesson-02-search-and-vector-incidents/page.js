import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: "Lesson 2: Search and Vector Incidents - Production Scenarios",
  description: "How to fix slow trigram search and unused vector indexes",
};

export default function ScenarioM14L02() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 2: Search and Vector Incidents</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          The extension is installed. The query still does not use it.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>
          <InterviewQACard level="Junior" question="A search box using ILIKE '%term%' is fast in staging and slow in production. How do you fix it?">
            <p><strong>What you see:</strong> Staging has a few thousand rows. Production scans millions.</p>
            <p><strong>Why it happens:</strong> A leading wildcard cannot use a normal btree. Staging was small enough that a scan felt fine.</p>
            <p><strong>How to confirm:</strong> EXPLAIN on production shows a sequential scan.</p>
            <p><strong>How to fix:</strong> CREATE EXTENSION pg_trgm and a GIN index on the column with gin_trgm_ops. Keep the pattern as ILIKE. For real language search, use full-text search instead of trigram.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX CONCURRENTLY users_name_trgm
  ON users USING gin (name gin_trgm_ops);`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>
          <InterviewQACard level="Mid" question="A pgvector similarity query ignores the index. How do you fix it?">
            <p><strong>What you see:</strong> You created an index. EXPLAIN still scans the embedding column.</p>
            <p><strong>Why it happens:</strong> The index operator class does not match the operator in the query. An L2 index will not serve a cosine operator, and the planner may also skip it when the row count is small or the probes setting is off.</p>
            <p><strong>How to confirm:</strong> Read the index definition and the operator in the WHERE or ORDER BY.</p>
            <p><strong>How to fix:</strong> Recreate the index with the operator class you actually query. Set the index probes for the session if the plan can use it but chooses not to. Measure recall. Do not assume the index is correct because CREATE INDEX succeeded.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SELECT pg_get_indexdef(indexrelid)
FROM pg_index
WHERE indrelid = 'documents'::regclass;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>
          <InterviewQACard level="Senior" question="PostGIS nearest-neighbor queries got slow after a data load. How do you fix it?">
            <p><strong>What you see:</strong> The GIST index exists. Plans show a scan, or the index is used but the order is wrong.</p>
            <p><strong>Why it happens:</strong> Statistics are stale after the load, or the query computes distance in a way that cannot use the index, or the index was created on geometry and the query casts to geography.</p>
            <p><strong>How to confirm:</strong> EXPLAIN (ANALYZE). Compare the column type and the function. ST_DWithin can use the index. A wrapper around it often cannot.</p>
            <p><strong>How to fix:</strong> ANALYZE the table. Rewrite the predicate to ST_DWithin. Match geometry versus geography. Rebuild the index if it was created while the table was empty and you are on an old version that did not update it well.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`ANALYZE places;
SELECT id FROM places
WHERE ST_DWithin(geom, ST_MakePoint(77.59, 12.97)::geography, 1000);`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

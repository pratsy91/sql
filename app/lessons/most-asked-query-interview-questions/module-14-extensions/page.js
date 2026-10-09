import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';
import InterviewQACard from '../../../components/InterviewQACard';

export const metadata = {
  title: 'Module 14: Extensions - Most Asked Query Interview Questions',
  description: 'Most asked extension SQL: uuid, pg_trgm, citext, PostGIS, pgvector',
};

export default function Module14ExtensionQueries() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Module 14: Extensions</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Most asked extension-enabled queries. Junior → Senior.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="Write queries to list extensions and create uuid-ossp / pgcrypto usage.">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`SELECT extname, extversion FROM pg_extension ORDER BY extname;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
SELECT gen_random_uuid();`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="Write pg_trgm similarity / ILIKE-accelerated search.">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX users_name_trgm ON users USING GIN (name gin_trgm_ops);

SELECT name, similarity(name, 'jon') AS sim
FROM users
WHERE name % 'jon'
ORDER BY sim DESC
LIMIT 10;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Write a citext case-insensitive email uniqueness query.">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`CREATE EXTENSION IF NOT EXISTS citext;
CREATE TABLE accounts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email CITEXT NOT NULL UNIQUE
);
SELECT * FROM accounts WHERE email = 'Ann@X.com';`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="Write a PostGIS radius search (ST_DWithin).">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`CREATE EXTENSION IF NOT EXISTS postgis;
SELECT id, name
FROM stores
WHERE ST_DWithin(
  geo,
  ST_MakePoint(-73.98, 40.76)::geography,
  1000
);`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Senior"
            question="Write a pgvector nearest-neighbor query (hot in AI interviews)."
          >
            <p>
              Distance operator in SQL is <code>&lt;-&gt;</code> (L2). Create the vector extension first.
            </p>
            <CodeBlock
              title="SQL"
              language="sql"
              code={`CREATE EXTENSION IF NOT EXISTS vector;

SELECT id, embedding <-> '[0.1,0.2,0.3]' AS dist
FROM documents
ORDER BY embedding <-> '[0.1,0.2,0.3]'
LIMIT 5;`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

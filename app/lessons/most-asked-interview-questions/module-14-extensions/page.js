import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';
import InterviewQACard from '../../../components/InterviewQACard';

export const metadata = {
  title: 'Module 14: Extensions - Most Asked Interview Questions',
  description:
    'Most asked PostgreSQL extensions interview questions: CREATE EXTENSION, uuid-ossp, pgcrypto, gen_random_uuid, pg_trgm, PostGIS, citext, pgvector, and Prisma postgresqlExtensions.',
};

export default function Module14() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Module 14: Extensions</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Most asked interview questions for Phase 14 — Junior → Senior. Covers what extensions are,{' '}
          <code>CREATE EXTENSION</code>, popular modules (uuid, pgcrypto, pg_trgm, PostGIS, citext,
          pgvector, hstore), and how Prisma declares them (PostgreSQL 15/16/17).
        </p>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 text-emerald-700 dark:text-emerald-400">
            Junior Level
          </h2>

          <InterviewQACard level="Junior" question="What is a PostgreSQL extension?">
            <p>
              An extension packages SQL objects (types, functions, operators, indexes) and optional C
              libraries that add features beyond core PostgreSQL. You install them per database with{' '}
              <code>CREATE EXTENSION</code>. Managed providers often allowlist which extensions you may
              enable.
            </p>
          </InterviewQACard>

          <InterviewQACard level="Junior" question="How do you create, list, and drop extensions?">
            <CodeBlock
              title="Extension lifecycle"
              language="sql"
              code={`CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

SELECT extname, extversion FROM pg_extension;
\dx  -- in psql

DROP EXTENSION IF EXISTS pg_trgm;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="uuid-ossp vs pgcrypto vs gen_random_uuid()—what should you use?">
            <p>
              <code>gen_random_uuid()</code> is built into core PostgreSQL since <strong>PG 13</strong>{' '}
              (no extension needed) and is the usual default for UUIDv4. <code>uuid-ossp</code> provides
              additional UUID versions (v1/v3/v5). <code>pgcrypto</code> focuses on hashing/encryption
              helpers and also historically provided UUID generation. Prefer <code>gen_random_uuid()</code>{' '}
              unless you need ossp-specific algorithms.
            </p>
            <CodeBlock
              title="UUID generation"
              language="sql"
              code={`SELECT gen_random_uuid();  -- core PG13+

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
SELECT uuid_generate_v4();
SELECT uuid_generate_v1();`}
            />
            <CodeBlock
              title="Prisma default UUID"
              language="prisma"
              code={`model User {
  id    String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email String @unique
}`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="What is citext and when is it useful?">
            <p>
              <code>citext</code> is a case-insensitive text type. Comparisons ignore case, which simplifies
              email/username uniqueness without wrapping every query in <code>LOWER()</code>. Still normalize
              input in the app for consistency.
            </p>
            <CodeBlock
              title="citext"
              language="sql"
              code={`CREATE EXTENSION IF NOT EXISTS citext;
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email CITEXT UNIQUE NOT NULL
);
-- 'Alice@X.com' and 'alice@x.com' collide on UNIQUE`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="What is hstore? How does it compare to JSONB?">
            <p>
              <code>hstore</code> stores flat key/value string pairs. <code>JSONB</code> is richer nested
              JSON with broader indexing and is preferred for most new designs. Mention hstore in
              interviews as a legacy/simple KV type; recommend JSONB unless maintaining old schemas.
            </p>
          </InterviewQACard>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 text-blue-700 dark:text-blue-400">
            Mid Level
          </h2>

          <InterviewQACard level="Mid" question="What does pg_trgm do?">
            <p>
              <code>pg_trgm</code> (trigram) enables similarity search and accelerates{' '}
              <code>LIKE</code>/<code>ILIKE '%pattern%'</code> with GIN/GiST indexes—common for typeahead
              and fuzzy matching.
            </p>
            <CodeBlock
              title="Trigram similarity + index"
              language="sql"
              code={`CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX users_name_trgm ON users USING GIN (name gin_trgm_ops);

SELECT name, similarity(name, 'jonathon') AS score
FROM users
WHERE name % 'jonathon'
ORDER BY score DESC;`}
            />
            <CodeBlock
              title="Prisma raw for trigram query"
              language="typescript"
              code={`const rows = await prisma.$queryRaw\`
  SELECT id, name, similarity(name, \${q}) AS score
  FROM users
  WHERE name % \${q}
  ORDER BY score DESC
  LIMIT 20
\`;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What is pgcrypto used for?">
            <p>
              Cryptographic functions: hashing (<code>crypt</code>, <code>gen_salt</code>), PGP
              encryption, digests. Prefer app-level password hashing (bcrypt/argon2) for auth, but
              interviewers may ask about one-way hashes or encrypted columns at rest in SQL.
            </p>
            <CodeBlock
              title="pgcrypto digest example"
              language="sql"
              code={`CREATE EXTENSION IF NOT EXISTS pgcrypto;
SELECT encode(digest('payload', 'sha256'), 'hex');
SELECT crypt('password', gen_salt('bf'));`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What is PostGIS?">
            <p>
              PostGIS adds geospatial types and indexes (geometry/geography), distance queries, and GIS
              operators. Used for maps, delivery radius, “nearest store” queries. Heavy extension—often
              requires provider support and careful indexing (GiST).
            </p>
            <CodeBlock
              title="PostGIS sketch"
              language="sql"
              code={`CREATE EXTENSION IF NOT EXISTS postgis;
CREATE TABLE shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  loc GEOGRAPHY(POINT, 4326)
);
CREATE INDEX shops_loc_gix ON shops USING GIST (loc);

SELECT name
FROM shops
WHERE ST_DWithin(loc, ST_MakePoint(-73.97, 40.77)::geography, 1000);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How does Prisma declare PostgreSQL extensions in the schema?">
            <p>
              Modern Prisma supports native <code>extensions</code> in the datasource (and historically the{' '}
              <code>postgresqlExtensions</code> preview). Declaring them documents intent and can emit{' '}
              <code>CREATE EXTENSION</code> in migrations when configured. Still ensure the target server
              allows the extension.
            </p>
            <CodeBlock
              title="Prisma schema extensions"
              language="prisma"
              code={`datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [pgcrypto, pg_trgm, vector]
}

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"] // if required by your Prisma version
}

model Document {
  id        String                       @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  embedding Unsupported("vector(1536)")?
}`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Where should extensions be installed (schema concerns)?">
            <p>
              By default many land in <code>public</code>. Teams often install into a dedicated schema
              (e.g., <code>extensions</code>) and put it on <code>search_path</code> for cleanliness and
              safer hardening of <code>public</code>. Managed Postgres may force a specific schema.
            </p>
            <CodeBlock
              title="Install into extensions schema"
              language="sql"
              code={`CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Do extensions survive pg_dump / Prisma migrate?">
            <p>
              <code>pg_dump</code> includes <code>CREATE EXTENSION</code> statements (not the C library
              itself). The target cluster must have the extension files available. Prisma migrations should
              explicitly create needed extensions so empty environments bootstrap correctly—don’t rely on
              “someone ran it once in staging.”
            </p>
          </InterviewQACard>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 text-amber-700 dark:text-amber-400">
            Senior Level
          </h2>

          <InterviewQACard level="Senior" question="What is pgvector and why is it a hot interview topic?">
            <p>
              <code>pgvector</code> adds a <code>vector</code> type and similarity search (L2, inner
              product, cosine) with IVFFlat/HNSW indexes—used for embeddings / RAG / AI features inside
              PostgreSQL. Interviewers ask about index tradeoffs, recall vs latency, and whether vectors
              belong in PG vs a dedicated vector DB.
            </p>
            <CodeBlock
              title="pgvector basics"
              language="sql"
              code={`CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  embedding vector(1536) NOT NULL
);

CREATE INDEX docs_embedding_hnsw
  ON docs USING hnsw (embedding vector_cosine_ops);

SELECT id, content
FROM docs
ORDER BY embedding <=> '[0.1, 0.2, ...]'::vector
LIMIT 10;`}
            />
            <CodeBlock
              title="Prisma + pgvector (Unsupported or Unsupported-like)"
              language="typescript"
              code={`const nearest = await prisma.$queryRaw\`
  SELECT id, content
  FROM docs
  ORDER BY embedding <=> \${embedding}::vector
  LIMIT 10
\`;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="IVFFlat vs HNSW for pgvector—what do you say?">
            <p>
              <strong>IVFFlat</strong>: faster to build, lower memory, needs training/lists tuning, good
              enough recall with care. <strong>HNSW</strong>: generally better query recall/latency at
              higher build time and memory. Choose based on dataset size, update rate, and SLA. Always
              benchmark with your embedding dimensionality and concurrency.
            </p>
          </InterviewQACard>

          <InterviewQACard level="Senior" question="shared_preload_libraries and extension privileges—what matters?">
            <p>
              Some extensions need to be listed in <code>shared_preload_libraries</code> and require a
              restart (e.g., <code>pg_stat_statements</code>). <code>CREATE EXTENSION</code> usually needs
              superuser or a role with appropriate privileges (on managed PG, use their allowlist UI).
              Never grant app runtime roles the ability to install arbitrary extensions.
            </p>
          </InterviewQACard>

          <InterviewQACard level="Senior" question="How do you upgrade extensions safely across PG 15 → 16 → 17?">
            <ul className="list-disc pl-5 space-y-1">
              <li>Check extension compatibility with the new major version</li>
              <li>
                After binary upgrade / logical migration, run <code>ALTER EXTENSION ... UPDATE</code>
              </li>
              <li>Reindex if upstream release notes require it (common for PostGIS/pgvector)</li>
              <li>Include extension versions in runbooks and IaC</li>
            </ul>
            <CodeBlock
              title="Update extension"
              language="sql"
              code={`ALTER EXTENSION vector UPDATE;
SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="Design answer: which extensions would you enable for a typical SaaS + AI search app?">
            <p>
              Baseline: rely on <code>gen_random_uuid()</code> (no uuid-ossp unless needed);{' '}
              <code>pg_trgm</code> for fuzzy admin search; <code>pg_stat_statements</code> for
              observability; <code>vector</code> if embeddings stay in-PG; PostGIS only if true geospatial;
              <code>citext</code> optional for emails. Declare them in Prisma migrations, install into a
              dedicated schema, and keep runtime roles unable to create new extensions.
            </p>
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

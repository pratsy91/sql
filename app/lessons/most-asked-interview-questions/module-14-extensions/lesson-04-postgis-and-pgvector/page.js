import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 4: PostGIS and pgvector - Module 14 - Most Asked Interview Questions',
  description:
    'Most asked PostgreSQL interview questions on PostGIS, geography vs geometry, pgvector nearest-neighbour queries, storing embeddings, dimension mismatch, IVFFlat vs HNSW, and choosing extensions for a SaaS app.',
};

export default function Module14Lesson04PostgisAndPgvector() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 4: PostGIS and pgvector</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Two extensions answer the same kind of question: &quot;what is nearest to this?&quot; PostGIS does
          it for places on a map. pgvector does it for meaning, using embeddings from an AI model. Both show
          up constantly in current interviews.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="What is PostGIS?">
            <p>
              PostGIS turns PostgreSQL into a spatial database. It adds types for points, lines, and polygons,
              hundreds of functions for measuring and comparing them, and GiST indexes so those queries stay
              fast. Typical uses are maps, delivery radius checks, &quot;stores near me&quot;, and geofencing.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>SRID</strong> means spatial reference identifier, the coordinate system. 4326 is
                ordinary GPS latitude and longitude.
              </li>
              <li>
                <code>ST_DWithin</code> asks &quot;is this within N metres&quot; and can use the index.{' '}
                <code>ST_Distance</code> measures the actual distance.
              </li>
              <li>
                Index spatial columns with <strong>GiST</strong>, not B-tree.
              </li>
              <li>
                It is a large extension with its own release cycle, so confirm your host supports it and plan
                its upgrades separately.
              </li>
            </ul>
            <CodeBlock
              title="PostGIS basics"
              language="sql"
              code={`CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE shops (
  id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  loc  GEOGRAPHY(POINT, 4326)
);

CREATE INDEX shops_loc_gix ON shops USING GIST (loc);

-- Every shop within 1000 metres of a point
SELECT name
FROM shops
WHERE ST_DWithin(loc, ST_MakePoint(-73.97, 40.77)::geography, 1000);

-- Nearest five, with real distances in metres
SELECT name,
       ST_Distance(loc, ST_MakePoint(-73.97, 40.77)::geography) AS metres
FROM shops
ORDER BY loc <-> ST_MakePoint(-73.97, 40.77)::geography
LIMIT 5;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Geography or geometry in PostGIS: what is the difference?">
            <p>
              One line: <code>geometry</code> treats coordinates as points on a flat plane and is fast, while{' '}
              <code>geography</code> treats them as points on the round earth and gives correct distances in
              metres over long spans.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Use <code>geography</code> when you have latitude and longitude and want distances in metres
                without thinking about projections. This is the right default for most applications.
              </li>
              <li>
                Use <code>geometry</code> with a suitable local projected SRID when you need speed, area
                calculations, or the many functions that only support geometry.
              </li>
              <li>
                A flat-plane calculation across continents can be wrong by a large margin, which is the
                mistake this question is checking for.
              </li>
            </ul>
            <CodeBlock
              title="Same two points, two answers"
              language="sql"
              code={`-- geography: real distance on the globe, in metres
SELECT ST_Distance(
  'POINT(-73.97 40.77)'::geography,
  'POINT(-0.12 51.50)'::geography
) AS metres;   -- about 5,570,000

-- geometry with lat/lon: the answer is in degrees, which is not a distance
SELECT ST_Distance(
  'SRID=4326;POINT(-73.97 40.77)'::geometry,
  'SRID=4326;POINT(-0.12 51.50)'::geometry
) AS degrees;  -- about 75, meaningless as a length

-- Cast when you need the other behaviour
SELECT ST_Area(loc::geometry) FROM regions;`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="Show a simple nearest-neighbour query with pgvector."
          >
            <p>
              <code>pgvector</code> adds a <code>vector</code> type that holds a list of numbers, which is what
              an AI model produces when it turns text into an <strong>embedding</strong>. Similar meanings
              produce vectors that sit close together, so &quot;find related documents&quot; becomes &quot;find
              the nearest vectors&quot;.
            </p>
            <p>Three distance operators, and they must match the index you built:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <code>&lt;=&gt;</code> cosine distance, the usual choice for text embeddings
              </li>
              <li>
                <code>&lt;-&gt;</code> L2 or Euclidean distance
              </li>
              <li>
                <code>&lt;#&gt;</code> negative inner product
              </li>
            </ul>
            <p>
              Two rules for actually getting an index scan: put the operator in <code>ORDER BY</code> rather
              than <code>WHERE</code>, and always use a <code>LIMIT</code>.
            </p>
            <CodeBlock
              title="Nearest neighbour search"
              language="sql"
              code={`CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE docs (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content   TEXT NOT NULL,
  embedding vector(1536) NOT NULL
);

CREATE INDEX docs_embedding_hnsw
  ON docs USING hnsw (embedding vector_cosine_ops);

-- The 10 closest documents, plus a similarity score for display
SELECT id, content,
       1 - (embedding <=> '[0.012, -0.031, 0.44]'::vector) AS similarity
FROM docs
ORDER BY embedding <=> '[0.012, -0.031, 0.44]'::vector
LIMIT 10;

-- Confirm the index is used, not a full scan
EXPLAIN ANALYZE
SELECT id FROM docs
ORDER BY embedding <=> '[0.012, -0.031, 0.44]'::vector
LIMIT 10;`}
            />
            <CodeBlock
              title="Nearest neighbour from Prisma"
              language="typescript"
              code={`// Prisma has no vector operator, so use parameterised raw SQL.
// Pass the embedding as a JSON-style string and cast it in SQL.
const literal = '[' + embedding.join(',') + ']';

const sql = [
  'SELECT id, content, 1 - (embedding <=> $1::vector) AS similarity',
  'FROM docs',
  'ORDER BY embedding <=> $1::vector',
  'LIMIT $2',
].join(' ');

const nearest = await prisma.$queryRawUnsafe(sql, literal, 10);`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="How do you store embeddings, and what happens on a dimension mismatch?"
          >
            <p>
              A <code>vector(1536)</code> column has a fixed width baked into the type. If you try to insert a
              768-number vector, PostgreSQL rejects it with &quot;expected 1536 dimensions, not 768&quot;. That
              is a feature: it stops you silently mixing embeddings from two different models, which would
              make every similarity score meaningless.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                The dimension comes from the model. OpenAI <code>text-embedding-3-small</code> is 1536,{' '}
                <code>text-embedding-3-large</code> is 3072, many open models are 384 or 768.
              </li>
              <li>
                <strong>Record which model produced each row.</strong> Store a <code>model</code> column, or
                keep separate tables per model. Without it you cannot tell whether existing rows are
                comparable.
              </li>
              <li>
                <strong>Changing models means re-embedding everything.</strong> You cannot convert vectors
                between models, and you cannot compare across them. Plan for a backfill: add a new column or
                table, populate it in batches, then switch reads over.
              </li>
              <li>
                Index limits matter: HNSW and IVFFlat support up to 2000 dimensions. Above that you either
                store without an index or reduce dimensions, which some models support natively.
              </li>
              <li>
                Normalise vectors if your model expects it, and stay consistent about the distance operator.
              </li>
            </ul>
            <CodeBlock
              title="Track the model, and validate before inserting"
              language="sql"
              code={`CREATE TABLE doc_embeddings (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_id     UUID NOT NULL REFERENCES docs(id) ON DELETE CASCADE,
  model      TEXT NOT NULL,
  embedding  vector(1536) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (doc_id, model)
);

-- Only search within one model's vectors
CREATE INDEX doc_embeddings_hnsw
  ON doc_embeddings USING hnsw (embedding vector_cosine_ops)
  WHERE model = 'text-embedding-3-small';

-- Wrong width fails loudly instead of corrupting your results
-- INSERT INTO doc_embeddings (doc_id, model, embedding)
-- VALUES ('...', 'other-model', '[0.1, 0.2]');
-- ERROR: expected 1536 dimensions, not 2

SELECT vector_dims(embedding) FROM doc_embeddings LIMIT 1;`}
            />
            <CodeBlock
              title="Guard the dimension in application code"
              language="prisma"
              code={`model DocEmbedding {
  id        String                      @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  docId     String                      @db.Uuid
  model     String
  embedding Unsupported("vector(1536)")

  @@unique([docId, model])
}`}
            />
            <CodeBlock
              title="Fail fast before the database does"
              language="typescript"
              code={`const EMBED_MODEL = 'text-embedding-3-small';
const EMBED_DIMS = 1536;

function toVectorLiteral(values) {
  if (values.length !== EMBED_DIMS) {
    throw new Error(
      'Embedding has ' + values.length + ' dims, expected ' + EMBED_DIMS
    );
  }
  return '[' + values.join(',') + ']';
}

await prisma.$executeRawUnsafe(
  'INSERT INTO doc_embeddings (doc_id, model, embedding) VALUES ($1, $2, $3::vector)',
  docId,
  EMBED_MODEL,
  toVectorLiteral(embedding)
);`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="What is pgvector and why is it such a hot interview topic?">
            <p>
              <code>pgvector</code> adds a <code>vector</code> type plus similarity search using L2 distance,
              inner product, or cosine distance, with IVFFlat and HNSW index types. It is what lets you build
              embedding search and RAG (retrieval augmented generation, meaning you fetch relevant documents
              and feed them to a language model) inside the database you already run.
            </p>
            <p>
              It is a hot topic because it forces an architecture opinion. Interviewers want to hear the
              trade-off, not enthusiasm.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>For keeping vectors in PostgreSQL</strong>: one datastore instead of two, no sync
                pipeline, real transactions, and you can filter by tenant, permissions, or date in the same
                query as the similarity search. That last point is the killer feature, because a separate
                vector database makes combined filtering awkward.
              </li>
              <li>
                <strong>Against</strong>: dedicated vector databases scale to billions of vectors, offer more
                index tuning, and do not compete with your transactional workload. Index builds in PostgreSQL
                are memory hungry, and large vector indexes push out your regular cache.
              </li>
              <li>
                <strong>The honest answer</strong>: start in PostgreSQL. Most products never outgrow it. Move
                only when vector count, index build time, or recall requirements actually prove you must.
              </li>
              <li>
                Approximate indexes mean <strong>recall</strong> is a tunable, not a guarantee. Some correct
                answers will be missed, and you choose how many.
              </li>
            </ul>
            <CodeBlock
              title="Filtered vector search, the thing PostgreSQL does well"
              language="sql"
              code={`-- Combine tenant isolation, a date window, and similarity in one query
SELECT d.id, d.content, d.embedding <=> $1::vector AS distance
FROM docs d
WHERE d.tenant_id = $2
  AND d.created_at >= now() - interval '90 days'
  AND d.deleted_at IS NULL
ORDER BY d.embedding <=> $1::vector
LIMIT 10;

-- Partial index so the filter and the index agree
CREATE INDEX docs_active_hnsw
  ON docs USING hnsw (embedding vector_cosine_ops)
  WHERE deleted_at IS NULL;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="IVFFlat vs HNSW for pgvector: what do you say?">
            <p>
              Both are approximate nearest-neighbour indexes, so both trade some accuracy for speed. They
              differ in how they organise the vectors and therefore in what they cost.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>IVFFlat</strong> groups vectors into <code>lists</code> of clusters and searches only
                the nearest few. It builds quickly and uses little memory, but it must be built on data that is
                already present, because the clusters are learned from it. Add many new vectors and quality
                drifts until you rebuild.
              </li>
              <li>
                <strong>HNSW</strong> builds a layered graph you can walk from coarse to fine. It usually gives
                better recall at the same latency and handles inserts gracefully with no rebuild, at the cost
                of slower builds and much more memory.
              </li>
            </ul>
            <p>The tuning knobs, which a senior candidate should be able to name:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                IVFFlat: <code>lists</code> at build time, roughly rows divided by 1000 for up to a million
                rows, and <code>ivfflat.probes</code> at query time. More probes means better recall and more
                time.
              </li>
              <li>
                HNSW: <code>m</code> and <code>ef_construction</code> at build time,{' '}
                <code>hnsw.ef_search</code> at query time.
              </li>
            </ul>
            <p>
              Default recommendation: HNSW, unless build time or memory rules it out, or the table is small
              enough that index choice barely matters. Then say the real answer, which is that you benchmark
              with your own dimensionality, row count, and concurrency, and measure recall against an exact
              scan rather than trusting defaults.
            </p>
            <CodeBlock
              title="Building and tuning both"
              language="sql"
              code={`-- HNSW: better recall, slower build, more memory
CREATE INDEX docs_hnsw ON docs
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

SET hnsw.ef_search = 100;    -- raise for better recall per query

-- IVFFlat: fast build, low memory, needs data present first
CREATE INDEX docs_ivf ON docs
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 1000);

SET ivfflat.probes = 10;     -- raise for better recall per query

-- Speed up a large build
SET maintenance_work_mem = '4GB';
SET max_parallel_maintenance_workers = 4;

-- Measure recall: compare approximate results against an exact scan
SET enable_indexscan = off;  -- forces the exact answer for comparison`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Senior"
            question="Design answer: which extensions would you enable for a typical SaaS plus AI search app?"
          >
            <p>
              Answer this as a short list with a reason for each, and say no to the ones you do not need. The
              discipline is the signal.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>No extension for UUIDs.</strong> <code>gen_random_uuid()</code> is core since
                PostgreSQL 13, so skip <code>uuid-ossp</code> unless you need v1 or v5.
              </li>
              <li>
                <code>pg_stat_statements</code>: query-level statistics. The first thing you want when
                something is slow. Needs <code>shared_preload_libraries</code> and a restart, so enable it on
                day one.
              </li>
              <li>
                <code>pg_trgm</code>: fuzzy admin and customer lookup, plus typo-tolerant search.
              </li>
              <li>
                <code>vector</code>: only if embeddings stay in PostgreSQL. Confirm your host offers a recent
                enough version for HNSW.
              </li>
              <li>
                <code>unaccent</code>: cheap, and it fixes real user complaints about accented names.
              </li>
              <li>
                <code>pgcrypto</code>: random tokens and checksums. Not for password hashing, which belongs in
                the app.
              </li>
              <li>
                <code>citext</code>: optional. A unique index on <code>lower(email)</code> achieves the same
                thing with no extension.
              </li>
              <li>
                <strong>PostGIS: only for genuine geospatial work.</strong> It is a heavy dependency with its
                own upgrade story. A simple distance filter does not justify it.
              </li>
              <li>
                <strong>Skip</strong> <code>hstore</code> in favour of JSONB.
              </li>
            </ul>
            <p>Then cover the operational half, which is what separates a senior answer:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Create every extension in a migration, so a fresh database bootstraps itself.</li>
              <li>
                Install into a dedicated <code>extensions</code> schema and keep <code>public</code> locked
                down.
              </li>
              <li>The runtime application role must not be able to create extensions.</li>
              <li>Pin versions in infrastructure as code and include them in upgrade runbooks.</li>
            </ul>
            <CodeBlock
              title="Baseline bootstrap migration"
              language="sql"
              code={`-- prisma/migrations/20260101000000_extensions/migration.sql
CREATE SCHEMA IF NOT EXISTS extensions;

CREATE EXTENSION IF NOT EXISTS pg_trgm   WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS unaccent  WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto  WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS vector    WITH SCHEMA extensions;

-- Needs shared_preload_libraries plus a restart first
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

ALTER DATABASE saas SET search_path TO public, extensions;`}
            />
            <CodeBlock
              title="Declared in the Prisma schema"
              language="prisma"
              code={`datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [
    pg_trgm(schema: "extensions"),
    unaccent(schema: "extensions"),
    pgcrypto(schema: "extensions"),
    vector(schema: "extensions")
  ]
}`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

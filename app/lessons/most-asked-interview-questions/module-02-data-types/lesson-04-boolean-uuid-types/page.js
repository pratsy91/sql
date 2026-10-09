import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 4: Boolean and UUID Types - Module 2 - Most Asked Interview Questions',
  description:
    'Most asked interview questions on BOOLEAN and UUID in PostgreSQL — three-valued logic with NULL, gen_random_uuid, UUID v4 vs v7, UUID vs BIGINT keys, and index size cost',
};

export default function MaiqM02L04BooleanUuidTypes() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 4: Boolean and UUID Types</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Two small types with big interview follow-ups: how NULL breaks boolean logic, and what UUID keys really cost.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="What are BOOLEAN and UUID types used for?">
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>BOOLEAN:</strong> <code>true</code> / <code>false</code> / <code>NULL</code> — flags like <code>is_active</code></li>
              <li><strong>UUID:</strong> 128-bit unique identifier — good for distributed IDs and public-facing keys</li>
              <li>Generate with <code>gen_random_uuid()</code> (pgcrypto / built-in in modern PG) or app-side UUIDv4/v7</li>
            </ul>
            <CodeBlock
              title="BOOLEAN and UUID"
              language="sql"
              code={`CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT UNIQUE NOT NULL,
  is_active  BOOLEAN NOT NULL DEFAULT true
);`}
            />
            <p>
              A UUID column takes 16 bytes because Postgres stores it as a real 128-bit value, not as the 36-character text form. Storing UUIDs in a
              <code> TEXT</code> column instead is a common mistake: it more than doubles the size and makes comparison slower.
            </p>
          </InterviewQACard>

          <InterviewQACard level="Junior" question="What is three-valued logic, and how does a NULL boolean behave?">
            <p>
              SQL has three truth values, not two: true, false, and unknown. A NULL boolean means &quot;we do not know&quot;, and any comparison with NULL
              produces unknown. A <code>WHERE</code> clause keeps a row only when the result is true, so unknown rows are dropped.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><code>NULL = NULL</code> is not true. Use <code>IS NULL</code> and <code>IS NOT NULL</code></li>
              <li><code>WHERE is_active = false</code> silently skips rows where <code>is_active</code> is NULL. This is the bug interviewers are testing for</li>
              <li><code>NOT NULL</code> is still unknown, so <code>WHERE NOT is_active</code> also drops those rows</li>
              <li><code>true OR NULL</code> is true, and <code>false AND NULL</code> is false, because the answer is already decided. The others stay unknown</li>
              <li>Use <code>IS TRUE</code>, <code>IS NOT TRUE</code>, <code>IS DISTINCT FROM</code>, or <code>coalesce()</code> when you want NULL treated as a value</li>
              <li>The clean fix is to declare flags as <code>BOOLEAN NOT NULL DEFAULT false</code> so the third state never exists</li>
            </ul>
            <CodeBlock
              title="NULL boolean pitfalls"
              language="sql"
              code={`SELECT NULL = NULL          AS eq,        -- NULL (unknown)
       NULL IS NULL         AS is_null,   -- true
       true OR NULL         AS t_or_null, -- true
       false AND NULL       AS f_and_null,-- false
       (NULL::boolean) IS NOT TRUE AS not_true; -- true

-- Misses rows where is_active IS NULL
SELECT count(*) FROM users WHERE is_active = false;

-- Includes them
SELECT count(*) FROM users WHERE is_active IS NOT TRUE;
SELECT count(*) FROM users WHERE coalesce(is_active, false) = false;

-- Safer design
ALTER TABLE users ALTER COLUMN is_active SET NOT NULL;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="How do you choose between UUID and BIGINT primary keys?">
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>BIGINT IDENTITY/SERIAL:</strong> compact, sequential, great B-tree locality, simple</li>
              <li><strong>UUID:</strong> merge-friendly across services, opaque public IDs, no sequence coordination</li>
              <li>Random UUIDv4 can cause index fragmentation; UUIDv7 / time-ordered IDs help</li>
              <li>Common pattern: internal BIGINT + public UUID, or UUID PK with care for index size</li>
              <li>UUIDs also let the client generate the id before the insert, which makes offline-first apps and bulk imports easier</li>
            </ul>
            <CodeBlock
              title="Internal BIGINT plus public UUID"
              language="sql"
              code={`CREATE TABLE orders (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, -- joins, foreign keys
  public_id  UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,  -- URLs and APIs
  total      NUMERIC(12, 2) NOT NULL
);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What is the difference between gen_random_uuid(), UUID v4, and UUID v7?">
            <p>
              <code>gen_random_uuid()</code> is the Postgres function that produces a version 4 UUID, which is completely random.
              Version 7 is a newer format whose first bits are a millisecond timestamp, so the values sort roughly in creation order.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>gen_random_uuid():</strong> needed the <code>pgcrypto</code> extension before Postgres 13, and is built in from 13 onward</li>
              <li><strong>v4:</strong> 122 random bits. Unguessable and safe for public URLs, but the random order scatters index inserts</li>
              <li><strong>v7:</strong> time-ordered, so new rows land at the right-hand edge of the B-tree like a sequence does. Much better cache behaviour and less index bloat</li>
              <li>Postgres 18 adds a built-in <code>uuidv7()</code>. On older versions you generate v7 in the app, or add a small SQL function</li>
              <li>The old <code>uuid-ossp</code> extension gives <code>uuid_generate_v4()</code>. It is the legacy option; prefer the built-in function</li>
              <li>One trade-off worth mentioning: v7 leaks the creation time, so it is not suitable when the id must reveal nothing</li>
            </ul>
            <CodeBlock
              title="Generating UUIDs"
              language="sql"
              code={`-- Built in from PG 13
SELECT gen_random_uuid();

-- PG 18
-- SELECT uuidv7();

-- Legacy extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
SELECT uuid_generate_v4();`}
            />
            <CodeBlock
              title="Prisma with a UUID key"
              language="typescript"
              code={`model User {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email     String   @unique
  createdAt DateTime @default(now()) @db.Timestamptz(6)
}

// Prisma 5.14+ also supports @default(uuid(7)) for time-ordered ids`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="What is the real index and storage cost of using UUID primary keys?">
            <p>
              The cost is not just the 16 bytes versus 8. It is that a random key touches a different part of the index on every insert, so the working set
              stops fitting in memory and pages get dirtied everywhere.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Size:</strong> 16 bytes instead of 8 in the table, plus the same extra in every index and every foreign key column that references it. On a table with several indexes, the difference compounds</li>
              <li><strong>Insert locality:</strong> a BIGINT sequence always appends to the rightmost index page, which stays in cache. A random UUID hits a random leaf page, so Postgres must read that page from disk first</li>
              <li><strong>Page splits and bloat:</strong> random inserts split pages in the middle, leaving them half full. Index size can end up noticeably larger than the equivalent BIGINT index</li>
              <li><strong>WAL volume:</strong> more pages touched means more full-page writes after each checkpoint, which means more WAL, slower replication, and bigger backups</li>
              <li><strong>Range scans:</strong> &quot;the newest 100 rows&quot; is a cheap range scan on a sequential key. On a v4 UUID key it is not, so you need a separate index on <code>created_at</code></li>
              <li><strong>Mitigations:</strong> use time-ordered UUID v7, or keep an internal BIGINT key for joins and expose a UUID only in URLs. Never store the UUID as TEXT, and do not add <code>fillfactor</code> tuning before you have measured</li>
              <li>Honest framing for an interview: for a table with a few million rows none of this matters. At hundreds of millions of rows it clearly does</li>
            </ul>
            <CodeBlock
              title="Measure it rather than guess"
              language="sql"
              code={`SELECT relname,
       pg_size_pretty(pg_relation_size(oid))       AS table_size,
       pg_size_pretty(pg_indexes_size(oid))        AS indexes_size,
       pg_size_pretty(pg_total_relation_size(oid)) AS total
FROM pg_class
WHERE relkind = 'r' AND relnamespace = 'public'::regnamespace
ORDER BY pg_total_relation_size(oid) DESC
LIMIT 10;

-- Index bloat and usage
SELECT indexrelname, idx_scan, pg_size_pretty(pg_relation_size(indexrelid))
FROM pg_stat_user_indexes
ORDER BY pg_relation_size(indexrelid) DESC
LIMIT 10;`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 5: UUID Type - Module 2 - Most Asked Interview Questions',
  description:
    'Most asked interview questions on PostgreSQL UUID — storage, gen_random_uuid, UUID v4 vs v7, UUID vs BIGINT keys, and index size cost',
};

export default function MaiqM02L05UuidType() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 5: UUID Type</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          UUIDs are asked constantly: how they are stored, how you generate them, and whether they should be your primary key.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="What is a UUID, and how does PostgreSQL store it?">
            <p>
              A UUID is a 128-bit unique identifier. Postgres has a real <code>UUID</code> type for it. Store UUIDs in that type, never as <code>TEXT</code>.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>The native type is 16 bytes. The dashed string form is 36 characters and is only for display</li>
              <li>Storing UUIDs in a <code>TEXT</code> column more than doubles the size and makes comparison slower. This is a common mistake</li>
              <li>Use them for distributed IDs, public URLs, and ids that must be unique across services without a shared sequence</li>
              <li>Generate with <code>gen_random_uuid()</code>, or in the app as UUIDv4 / UUIDv7</li>
            </ul>
            <CodeBlock
              title="UUID column"
              language="sql"
              code={`CREATE TABLE users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT UNIQUE NOT NULL
);

-- Cast from the dashed string
SELECT '550e8400-e29b-41d4-a716-446655440000'::uuid;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="How do you generate a UUID in PostgreSQL?">
            <p>
              On modern Postgres, call <code>gen_random_uuid()</code>. It is built in from version 13. Older answers mention extensions. Know both.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Before Postgres 13 you needed <code>CREATE EXTENSION pgcrypto</code> for <code>gen_random_uuid()</code></li>
              <li>The legacy <code>uuid-ossp</code> extension gives <code>uuid_generate_v4()</code>. Prefer the built-in function on new databases</li>
              <li>You can also generate the UUID in the application and insert it. That is useful when the client needs the id before the row exists</li>
            </ul>
            <CodeBlock
              title="Generating UUIDs"
              language="sql"
              code={`SELECT gen_random_uuid();

-- Legacy extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
SELECT uuid_generate_v4();`}
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
              title="v4 vs v7"
              language="sql"
              code={`-- Built in from PG 13 (v4)
SELECT gen_random_uuid();

-- PG 18 (time-ordered)
-- SELECT uuidv7();`}
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

          <InterviewQACard level="Mid" question="Can a UUID column be a foreign key? What about Prisma?">
            <p>
              Yes. A foreign key just needs the same type on both sides. UUID to UUID works the same as BIGINT to BIGINT.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Every FK column copies the 16 bytes, so the size cost shows up on every child table, not only the parent</li>
              <li>In Prisma, map with <code>String @db.Uuid</code> and <code>@default(uuid())</code> or <code>dbgenerated(&quot;gen_random_uuid()&quot;)</code></li>
              <li><code>@default(uuid())</code> generates the value in Prisma, not in the database. That is fine until a raw SQL insert needs a default too</li>
            </ul>
            <CodeBlock
              title="UUID foreign key"
              language="sql"
              code={`CREATE TABLE orders (
  id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id)
);

CREATE INDEX orders_user_id_idx ON orders (user_id);`}
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

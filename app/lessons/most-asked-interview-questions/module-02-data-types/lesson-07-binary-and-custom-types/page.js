import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 7: Binary and Custom Types - Module 2 - Most Asked Interview Questions',
  description:
    'Most asked interview questions on BYTEA, files in the database vs object storage, DOMAIN and composite and range types, GENERATED columns, Prisma type mapping, and type pitfalls',
};

export default function MaiqM02L07BinaryAndCustomTypes() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 7: Binary and Custom Types</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Binary data, your own types, computed columns, and the type mistakes that show up most often in real systems.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="How do Prisma scalar types map to PostgreSQL types?">
            <ul className="list-disc pl-6 space-y-1">
              <li><code>String</code> maps to TEXT (or VARCHAR with <code>@db.VarChar(n)</code>)</li>
              <li><code>Int</code> maps to INTEGER; <code>BigInt</code> maps to BIGINT</li>
              <li><code>Decimal</code> maps to DECIMAL/NUMERIC; <code>Float</code> maps to DOUBLE PRECISION</li>
              <li><code>Boolean</code> maps to BOOLEAN; <code>DateTime</code> maps to TIMESTAMP(3), or TIMESTAMPTZ with attributes</li>
              <li><code>Json</code> maps to JSONB; <code>Bytes</code> maps to BYTEA; use <code>String</code> with <code>@db.Uuid</code> for UUID</li>
              <li>Native attributes like <code>@db.Timestamptz(6)</code> matter. Without one, Prisma picks TIMESTAMP(3) with no zone, which is rarely what you want</li>
            </ul>
            <CodeBlock
              title="Prisma type mapping"
              language="typescript"
              code={`model Product {
  id        String   @id @default(uuid()) @db.Uuid
  name      String
  sku       String   @db.VarChar(64)
  price     Decimal  @db.Decimal(12, 2)
  stock     Int
  meta      Json?
  avatar    Bytes?
  createdAt DateTime @default(now()) @db.Timestamptz(6)
}`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="What is BYTEA and when do you store binary in Postgres?">
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>BYTEA:</strong> Variable-length binary string</li>
              <li>OK for small blobs (avatars thumbnails, encrypted tokens)</li>
              <li>Large files usually belong in object storage (S3); store URL/key in Postgres</li>
              <li>Prisma maps this to <code>Bytes</code></li>
              <li>Postgres also has a separate large object system with an <code>oid</code> and streaming functions, but it is legacy for most apps and is not backed up with a plain table dump the same way</li>
              <li>The default output format is hex, so a 1 MB file becomes about 2 MB of text over the wire unless the driver uses the binary protocol</li>
            </ul>
            <CodeBlock
              title="BYTEA basics"
              language="sql"
              code={`CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- for digest()

CREATE TABLE attachments (
  id       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  filename TEXT NOT NULL,
  content  BYTEA NOT NULL,
  sha256   BYTEA GENERATED ALWAYS AS (digest(content, 'sha256')) STORED
);

SELECT filename,
       length(content)               AS bytes,
       pg_size_pretty(length(content)::bigint) AS pretty,
       encode(sha256, 'hex')         AS checksum
FROM attachments;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Should you store files in the database or in object storage?">
            <p>
              For anything more than small thumbnails, use object storage such as S3, Google Cloud Storage, or Azure Blob, and keep only the key and the
              metadata in Postgres. Interviewers ask this to hear you weigh transactions against cost and operations.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Why the database is tempting:</strong> one backup, one transaction, permissions already work, and no orphaned files. If a transaction rolls back, the file goes away with it</li>
              <li><strong>Why object storage usually wins:</strong> storage is far cheaper per gigabyte, you can serve files through a CDN, uploads and downloads bypass the database entirely, and your backups stay small and fast to restore</li>
              <li><strong>The hidden costs of blobs in Postgres:</strong> large values live in TOAST, every update rewrites the row, WAL grows with every write, and a 500 GB database takes far longer to restore than a 5 GB one</li>
              <li><strong>Rough guidance:</strong> a few kilobytes is fine in BYTEA, a few hundred kilobytes is a judgement call, and megabytes belong outside</li>
              <li><strong>The orphan problem:</strong> object storage has no transactions, so you need a plan. Insert the row first with a pending state, upload, then mark it ready, and run a sweeper for rows that never completed</li>
              <li><strong>When keeping it in the database is right:</strong> small encrypted secrets, generated PDFs you must be able to reproduce exactly for audit, or a regulated environment where the file must never leave the database boundary</li>
              <li>Use presigned URLs so the browser uploads straight to storage and your server never holds the bytes</li>
            </ul>
            <CodeBlock
              title="Metadata in Postgres, bytes in storage"
              language="sql"
              code={`CREATE TABLE documents (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  owner_id     BIGINT NOT NULL REFERENCES users (id),
  storage_key  TEXT NOT NULL UNIQUE,      -- e.g. docs/2026/03/invoice-7.pdf
  bucket       TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size_bytes   BIGINT NOT NULL CHECK (size_bytes > 0),
  checksum     TEXT,
  status       TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'ready', 'deleted')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sweep uploads that never finished
DELETE FROM documents
WHERE status = 'pending' AND created_at < now() - INTERVAL '1 day';`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="What are GENERATED columns (PG 12+) and when are they asked about?">
            <ul className="list-disc pl-6 space-y-1">
              <li><code>GENERATED ALWAYS AS (...) STORED</code> computes a column and persists it</li>
              <li>Useful for derived searchable fields from JSONB or normalized expressions</li>
              <li>Cannot be directly overwritten; updated when base columns change</li>
              <li>Often preferred over triggers for simple derivations</li>
              <li>The expression must be immutable, so <code>now()</code> and anything that reads another table are not allowed</li>
              <li>Postgres 18 adds virtual generated columns, computed at read time. Before that, only STORED exists in Postgres</li>
              <li>A very common real use is a stored <code>tsvector</code> for full-text search, which replaces the old trigger-maintained column</li>
            </ul>
            <CodeBlock
              title="GENERATED ALWAYS AS STORED"
              language="sql"
              code={`CREATE TABLE users (
  id         BIGSERIAL PRIMARY KEY,
  email      TEXT NOT NULL,
  email_lower TEXT GENERATED ALWAYS AS (lower(email)) STORED
);

CREATE UNIQUE INDEX users_email_lower_uidx ON users (email_lower);`}
            />
            <CodeBlock
              title="Generated search vector"
              language="sql"
              code={`CREATE TABLE articles (
  id     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title  TEXT NOT NULL,
  body   TEXT NOT NULL,
  search tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(body, ''))
  ) STORED
);

CREATE INDEX articles_search_idx ON articles USING GIN (search);
SELECT id, title FROM articles WHERE search @@ websearch_to_tsquery('english', 'postgres index');`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="How do domain types and custom types help data integrity?">
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>DOMAIN:</strong> base type + optional CHECK — reusable across tables (e.g. positive money)</li>
              <li>Centralizes validation vs repeating CHECK constraints</li>
              <li>Custom composite / range types appear in advanced designs (scheduling, IP ranges)</li>
              <li>A domain can also carry <code>NOT NULL</code> and a <code>DEFAULT</code>, so one definition covers several rules</li>
              <li>Changing a domain constraint later validates every table that uses it, which is powerful but locks those tables, so plan it like any other migration</li>
            </ul>
            <CodeBlock
              title="DOMAIN example"
              language="sql"
              code={`CREATE DOMAIN email_address AS TEXT
  CHECK (VALUE ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$');

CREATE TABLE contacts (
  id    BIGSERIAL PRIMARY KEY,
  email email_address NOT NULL
);`}
            />
            <CodeBlock
              title="Reusable money domain"
              language="sql"
              code={`CREATE DOMAIN positive_money AS NUMERIC(12, 2)
  NOT NULL
  CHECK (VALUE > 0);

CREATE TABLE invoices (
  id     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  amount positive_money,
  tax    positive_money
);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="What are composite types and range types, briefly?">
            <p>
              A composite type is a named group of fields, like a small record. A range type stores a from-and-to pair as one value and knows how to test
              overlap. Ranges are the one advanced type that regularly solves a real interview problem: double-booking.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Composite type:</strong> created with <code>CREATE TYPE ... AS (...)</code>. Every table also gets a composite type of its own row, which is why <code>SELECT t FROM t</code> works</li>
              <li>Composites are most useful as function arguments and return values. As column types they are awkward, because you cannot index or constrain individual fields easily</li>
              <li><strong>Built-in ranges:</strong> <code>int4range</code>, <code>numrange</code>, <code>daterange</code>, <code>tsrange</code>, and <code>tstzrange</code></li>
              <li>Bounds are written like maths: <code>[)</code> means include the start and exclude the end. That half-open style is what you want for time slots, because back-to-back bookings do not clash</li>
              <li><strong>The killer feature</strong> is an exclusion constraint with a GiST index, which lets the database refuse overlapping bookings for the same room. Doing this in application code always has a race condition</li>
              <li>Postgres 14 added multiranges, which hold several disjoint ranges in one value, handy for availability calendars</li>
              <li>Prisma has no native mapping for these, so you define them in raw SQL migrations and query them with <code>$queryRawUnsafe</code></li>
            </ul>
            <CodeBlock
              title="No double bookings, enforced by the database"
              language="sql"
              code={`CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE bookings (
  id      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  room_id BIGINT NOT NULL,
  during  TSTZRANGE NOT NULL,
  EXCLUDE USING GIST (room_id WITH =, during WITH &&)
);

INSERT INTO bookings (room_id, during)
VALUES (1, tstzrange('2026-03-15 09:00+05:30', '2026-03-15 10:00+05:30', '[)'));

-- This one is rejected: it overlaps the same room
-- INSERT INTO bookings (room_id, during)
-- VALUES (1, tstzrange('2026-03-15 09:30+05:30', '2026-03-15 10:30+05:30', '[)'));

-- Back-to-back is fine because the upper bound is exclusive
INSERT INTO bookings (room_id, during)
VALUES (1, tstzrange('2026-03-15 10:00+05:30', '2026-03-15 11:00+05:30', '[)'));

SELECT id, lower(during) AS starts, upper(during) AS ends
FROM bookings
WHERE during && tstzrange(now(), now() + INTERVAL '1 day');`}
            />
            <CodeBlock
              title="Composite type in a function"
              language="sql"
              code={`CREATE TYPE money_split AS (
  net NUMERIC(12, 2),
  tax NUMERIC(12, 2)
);

CREATE FUNCTION split_total(total NUMERIC, rate NUMERIC)
RETURNS money_split
LANGUAGE sql IMMUTABLE AS
'SELECT (total / (1 + rate))::numeric(12,2),
        (total - total / (1 + rate))::numeric(12,2)';

SELECT (split_total(118.00, 0.18)).*;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="What type pitfalls show up most often in production interviews?">
            <ul className="list-disc pl-6 space-y-1">
              <li>Using <code>FLOAT</code> for money, which causes rounding bugs. Use <code>NUMERIC</code></li>
              <li>Storing local times in <code>TIMESTAMP</code> without documenting the timezone, which causes daylight saving bugs</li>
              <li>Overusing JSONB for core relational fields, which leaves you with weak constraints and harder reporting</li>
              <li>VARCHAR vs TEXT micro-optimizations that do not matter in Postgres</li>
              <li>Ignoring collation and Unicode normalization for unique emails and usernames</li>
              <li>Picking <code>SERIAL</code> (INTEGER) for a high-volume table and hitting the 2.1 billion limit later</li>
              <li>Storing a UUID in a TEXT column, which doubles the size and slows every comparison</li>
              <li>Leaving flag columns nullable, so <code>WHERE flag = false</code> quietly skips rows</li>
              <li>Comparing a bare column to a value of a different type and losing the index because of an implicit cast</li>
            </ul>
            <CodeBlock
              title="The implicit cast trap"
              language="sql"
              code={`-- If user_id is BIGINT, passing text can defeat the index
EXPLAIN SELECT * FROM orders WHERE user_id = '42';       -- usually fine, literal is cast
EXPLAIN SELECT * FROM orders WHERE user_id::text = '42'; -- index unusable

-- Wrapping the column in a function always needs a matching expression index
CREATE INDEX orders_user_text_idx ON orders ((user_id::text));`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

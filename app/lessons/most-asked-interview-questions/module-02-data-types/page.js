import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';
import InterviewQACard from '../../../components/InterviewQACard';

export const metadata = {
  title: 'Module 2: Data Types - Most Asked Interview Questions',
  description:
    'Most asked interview questions on PostgreSQL data types covering junior to senior — text, numeric, timestamps, JSONB, UUID, arrays, ENUM, BYTEA, and Prisma mappings',
};

export default function Module2DataTypes() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Module 2: Data Types</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Most asked interview questions for Phase 2 — Junior → Senior. Includes PostgreSQL (latest) and Prisma where relevant.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="What is the difference between VARCHAR, TEXT, and CHAR?">
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>TEXT:</strong> Variable length, no practical length limit — preferred default in PostgreSQL</li>
              <li><strong>VARCHAR(n):</strong> Variable length with optional max <code>n</code>; same storage as TEXT under the hood</li>
              <li><strong>CHAR(n):</strong> Fixed length, blank-padded — rarely useful in Postgres; avoid for most app data</li>
              <li>Unlike some other DBs, VARCHAR and TEXT perform the same in PostgreSQL</li>
            </ul>
            <CodeBlock
              title="String types"
              language="sql"
              code={`CREATE TABLE profiles (
  username VARCHAR(50) NOT NULL,  -- enforce max length
  bio      TEXT,                  -- unlimited notes
  code     CHAR(3)                -- e.g. ISO country — still usually VARCHAR is clearer
);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="When do you use INT vs BIGINT vs NUMERIC/DECIMAL?">
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>INT / INTEGER:</strong> 4-byte; ~±2.1 billion — good for most IDs and counts</li>
              <li><strong>BIGINT:</strong> 8-byte; huge ranges — snowflake IDs, large counters, high-volume PKs</li>
              <li><strong>NUMERIC / DECIMAL:</strong> Exact precision — money, percentages, scientific values that must not drift</li>
              <li><strong>REAL / DOUBLE PRECISION:</strong> Approximate floats — analytics, never currency</li>
            </ul>
            <CodeBlock
              title="Numeric choices"
              language="sql"
              code={`CREATE TABLE products (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  stock      INT NOT NULL DEFAULT 0,
  price      NUMERIC(12, 2) NOT NULL,  -- exact money
  rating_avg DOUBLE PRECISION          -- approximate OK
);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="What is the difference between TIMESTAMP and TIMESTAMPTZ?">
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>TIMESTAMP:</strong> Date/time without time zone — ambiguous across regions</li>
              <li><strong>TIMESTAMPTZ:</strong> Stored in UTC internally; converted on input/output using session TimeZone</li>
              <li>Interview best practice: prefer <code>TIMESTAMPTZ</code> for event times (“when did this happen?”)</li>
              <li>Use plain <code>TIMESTAMP</code> or <code>DATE</code> for “wall clock” concepts that must not shift (local appointment slots)</li>
            </ul>
            <CodeBlock
              title="Timestamps"
              language="sql"
              code={`SHOW TIME ZONE;
SELECT now();                              -- timestamptz
SELECT now() AT TIME ZONE 'Asia/Kolkata'; -- timestamp in that zone

CREATE TABLE events (
  id         BIGSERIAL PRIMARY KEY,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);`}
            />
          </InterviewQACard>

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
          </InterviewQACard>

          <InterviewQACard level="Junior" question="How do Prisma scalar types map to PostgreSQL types?">
            <ul className="list-disc pl-6 space-y-1">
              <li><code>String</code> → TEXT (or VARCHAR with <code>@db.VarChar(n)</code>)</li>
              <li><code>Int</code> → INTEGER; <code>BigInt</code> → BIGINT</li>
              <li><code>Decimal</code> → DECIMAL/NUMERIC; <code>Float</code> → DOUBLE PRECISION</li>
              <li><code>Boolean</code> → BOOLEAN; <code>DateTime</code> → TIMESTAMP(3) / TIMESTAMPTZ with attrs</li>
              <li><code>Json</code> → JSONB; <code>Bytes</code> → BYTEA; <code>Bytes</code>/<code>String</code> + <code>@db.Uuid</code> for UUID</li>
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

          <InterviewQACard level="Mid" question="JSON vs JSONB — which should you use and why? (very common)">
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>JSON:</strong> Stores exact text input; preserves whitespace/key order; slower to query</li>
              <li><strong>JSONB:</strong> Binary, decomposed storage; supports indexing (GIN); preferred for almost all apps</li>
              <li>JSONB does not preserve duplicate keys or insignificant whitespace</li>
              <li>Use operators: <code>-&gt;</code>, <code>-&gt;&gt;</code>, <code>@&gt;</code>, <code>? </code>, <code>JSONB_PATH_EXISTS</code>, etc.</li>
            </ul>
            <CodeBlock
              title="JSONB query and index"
              language="sql"
              code={`CREATE TABLE orders (
  id   BIGSERIAL PRIMARY KEY,
  data JSONB NOT NULL
);

CREATE INDEX orders_data_gin ON orders USING GIN (data);

-- Containment (uses GIN well)
SELECT * FROM orders WHERE data @> '{"status":"paid"}';

-- Extract fields
SELECT data->>'customer_id' AS customer_id,
       (data->'total')::numeric AS total
FROM orders;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="When would you use arrays in PostgreSQL?">
            <ul className="list-disc pl-6 space-y-1">
              <li>Small, ordered collections owned by the row (tags, roles) when you do not need to join as entities</li>
              <li>Operators: <code>ANY</code>, <code>ALL</code>, <code>@&gt;</code>, <code>&&</code> (overlap)</li>
              <li>GIN indexes help containment queries</li>
              <li>Prefer a junction table when the list is large, relational, or needs its own metadata</li>
            </ul>
            <CodeBlock
              title="Array column"
              language="sql"
              code={`CREATE TABLE posts (
  id   BIGSERIAL PRIMARY KEY,
  tags TEXT[] NOT NULL DEFAULT '{}'
);

CREATE INDEX posts_tags_gin ON posts USING GIN (tags);

SELECT * FROM posts WHERE tags @> ARRAY['postgres'];
SELECT * FROM posts WHERE 'sql' = ANY (tags);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What are ENUM types, and what are the trade-offs?">
            <ul className="list-disc pl-6 space-y-1">
              <li>Enums are custom types with a fixed set of labels — strong validation at the DB layer</li>
              <li>Pros: readable, compact storage, check without a separate CHECK list</li>
              <li>Cons: adding/renaming values needs <code>ALTER TYPE</code>; removing values is painful; migrations can be awkward</li>
              <li>Alternative: <code>TEXT</code> + <code>CHECK</code>, or a lookup table for frequently changing sets</li>
            </ul>
            <CodeBlock
              title="ENUM example"
              language="sql"
              code={`CREATE TYPE order_status AS ENUM ('pending', 'paid', 'shipped', 'cancelled');

CREATE TABLE orders (
  id     BIGSERIAL PRIMARY KEY,
  status order_status NOT NULL DEFAULT 'pending'
);

-- PG 10+: ADD VALUE is transactional in recent versions with care
ALTER TYPE order_status ADD VALUE 'refunded';`}
            />
            <CodeBlock
              title="Prisma enum"
              language="typescript"
              code={`enum OrderStatus {
  pending
  paid
  shipped
  cancelled
}

model Order {
  id     Int         @id @default(autoincrement())
  status OrderStatus @default(pending)
}`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What is BYTEA and when do you store binary in Postgres?">
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>BYTEA:</strong> Variable-length binary string</li>
              <li>OK for small blobs (avatars thumbnails, encrypted tokens)</li>
              <li>Large files usually belong in object storage (S3); store URL/key in Postgres</li>
              <li>Prisma maps this to <code>Bytes</code></li>
            </ul>
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How do you choose between UUID and BIGINT primary keys?">
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>BIGINT IDENTITY/SERIAL:</strong> compact, sequential, great B-tree locality, simple</li>
              <li><strong>UUID:</strong> merge-friendly across services, opaque public IDs, no sequence coordination</li>
              <li>Random UUIDv4 can cause index fragmentation; UUIDv7 / time-ordered IDs help</li>
              <li>Common pattern: internal BIGINT + public UUID, or UUID PK with care for index size</li>
            </ul>
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="How do you index JSONB effectively for production workloads?">
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>GIN</strong> default <code>jsonb_ops</code>: containment (<code>@&gt;</code>), existence; larger indexes</li>
              <li><strong>GIN jsonb_path_ops</strong>: smaller/faster for containment-only workloads</li>
              <li>Expression/btree indexes on hot extracted paths: <code>((data-&gt;&gt;&apos;status&apos;))</code></li>
              <li>Do not dump everything into one giant JSONB document if you need relational integrity and frequent filters</li>
            </ul>
            <CodeBlock
              title="JSONB indexing patterns"
              language="sql"
              code={`CREATE INDEX orders_data_path_ops
  ON orders USING GIN (data jsonb_path_ops);

CREATE INDEX orders_status_btree
  ON orders ((data->>'status'));

SELECT * FROM orders WHERE data->>'status' = 'paid';`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="What are GENERATED columns (PG 12+) and when are they asked about?">
            <ul className="list-disc pl-6 space-y-1">
              <li><code>GENERATED ALWAYS AS (...) STORED</code> computes a column and persists it</li>
              <li>Useful for derived searchable fields from JSONB or normalized expressions</li>
              <li>Cannot be directly overwritten; updated when base columns change</li>
              <li>Often preferred over triggers for simple derivations</li>
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
          </InterviewQACard>

          <InterviewQACard level="Senior" question="How do domain types and custom types help data integrity?">
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>DOMAIN:</strong> base type + optional CHECK — reusable across tables (e.g. positive money)</li>
              <li>Centralizes validation vs repeating CHECK constraints</li>
              <li>Custom composite / range types appear in advanced designs (scheduling, IP ranges)</li>
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
          </InterviewQACard>

          <InterviewQACard level="Senior" question="What type pitfalls show up most often in production interviews?">
            <ul className="list-disc pl-6 space-y-1">
              <li>Using <code>FLOAT</code> for money → rounding bugs; use <code>NUMERIC</code></li>
              <li>Storing local times in <code>TIMESTAMP</code> without documenting timezone → DST bugs</li>
              <li>Overusing JSONB for core relational fields → weak constraints, harder reporting</li>
              <li>VARCHAR vs TEXT micro-optimizations that do not matter in Postgres</li>
              <li>Ignoring collation / Unicode normalization for unique emails and usernames</li>
            </ul>
          </InterviewQACard>

          <InterviewQACard level="Senior" question="How does Prisma Json differ from a typed relational model?">
            <ul className="list-disc pl-6 space-y-1">
              <li>Prisma <code>Json</code> maps to JSONB but offers limited query filtering compared to raw SQL</li>
              <li>Great for flexible metadata; poor for fields you filter/join/aggregate heavily</li>
              <li>Hybrid: relational columns for hot paths + <code>Json</code> for extensible bags of attributes</li>
            </ul>
            <CodeBlock
              title="Prisma Json usage"
              language="typescript"
              code={`const order = await prisma.order.create({
  data: {
    status: 'paid',
    data: { items: [{ sku: 'ABC', qty: 2 }], coupon: 'SAVE10' },
  },
});

// Prefer SQL / $queryRaw for complex JSONB containment filters at scale`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

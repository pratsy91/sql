import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 2: Advanced JSONB - Module 15 - Most Asked Interview Questions',
  description:
    'Most asked PostgreSQL JSONB interview questions: GIN indexing, jsonb_ops vs jsonb_path_ops, expression indexes, generated columns, updating a single key with jsonb_set, and SQL/JSON path queries.',
};

export default function Module15Lesson02AdvancedJson() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 2: Advanced JSONB</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Storing JSON is easy. Making it fast is where interviews go. This lesson is about indexing JSONB,
          choosing between index types, updating a single key without rewriting the whole document, and
          knowing when a plain column is the better answer.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="How do you update one key inside a JSONB document?">
            <p>
              Use <code>jsonb_set</code>. It returns a new document with one path replaced, so you assign the
              result back to the column. The path is given as an array of keys, and the fourth argument decides
              whether a missing key gets created.
            </p>
            <p>
              Be aware of what really happens underneath: PostgreSQL rewrites the entire row, because JSONB is
              stored as one value. Updating one key in a 200 KB document still writes all 200 KB. That is the
              main reason not to put a frequently-changing counter inside a large JSON blob.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <code>jsonb_set(doc, path, value, create_if_missing)</code> replaces or adds a key.
              </li>
              <li>
                The <code>||</code> operator merges objects, which is the shortest way to set top-level keys.
              </li>
              <li>
                <code>#-</code> removes a key at a path.
              </li>
              <li>
                The new value must be JSONB, so cast it: <code>to_jsonb($1)</code> or{' '}
                <code>&apos;&quot;paid&quot;&apos;::jsonb</code>.
              </li>
            </ul>
            <CodeBlock
              title="Setting, merging, and removing keys"
              language="sql"
              code={`-- Replace a nested key
UPDATE orders
SET data = jsonb_set(data, '{status}', '"paid"', true)
WHERE id = 1;

-- Nested path, two levels down
UPDATE orders
SET data = jsonb_set(data, '{shipping,city}', to_jsonb('Berlin'::text), true)
WHERE id = 1;

-- Merge several top-level keys at once (shallow merge)
UPDATE orders
SET data = data || '{"status":"paid","paid_at":"2026-10-01T10:00:00Z"}'::jsonb
WHERE id = 1;

-- Remove a key
UPDATE orders SET data = data #- '{internal_note}' WHERE id = 1;

-- Deep merge needs PostgreSQL 16 or later
SELECT jsonb_set_lax(data, '{shipping,city}', NULL, true, 'delete_key') FROM orders;`}
            />
            <CodeBlock
              title="Same update from Prisma"
              language="typescript"
              code={`// Prisma can overwrite the whole JSON field
await prisma.order.update({
  where: { id: 1 },
  data: { data: { ...existing.data, status: 'paid' } },
});

// Safer under concurrency: let PostgreSQL merge the key server-side,
// so two parallel updates to different keys do not overwrite each other
await prisma.$executeRawUnsafe(
  "UPDATE orders SET data = jsonb_set(data, '{status}', to_jsonb($1::text), true) WHERE id = $2",
  'paid',
  1
);`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="How do you index JSONB effectively?">
            <p>
              There are two completely different strategies, and picking the wrong one is the usual reason
              &quot;JSONB is slow&quot;.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>GIN on the whole column</strong>: one index serves any containment query{' '}
                <code>@&gt;</code> and any key-exists query <code>?</code>, whichever key the query happens to
                use. Flexible, but large and slower to update.
              </li>
              <li>
                <strong>Expression B-tree on one key</strong>: tiny, fast, and it supports sorting and range
                comparisons, which GIN cannot. But it only helps queries written with exactly that expression.
              </li>
            </ul>
            <p>
              Rule of thumb: if you know the hot key, index the expression. If queries are genuinely ad hoc,
              use GIN. The classic mistake is creating a GIN index and then querying with{' '}
              <code>data-&gt;&gt;&apos;status&apos; = &apos;paid&apos;</code>, which GIN cannot use at all,
              because that is an equality test on an extracted text value, not a containment test.
            </p>
            <CodeBlock
              title="Match the index to the operator"
              language="sql"
              code={`-- Flexible containment searches
CREATE INDEX idx_orders_data_gin ON orders USING GIN (data);
SELECT * FROM orders WHERE data @> '{"status":"paid"}';        -- uses GIN
SELECT * FROM orders WHERE data ? 'coupon';                    -- uses GIN

-- One hot key, with sorting and ranges
CREATE INDEX idx_orders_customer ON orders ((data->>'customer_id'));
SELECT * FROM orders WHERE data->>'customer_id' = 'c_42';      -- uses B-tree

-- Numbers need a cast, and the index must match it exactly
CREATE INDEX idx_orders_total ON orders (((data->>'total')::numeric));
SELECT * FROM orders WHERE (data->>'total')::numeric > 100;

-- This does NOT use the GIN index above
SELECT * FROM orders WHERE data->>'status' = 'paid';

-- Always confirm
EXPLAIN (ANALYZE, COSTS OFF)
SELECT * FROM orders WHERE data @> '{"status":"paid"}';`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="jsonb_ops or jsonb_path_ops for a GIN index?">
            <p>
              These are the two <strong>operator classes</strong> a JSONB GIN index can use, meaning the two
              ways it can break a document into index entries. <code>jsonb_ops</code> is the default.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>jsonb_ops</strong> indexes every key and every value separately. That supports more
                operators, including <code>?</code>, <code>?|</code>, and <code>?&amp;</code> for testing
                whether keys exist. The cost is a bigger index, and a query like{' '}
                <code>{'{"status":"paid"}'}</code> must look up both &quot;status&quot; and &quot;paid&quot; and
                intersect the results.
              </li>
              <li>
                <strong>jsonb_path_ops</strong> indexes a hash of the whole path plus its value as one entry.
                That is typically much smaller and faster for containment, because one lookup answers the
                query. The trade-off: it <em>only</em> supports <code>@&gt;</code> and the path operators{' '}
                <code>@?</code> and <code>@@</code>. Key-existence queries cannot use it at all.
              </li>
            </ul>
            <p>
              How to choose: if your workload is containment queries on known paths, use{' '}
              <code>jsonb_path_ops</code> and enjoy an index that is often less than half the size. If you need
              key-existence checks or cannot predict the queries, use the default. You can also create both, at
              the cost of slower writes.
            </p>
            <CodeBlock
              title="Both operator classes, and the size difference"
              language="sql"
              code={`-- Default: supports the most operators, larger index
CREATE INDEX idx_orders_data_ops ON orders USING GIN (data);

-- Containment only: smaller and usually faster for @>
CREATE INDEX idx_orders_data_path ON orders USING GIN (data jsonb_path_ops);

SELECT indexrelname, pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
WHERE relname = 'orders';

-- Works with either index
SELECT * FROM orders WHERE data @> '{"status":"paid"}';

-- Works ONLY with jsonb_ops
SELECT * FROM orders WHERE data ? 'coupon';
SELECT * FROM orders WHERE data ?| array['coupon', 'promo'];`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="When does a generated column beat a JSONB index?"
          >
            <p>
              Often, and this is a strong answer because it shows you are not treating JSONB as a reason to stop
              doing data modelling. A <code>STORED</code> generated column extracts the value out of the JSON
              once, on write, into a real typed column. Then you get an ordinary B-tree index with ordinary
              statistics.
            </p>
            <p>Prefer the generated column when:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>The key is queried constantly.</strong> A real column with a small B-tree index beats a
                large GIN index for a single hot field.
              </li>
              <li>
                <strong>You need sorting, ranges, or joins.</strong> GIN supports none of those.
              </li>
              <li>
                <strong>You need constraints.</strong> You can put <code>NOT NULL</code>, a{' '}
                <code>CHECK</code>, or a unique index on a generated column. You cannot meaningfully constrain a
                key inside JSONB.
              </li>
              <li>
                <strong>The planner keeps guessing wrong.</strong> PostgreSQL collects real statistics on a
                column, but its estimates for JSON extraction expressions are much weaker, which leads to bad
                plans on joins.
              </li>
              <li>
                <strong>You want a clean API.</strong> Prisma can map a generated column as a normal read-only
                field, so application code stops digging through JSON.
              </li>
            </ul>
            <p>
              Costs to acknowledge: the value is stored twice, so the table grows, and changing the expression
              requires rewriting the column. Also, a generated column cannot be used as a partition key.
            </p>
            <p>
              The underlying principle worth stating: if a field is important enough to index, it is usually
              important enough to be a column. Keep JSONB for the genuinely variable parts of the document.
            </p>
            <CodeBlock
              title="Promote a hot JSON key to a real column"
              language="sql"
              code={`ALTER TABLE orders
  ADD COLUMN status TEXT
  GENERATED ALWAYS AS (data->>'status') STORED;

CREATE INDEX idx_orders_status ON orders (status);

-- Now a plain, fast, sortable query with good statistics
SELECT * FROM orders WHERE status = 'paid' ORDER BY created_at DESC LIMIT 50;

-- Numeric extraction, usable for ranges and aggregates
ALTER TABLE orders
  ADD COLUMN total_cents BIGINT
  GENERATED ALWAYS AS ((data->>'total_cents')::bigint) STORED;

CREATE INDEX idx_orders_total_cents ON orders (total_cents);

SELECT sum(total_cents) FROM orders WHERE total_cents > 10000;

-- A constraint you could not express inside the JSON
ALTER TABLE orders
  ADD CONSTRAINT orders_status_known
  CHECK (status IN ('pending', 'paid', 'refunded', 'cancelled'));`}
            />
            <CodeBlock
              title="Exposed through Prisma as a normal field"
              language="prisma"
              code={`model Order {
  id         Int      @id @default(autoincrement())
  data       Json
  // Written by the database, never by the client
  status     String?
  totalCents BigInt?  @map("total_cents")
  createdAt  DateTime @default(now()) @map("created_at")

  @@index([status])
  @@index([totalCents])
  @@map("orders")
}`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard
            level="Senior"
            question="Advanced JSONB: containment, paths, and expression indexes in practice"
          >
            <p>
              At senior level the question is which tool you reach for and why, plus how you stop a JSON column
              from becoming a dumping ground.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Known access paths get narrow expression indexes.</strong> They are small, they support
                ordering, and the planner estimates them better.
              </li>
              <li>
                <strong>Ad hoc containment gets GIN</strong>, with <code>jsonb_path_ops</code> when{' '}
                <code>@&gt;</code> is all you need.
              </li>
              <li>
                <strong>SQL/JSON path, from PostgreSQL 12</strong>, handles the queries the basic operators
                cannot: reaching into arrays, filtering on nested predicates, and comparing numbers inside the
                document. <code>@?</code> asks &quot;does anything match this path&quot; and <code>@@</code>{' '}
                evaluates a path predicate to a boolean. Both can use a GIN index.
              </li>
              <li>
                <strong>Constrain the shape.</strong> JSONB accepts anything, so add <code>CHECK</code>{' '}
                constraints for required keys and types, or validate in the application. Unbounded documents
                become unqueryable and trigger TOAST compression and out-of-line storage, which slows reads.
              </li>
              <li>
                <strong>Watch row width.</strong> Once a JSONB value exceeds roughly 2 KB it is compressed and
                moved out of line. Reading one key then means fetching the whole document from TOAST storage,
                which is why a generated column can be dramatically faster.
              </li>
              <li>
                <strong>With Prisma</strong>: map the column as <code>Json</code>, use the type-safe filters for
                simple cases, and push anything involving containment, path predicates, or aggregation into a
                parameterised raw query.
              </li>
            </ul>
            <CodeBlock
              title="Path predicates and expression indexes"
              language="sql"
              code={`-- Expression index for a known nested path
CREATE INDEX idx_evt_type ON events ((payload #>> '{meta,type}'));
SELECT * FROM events WHERE payload #>> '{meta,type}' = 'login';

-- Reach into an array: does any item have this SKU?
SELECT * FROM events WHERE payload @? '$.items[*] ? (@.sku == "ABC")';

-- Predicate form, returns a boolean
SELECT * FROM events WHERE payload @@ '$.items[*].sku == "ABC"';

-- Numeric comparison inside the document, impossible with @>
SELECT * FROM events WHERE payload @@ '$.total > 100';

-- Extract matching parts rather than filtering rows
SELECT jsonb_path_query_array(payload, '$.items[*].sku') AS skus FROM events;

-- Flatten an array into rows for aggregation
SELECT e.id, item->>'sku' AS sku, (item->>'qty')::int AS qty
FROM events e, jsonb_array_elements(e.payload->'items') AS item;`}
            />
            <CodeBlock
              title="Keep the document honest"
              language="sql"
              code={`-- Required keys and correct types
ALTER TABLE events
  ADD CONSTRAINT events_payload_shape CHECK (
    payload ? 'type'
    AND jsonb_typeof(payload->'items') = 'array'
    AND jsonb_typeof(payload->'total') = 'number'
  );

-- Guard against unbounded growth
ALTER TABLE events
  ADD CONSTRAINT events_payload_size CHECK (pg_column_size(payload) < 100000);

-- Find the documents that are hurting you
SELECT id, pg_size_pretty(pg_column_size(payload)::bigint) AS size
FROM events ORDER BY pg_column_size(payload) DESC LIMIT 20;`}
            />
            <CodeBlock
              title="Prisma: simple filters native, heavy operators raw"
              language="typescript"
              code={`// Fine in Prisma for straightforward lookups
const paid = await prisma.order.findMany({
  where: { data: { path: ['status'], equals: 'paid' } },
});

// Containment and path predicates go to raw SQL, still parameterised
const sql = [
  'SELECT id, payload',
  'FROM events',
  'WHERE payload @> $1::jsonb',
  "  AND payload @@ '$.total > 100'",
  'ORDER BY created_at DESC',
  'LIMIT 50',
].join(' ');

const rows = await prisma.$queryRawUnsafe(
  sql,
  JSON.stringify({ meta: { type: 'purchase' } })
);`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

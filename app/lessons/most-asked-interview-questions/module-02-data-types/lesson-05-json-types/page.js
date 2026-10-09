import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 6: JSON Types - Module 2 - Most Asked Interview Questions',
  description:
    'Most asked interview questions on JSON and JSONB in PostgreSQL — JSON vs JSONB, extracting fields, GIN indexing, when not to use JSONB, validating shape, and Prisma Json',
};

export default function MaiqM02L05JsonTypes() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 6: JSON Types</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          JSONB is one of the most asked Postgres topics. Expect the JSON vs JSONB question, then a follow-up on indexing and on when JSONB is the wrong choice.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="How do you read a single field out of a JSONB column?">
            <p>
              Use the arrow operators. <code>-&gt;</code> returns JSON, and <code>-&gt;&gt;</code> returns plain text. That one difference is the most
              common JSONB interview trap.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><code>data -&gt; &apos;status&apos;</code> gives the JSON value <code>&quot;paid&quot;</code>, with the quotes still in it</li>
              <li><code>data -&gt;&gt; &apos;status&apos;</code> gives the text <code>paid</code>, which is what you compare against a string</li>
              <li>Both work with an integer to read from an array, so <code>data -&gt; &apos;items&apos; -&gt; 0</code> is the first item</li>
              <li><code>#&gt;</code> and <code>#&gt;&gt;</code> follow a path in one step, taking an array of keys</li>
              <li>Numbers need a cast, because <code>-&gt;&gt;</code> always gives text: <code>(data -&gt;&gt; &apos;total&apos;)::numeric</code></li>
              <li>A missing key returns NULL rather than an error, so typos fail silently. Watch for that</li>
            </ul>
            <CodeBlock
              title="Reading JSONB values"
              language="sql"
              code={`SELECT data -> 'status'            AS as_json,   -- "paid"
       data ->> 'status'           AS as_text,   -- paid
       (data ->> 'total')::numeric AS total,
       data -> 'items' -> 0        AS first_item,
       data #>> '{customer,city}'  AS city
FROM orders;

-- Compare against text, not JSON
SELECT * FROM orders WHERE data ->> 'status' = 'paid';

-- Does the key exist at all?
SELECT * FROM orders WHERE data ? 'coupon';

-- Flatten an array into rows
SELECT o.id, item ->> 'sku' AS sku, (item ->> 'qty')::int AS qty
FROM orders o
CROSS JOIN LATERAL jsonb_array_elements(o.data -> 'items') AS item;`}
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
              <li>JSONB is slightly slower to write, because it parses on input, and much faster to read. That trade is worth it almost every time</li>
              <li>Pick plain JSON only when you must return the document byte-for-byte as it arrived, for example for a signature check or an audit log</li>
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
            <CodeBlock
              title="Key order and duplicates are not preserved"
              language="sql"
              code={`SELECT '{"b":1, "a":2, "a":3}'::json;   -- {"b":1, "a":2, "a":3}
SELECT '{"b":1, "a":2, "a":3}'::jsonb;  -- {"a": 3, "b": 1}`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How do you update a field inside JSONB?">
            <p>
              Use <code>jsonb_set</code>, concatenation, or the <code>- </code> operator to remove a key. Updating JSONB rewrites the whole document.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><code>jsonb_set</code> replaces one path. Pass <code>true</code> as the last argument to create missing keys</li>
              <li><code>data ||</code> a small JSON object merges at the top level</li>
              <li><code>data - &apos;coupon&apos;</code> deletes a key. <code>data #-</code> with a path deletes nested keys</li>
              <li>Containment with the <code>@&gt;</code> operator is the predicate GIN likes</li>
              <li>Prisma <code>Json</code> updates usually replace the whole object. Partial SQL updates belong in a raw query if you need them</li>
            </ul>
            <CodeBlock
              title="jsonb_set, merge, delete, containment"
              language="sql"
              code={`UPDATE orders
SET data = jsonb_set(data, '{status}', '"paid"', true)
WHERE id = 1;

UPDATE orders
SET data = data || '{"coupon":"SAVE10"}'::jsonb
WHERE id = 1;

UPDATE orders SET data = data - 'coupon' WHERE id = 1;

SELECT * FROM orders WHERE data @> '{"status":"paid"}'::jsonb;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="When should you NOT use JSONB?">
            <p>
              JSONB is for data whose shape you genuinely cannot fix in advance. The moment a field matters to your business logic, it belongs in a real
              column. Interviewers ask this to see whether you reach for JSONB as an excuse to skip schema design.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Anything you filter, join, or sort often.</strong> A plain column with a B-tree index is faster and the planner estimates it far better</li>
              <li><strong>Anything that needs a constraint.</strong> You cannot put a foreign key on a value inside JSONB, and NOT NULL or UNIQUE need extra work</li>
              <li><strong>Anything a report reads.</strong> Analysts and BI tools struggle with nested documents, and every query needs casts</li>
              <li><strong>Large documents that get updated often.</strong> Postgres rewrites the whole row on every update, and a big JSONB value goes to TOAST storage, so small edits become expensive</li>
              <li><strong>Arrays you keep appending to.</strong> A child table is cheaper and lets you index and paginate</li>
              <li><strong>Planner blindness:</strong> statistics on JSONB paths are weak, so row estimates are often wrong and you get bad join plans</li>
              <li>The pattern that works: relational columns for the fields you query, plus one JSONB column for genuinely open-ended extras</li>
            </ul>
            <CodeBlock
              title="Hybrid design, not everything in one blob"
              language="sql"
              code={`CREATE TABLE orders (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    BIGINT NOT NULL REFERENCES users (id),   -- real FK
  status     TEXT NOT NULL,                           -- filtered constantly
  total      NUMERIC(12, 2) NOT NULL,                 -- summed in reports
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata   JSONB NOT NULL DEFAULT '{}'              -- open-ended extras only
);

CREATE INDEX orders_status_created_idx ON orders (status, created_at DESC);`}
            />
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
              <li>A GIN index does not help <code>ORDER BY</code> or a range test on an extracted number. For those you need a B-tree expression index with a cast</li>
              <li>Partial indexes work here too, so you can index only the documents that matter, for example where the status is still open</li>
              <li>GIN indexes are updated through a pending list controlled by <code>fastupdate</code>, so write-heavy tables may need <code>gin_pending_list_limit</code> tuning</li>
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
            <CodeBlock
              title="Typed and partial expression indexes"
              language="sql"
              code={`-- Range queries need a typed expression index
CREATE INDEX orders_total_idx ON orders (((data->>'total')::numeric));
SELECT * FROM orders WHERE (data->>'total')::numeric > 1000;

-- Index only the rows you actually query
CREATE INDEX orders_open_idx ON orders ((data->>'customer_id'))
  WHERE data->>'status' = 'open';

-- Always confirm the index is used
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM orders WHERE data @> '{"status":"paid"}';`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="How do you validate the shape of a JSONB document?">
            <p>
              Postgres checks that the value is valid JSON, but it does not check that your keys exist or have the right types. You add that yourself with
              CHECK constraints, and from Postgres 12 the cleanest tool is the SQL/JSON path language.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><code>jsonb_typeof()</code> confirms the top level is an object rather than an array or a scalar</li>
              <li><code>? </code> tests that a key exists, and <code>?&amp;</code> tests that all keys in a list exist</li>
              <li><code>jsonb_path_exists()</code> expresses richer rules, including type checks and numeric ranges, in one constraint</li>
              <li>Postgres 17 adds real <code>JSON_TABLE</code>, and 16 adds <code>IS JSON</code> predicates, which make validation and flattening much nicer</li>
              <li>Keep constraints cheap. A heavy regex or a deep path check runs on every insert and update</li>
              <li>Full JSON Schema validation needs an extension such as <code>pg_jsonschema</code>, which is not available on every managed host. Many teams validate in the app with Zod and keep only a light CHECK in the database as a backstop</li>
              <li>Remember a CHECK added with <code>NOT VALID</code> applies to new rows only, which is how you roll validation out on a large existing table</li>
            </ul>
            <CodeBlock
              title="CHECK constraints on JSONB"
              language="sql"
              code={`ALTER TABLE orders
  ADD CONSTRAINT orders_data_is_object
  CHECK (jsonb_typeof(data) = 'object');

ALTER TABLE orders
  ADD CONSTRAINT orders_data_required_keys
  CHECK (data ?& array['status', 'items']);

-- Type and range rules with a JSON path
ALTER TABLE orders
  ADD CONSTRAINT orders_total_is_positive_number
  CHECK (jsonb_path_exists(data, '$.total ? (@.type() == "number" && @ > 0)'));

-- Roll out on a large table without a long lock
ALTER TABLE orders
  ADD CONSTRAINT orders_has_currency CHECK (data ? 'currency') NOT VALID;
ALTER TABLE orders VALIDATE CONSTRAINT orders_has_currency;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="How does Prisma Json differ from a typed relational model?">
            <ul className="list-disc pl-6 space-y-1">
              <li>Prisma <code>Json</code> maps to JSONB but offers limited query filtering compared to raw SQL</li>
              <li>Great for flexible metadata; poor for fields you filter/join/aggregate heavily</li>
              <li>Hybrid: relational columns for hot paths + <code>Json</code> for extensible bags of attributes</li>
              <li>The generated TypeScript type is <code>Prisma.JsonValue</code>, so you get no field-level type safety. Parse it with Zod at the edge if it matters</li>
              <li>Prisma cannot express a partial or expression index on a JSONB path, so those go in a hand-written migration</li>
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
            <CodeBlock
              title="Raw SQL for a containment filter"
              language="typescript"
              code={`// Never build a template-literal query by hand; pass parameters
const paid = await prisma.$queryRawUnsafe(
  'SELECT id, total FROM orders WHERE data @> $1::jsonb ORDER BY id DESC LIMIT 50',
  JSON.stringify({ status: 'paid' })
);`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 5: Array and JSON Functions - Module 7 - Most Asked Interview Questions',
  description:
    'Most asked PostgreSQL array and JSONB interview questions: array operators, unnest, JSONB arrow operators, containment, key existence, jsonb_build_object, jsonb_set, and jsonb_path queries.',
};

export default function M7L5ArrayAndJsonFunctions() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 5: Array and JSON Functions</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          PostgreSQL can store a list or a whole document inside one column. This lesson covers the array
          operators, the JSONB operators with their odd-looking symbols, and how to read, build and update JSON
          values.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="How do array operators and functions work in PostgreSQL?">
            <p>
              An array column stores a list of values of the same type, such as a list of tags on a post. Array
              literals are written with curly braces, like <code>{"'{a,b,c}'"}</code>, or built with the
              <code>ARRAY[...]</code> constructor.
            </p>
            <p>The operators you are asked about:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <code>ANY</code> and <code>ALL</code> compare one value against every element.
              </li>
              <li>
                <code>@&gt;</code> means &quot;contains&quot;: the left array holds every element of the right
                one.
              </li>
              <li>
                <code>&amp;&amp;</code> means &quot;overlaps&quot;: the two arrays share at least one element.
              </li>
              <li>
                <code>unnest</code> turns an array into rows, <code>array_agg</code> does the reverse, and
                <code>cardinality</code> returns the number of elements.
              </li>
            </ul>
            <CodeBlock
              title="Array ops"
              language="sql"
              code={`SELECT *
FROM posts
WHERE tags @> ARRAY['postgres']::text[]
   OR tags && ARRAY['sql', 'database'];

SELECT unnest(ARRAY[10, 20, 30]) AS n;

SELECT user_id, array_agg(id ORDER BY created_at) AS order_ids
FROM orders
GROUP BY user_id;`}
            />
            <p>
              Array indexes start at 1, not 0. That single fact is asked surprisingly often. Reading past the end
              returns NULL rather than raising an error.
            </p>
            <CodeBlock
              title="Indexing and size"
              language="sql"
              code={`SELECT
  tags[1]              AS first_tag,
  tags[99]             AS missing_tag,  -- NULL, no error
  cardinality(tags)    AS tag_count,
  array_length(tags,1) AS same_count,
  array_position(tags, 'sql') AS where_is_sql
FROM posts;`}
            />
            <p>
              A word of design advice, because interviewers often ask it as a follow-up. Arrays are a good fit for
              a short, read-mostly list that belongs to one row and is never joined to, such as tags. If you need
              to attach extra data to each element, enforce a foreign key, or count elements across the whole
              table, a separate join table is the better model.
            </p>
            <CodeBlock
              title="Prisma"
              language="typescript"
              code={`// A scalar list maps to a PostgreSQL array
// model Post { tags String[] }

const tagged = await prisma.post.findMany({
  where: { tags: { has: 'postgres' } },       // @> with one element
});

const anyOf = await prisma.post.findMany({
  where: { tags: { hasSome: ['sql', 'database'] } }, // overlap
});

const allOf = await prisma.post.findMany({
  where: { tags: { hasEvery: ['sql', 'postgres'] } }, // contains
});`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="How do you turn an array into rows with unnest?">
            <p>
              <code>unnest</code> expands an array so each element becomes its own row. This is how you get from a
              list stored in one column to something you can group, count or join against.
            </p>
            <CodeBlock
              title="unnest basics"
              language="sql"
              code={`SELECT unnest(ARRAY['sql', 'postgres', 'sql']) AS tag;
-- three rows: sql, postgres, sql`}
            />
            <p>
              Used in the <code>FROM</code> clause alongside a table, it produces one row per element per row.
              That is what makes &quot;most popular tags&quot; a one-query answer.
            </p>
            <CodeBlock
              title="Count tag popularity"
              language="sql"
              code={`SELECT t.tag, COUNT(*) AS posts
FROM posts p
CROSS JOIN LATERAL unnest(p.tags) AS t(tag)
GROUP BY t.tag
ORDER BY posts DESC
LIMIT 10;`}
            />
            <p>
              <code>LATERAL</code> means the expanded expression is allowed to refer to the row on its left. A
              plain <code>CROSS JOIN unnest(p.tags)</code> also works in PostgreSQL because it treats it as
              lateral automatically, but writing <code>LATERAL</code> makes the intent obvious.
            </p>
            <p>
              One trap: a <code>CROSS JOIN</code> drops rows whose array is empty or NULL, because there is
              nothing to expand. Use <code>LEFT JOIN LATERAL ... ON true</code> to keep them.
            </p>
            <CodeBlock
              title="Keeping rows with no elements"
              language="sql"
              code={`SELECT p.id, t.tag
FROM posts p
LEFT JOIN LATERAL unnest(p.tags) AS t(tag) ON true;
-- posts with no tags appear once, with tag = NULL`}
            />
            <p>
              <code>WITH ORDINALITY</code> adds a position number, which you need when the order inside the array
              carries meaning. And <code>unnest</code> is also handy for turning a parameter list into rows so you
              can join against it.
            </p>
            <CodeBlock
              title="Ordinality and bulk lookups"
              language="sql"
              code={`SELECT t.tag, t.pos
FROM posts p, unnest(p.tags) WITH ORDINALITY AS t(tag, pos)
WHERE p.id = 1;

-- Expand one parameter into a joinable set of rows
SELECT * FROM users
WHERE id = ANY(ARRAY[1, 2, 3]);`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="Explain the JSONB operators: arrow, double arrow, containment, and jsonb_path queries.">
            <p>
              JSONB is a binary JSON type. It parses the document once on write, so reads and operators are fast
              and it can be indexed. Plain <code>json</code> keeps the raw text and supports far less. Prefer
              JSONB unless you must preserve key order and formatting exactly.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <code>-&gt;</code> returns a JSONB value. Use it to step deeper into the document.
              </li>
              <li>
                <code>-&gt;&gt;</code> returns text. Use it at the last step, when you want a usable scalar.
              </li>
              <li>
                <code>@&gt;</code> checks containment: does the document include this smaller document?
              </li>
              <li>
                <code>jsonb_path_exists</code> and <code>jsonb_path_query</code> run SQL/JSON path expressions
                (PostgreSQL 12 and later) for conditions the operators cannot express.
              </li>
            </ul>
            <CodeBlock
              title="JSONB"
              language="sql"
              code={`SELECT
  payload -> 'user' AS user_obj,
  payload ->> 'email' AS email_text
FROM events
WHERE payload @> '{"type":"signup"}'::jsonb
  AND jsonb_path_exists(payload, '$.meta.score ? (@ >= 80)');`}
            />
            <p>
              Remember that <code>-&gt;</code> gives JSONB, so comparing it to a plain string fails unless you
              cast. Use <code>-&gt;&gt;</code> for comparisons, then cast to the type you need for numbers.
            </p>
            <CodeBlock
              title="The arrow mistake"
              language="sql"
              code={`-- Type mismatch: jsonb compared to text
SELECT * FROM events WHERE payload -> 'type' = 'signup';

-- Correct: text extraction
SELECT * FROM events WHERE payload ->> 'type' = 'signup';

-- Numbers need an explicit cast
SELECT * FROM events WHERE (payload ->> 'score')::int >= 80;`}
            />
            <p>
              For deep paths there are the hash variants: <code>#&gt;</code> returns JSONB and
              <code>#&gt;&gt;</code> returns text, both taking an array of keys. They save you chaining arrows.
            </p>
            <CodeBlock
              title="Deep paths"
              language="sql"
              code={`SELECT
  payload #> '{user,address}'      AS address_obj,
  payload #>> '{user,address,city}' AS city_text,
  payload -> 'items' -> 0 ->> 'sku' AS first_sku
FROM events;`}
            />
            <p>
              Arrays inside JSONB are indexed from 0, unlike SQL arrays which start at 1. Two different rules in
              one database is exactly the kind of detail an interviewer enjoys.
            </p>
            <CodeBlock
              title="Prisma JSON filters"
              language="typescript"
              code={`const signups = await prisma.event.findMany({
  where: { payload: { path: ['type'], equals: 'signup' } },
});

// Containment maps to the @> operator
const nested = await prisma.event.findMany({
  where: { payload: { path: ['meta', 'plan'], equals: 'pro' } },
});

// Path expressions need raw SQL
const highScores = await prisma.$queryRawUnsafe(
  "SELECT id FROM events WHERE jsonb_path_exists(payload, '$.meta.score ? (@ >= 80)')",
);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How do you check whether a JSONB key exists?">
            <p>
              Use the <code>?</code> operator. <code>payload ? &apos;email&apos;</code> is true when the document
              has a top-level key called <code>email</code>. There are two siblings:
              <code>?|</code> is true when any key in a list exists, and <code>?&amp;</code> is true when all of
              them exist.
            </p>
            <CodeBlock
              title="Key existence"
              language="sql"
              code={`SELECT *
FROM events
WHERE payload ? 'email';

SELECT * FROM events WHERE payload ?| ARRAY['email', 'phone'];
SELECT * FROM events WHERE payload ?& ARRAY['email', 'phone'];`}
            />
            <p>
              The important distinction is between a key that is missing and a key whose value is JSON
              <code>null</code>. They are different states, and this is the question behind the question.
            </p>
            <CodeBlock
              title="Missing key vs JSON null"
              language="sql"
              code={`WITH d AS (SELECT '{"a": null}'::jsonb AS doc)
SELECT
  doc ? 'a'                   AS key_exists,     -- true
  doc ->> 'a' IS NULL         AS text_is_null,   -- true
  doc -> 'a' = 'null'::jsonb  AS value_is_json_null, -- true
  doc ? 'b'                   AS other_exists    -- false
FROM d;`}
            />
            <p>
              So <code>payload -&gt;&gt; &apos;a&apos; IS NULL</code> cannot tell you whether the key was absent
              or present with a null value. If that difference matters, test with <code>?</code>.
            </p>
            <p>
              The <code>?</code> operator only looks at top-level keys of an object. For a nested key, either step
              down first or use a path expression.
            </p>
            <CodeBlock
              title="Nested key existence"
              language="sql"
              code={`SELECT *
FROM events
WHERE payload -> 'meta' ? 'score';

SELECT *
FROM events
WHERE jsonb_path_exists(payload, '$.meta.score');`}
            />
            <p>
              A practical warning for Prisma users: the question mark is also the placeholder character in some
              drivers, and in Prisma raw queries the operator can be mistaken for a parameter marker. Writing the
              check as <code>jsonb_exists(payload, &apos;email&apos;)</code>, the function form of the same
              operator, avoids all ambiguity.
            </p>
            <CodeBlock
              title="Function form avoids placeholder confusion"
              language="typescript"
              code={`const withEmail = await prisma.$queryRawUnsafe(
  "SELECT id FROM events WHERE jsonb_exists(payload, 'email')",
);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How do you build a JSON object in SQL with jsonb_build_object?">
            <p>
              <code>jsonb_build_object</code> takes alternating keys and values and returns a JSONB document. It
              is how you shape an API response inside the database instead of assembling it in application code.
            </p>
            <CodeBlock
              title="jsonb_build_object"
              language="sql"
              code={`SELECT jsonb_build_object(
  'id',    u.id,
  'email', u.email,
  'name',  CONCAT_WS(' ', u.first_name, u.last_name)
) AS user_json
FROM users u;`}
            />
            <p>
              Its partners are <code>jsonb_build_array</code> for lists and <code>jsonb_agg</code> for collecting
              many rows into one JSON array. Combined, they produce a nested document in a single query.
            </p>
            <CodeBlock
              title="Nested document in one query"
              language="sql"
              code={`SELECT jsonb_build_object(
  'order_id', o.id,
  'total',    o.total_cents,
  'items',    COALESCE(
    jsonb_agg(
      jsonb_build_object('sku', i.sku, 'qty', i.quantity)
      ORDER BY i.sku
    ) FILTER (WHERE i.id IS NOT NULL),
    '[]'::jsonb
  )
) AS doc
FROM orders o
LEFT JOIN order_items i ON i.order_id = o.id
GROUP BY o.id, o.total_cents;`}
            />
            <p>
              The <code>COALESCE</code> to an empty array matters. Without it an order with no items returns
              <code>null</code> for <code>items</code>, and the client then has to handle two shapes.
            </p>
            <p>
              Two related helpers worth naming. <code>to_jsonb(row)</code> converts an entire row to JSON without
              listing columns, which is great for audit triggers. <code>row_to_json</code> is the older
              equivalent that returns <code>json</code> rather than <code>jsonb</code>.
            </p>
            <CodeBlock
              title="Whole rows as JSON"
              language="sql"
              code={`SELECT to_jsonb(u) AS full_row FROM users u WHERE id = 1;

-- Drop columns you do not want to expose
SELECT to_jsonb(u) - 'password_hash' AS safe_row FROM users u;`}
            />
            <p>
              Note the <code>-</code> operator: on a JSONB object it removes a key. That is often quicker than
              rebuilding the object field by field.
            </p>
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="How do you update a single key inside a JSONB column?">
            <p>
              You cannot edit part of a JSONB value in place. PostgreSQL rewrites the whole value, so an
              &quot;update one key&quot; is really &quot;compute a new document and store it&quot;. There are two
              common ways to do that.
            </p>
            <p>
              <code>jsonb_set(document, path, new_value, create_if_missing)</code> replaces the value at a path.
              The path is a text array. The fourth argument decides whether a missing key gets created; it
              defaults to true.
            </p>
            <CodeBlock
              title="jsonb_set"
              language="sql"
              code={`UPDATE users
SET settings = jsonb_set(settings, '{theme}', '"dark"'::jsonb, true)
WHERE id = 1;

-- Nested path
UPDATE users
SET settings = jsonb_set(settings, '{notifications,email}', 'false'::jsonb)
WHERE id = 1;`}
            />
            <p>
              The new value must itself be valid JSON, which is why a string is written as
              <code>&apos;&quot;dark&quot;&apos;</code> with the inner quotes. Forgetting those quotes is the most
              common error with this function. Use <code>to_jsonb</code> when the value comes from a column or a
              parameter.
            </p>
            <CodeBlock
              title="Values from parameters"
              language="sql"
              code={`UPDATE users
SET settings = jsonb_set(settings, '{theme}', to_jsonb($1::text))
WHERE id = $2;`}
            />
            <p>
              The merge operator <code>||</code> is often simpler for top-level keys. It combines two objects,
              with the right-hand side winning. It is shallow, so merging a nested object replaces that whole
              sub-object rather than merging inside it.
            </p>
            <CodeBlock
              title="Merge versus set"
              language="sql"
              code={`-- Set or overwrite several top-level keys at once
UPDATE users
SET settings = settings || '{"theme":"dark","density":"compact"}'::jsonb
WHERE id = 1;

-- Shallow: this wipes any other keys under notifications
UPDATE users
SET settings = settings || '{"notifications":{"email":false}}'::jsonb
WHERE id = 1;

-- Deep change: use jsonb_set for that
UPDATE users
SET settings = jsonb_set(settings, '{notifications,email}', 'false'::jsonb)
WHERE id = 1;`}
            />
            <p>
              Deleting a key uses <code>-</code> for one key, <code>#-</code> for a nested path. Both also rewrite
              the document.
            </p>
            <CodeBlock
              title="Removing keys"
              language="sql"
              code={`UPDATE users SET settings = settings - 'legacy_flag' WHERE id = 1;
UPDATE users SET settings = settings #- '{notifications,sms}' WHERE id = 1;`}
            />
            <p>Three things a senior answer should mention:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                If <code>settings</code> is NULL, both <code>jsonb_set</code> and <code>||</code> return NULL and
                you silently lose the update. Guard with
                <code>{"COALESCE(settings, '{}'::jsonb)"}</code>, or give the column a default of
                <code>{"'{}'"}</code> plus a NOT NULL constraint.
              </li>
              <li>
                Because the whole value is rewritten, a large document is expensive to update. A JSONB column that
                changes on every request is a sign the hot fields should be real columns.
              </li>
              <li>
                Two concurrent updates to different keys can lose one of the changes, since each reads the old
                document and writes a full replacement. Use a single atomic statement that reads and writes the
                column in one expression, or lock the row first.
              </li>
            </ul>
            <CodeBlock
              title="NULL-safe and concurrency-safe"
              language="sql"
              code={`UPDATE users
SET settings = COALESCE(settings, '{}'::jsonb) || $1::jsonb
WHERE id = $2;
-- One statement reads and writes settings atomically`}
            />
            <CodeBlock
              title="Prisma"
              language="typescript"
              code={`// Prisma replaces the whole Json field; it has no partial update
const user = await prisma.user.findUniqueOrThrow({ where: { id } });
await prisma.user.update({
  where: { id },
  data: { settings: { ...(user.settings as object), theme: 'dark' } },
});
// Read-then-write can lose a concurrent change.
// Prefer one atomic statement:
await prisma.$executeRawUnsafe(
  "UPDATE users SET settings = COALESCE(settings, '{}'::jsonb) || $1::jsonb WHERE id = $2",
  JSON.stringify({ theme: 'dark' }),
  id,
);`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

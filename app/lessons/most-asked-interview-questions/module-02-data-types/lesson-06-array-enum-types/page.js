import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 6: Array and ENUM Types - Module 2 - Most Asked Interview Questions',
  description:
    'Most asked interview questions on PostgreSQL arrays and ENUMs — when to use an array, array vs junction table, ENUM trade-offs, ALTER TYPE ADD VALUE, and lookup tables',
};

export default function MaiqM02L06ArrayEnumTypes() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 6: Array and ENUM Types</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Two Postgres features that feel convenient at first. The interview is really about knowing when a proper table is the better answer.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="When would you use arrays in PostgreSQL?">
            <ul className="list-disc pl-6 space-y-1">
              <li>Small, ordered collections owned by the row (tags, roles) when you do not need to join as entities</li>
              <li>Operators: <code>ANY</code>, <code>ALL</code>, <code>@&gt;</code>, <code>&amp;&amp;</code> (overlap)</li>
              <li>GIN indexes help containment queries</li>
              <li>Prefer a junction table when the list is large, relational, or needs its own metadata</li>
              <li>Remember Postgres arrays are 1-indexed, not 0-indexed, and reading past the end gives NULL instead of an error</li>
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
            <CodeBlock
              title="Useful array functions"
              language="sql"
              code={`SELECT array_length(tags, 1) AS tag_count FROM posts;
SELECT * FROM posts WHERE tags && ARRAY['sql', 'postgres'];  -- overlaps

-- Turn an array into rows so you can group it
SELECT tag, count(*)
FROM posts, unnest(tags) AS tag
GROUP BY tag
ORDER BY count(*) DESC;

-- Add and remove a value
UPDATE posts SET tags = array_append(tags, 'indexes') WHERE id = 1;
UPDATE posts SET tags = array_remove(tags, 'draft')   WHERE id = 1;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Array column or junction table — how do you decide?">
            <p>
              An array keeps the list inside the row. A junction table (also called a join table or a link table) stores one row per pair and gives you real
              foreign keys. Default to the junction table unless the list is tiny, fixed, and owned entirely by that one row.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Use an array when:</strong> the values are free text with no separate identity, the list is short, order matters, and you only ever read the whole list with the row</li>
              <li><strong>Use a junction table when:</strong> the values are entities with their own rows, you need a foreign key, you need extra columns on the relationship (added_at, added_by, sort_order), or you need to count and rank across all rows</li>
              <li><strong>Referential integrity:</strong> an array cannot have a foreign key, so a deleted tag leaves stale strings behind. This is the single strongest argument for a table</li>
              <li><strong>Query direction:</strong> &quot;which tags does this post have&quot; is easy either way. &quot;Which posts have this tag, newest first, page 3&quot; is much better with a table plus a normal B-tree index</li>
              <li><strong>Updates:</strong> changing one element rewrites the whole row, and every index on that row. A junction table updates one small row</li>
              <li><strong>ORMs:</strong> Prisma supports scalar lists on Postgres, but relations give you includes, counts, and nested writes</li>
              <li>A common compromise is a junction table as the source of truth plus a denormalised array column kept in sync for fast reads. Only do this if you really need it</li>
            </ul>
            <CodeBlock
              title="Junction table version"
              language="sql"
              code={`CREATE TABLE tags (
  id   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE post_tags (
  post_id  BIGINT NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
  tag_id   BIGINT NOT NULL REFERENCES tags (id)  ON DELETE RESTRICT,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, tag_id)
);

-- Reverse lookup is a plain index scan
CREATE INDEX post_tags_tag_idx ON post_tags (tag_id, post_id);

SELECT p.*
FROM posts p
JOIN post_tags pt ON pt.post_id = p.id
JOIN tags t       ON t.id = pt.tag_id
WHERE t.name = 'postgres'
ORDER BY p.id DESC
LIMIT 20;`}
            />
            <CodeBlock
              title="Prisma: scalar list vs relation"
              language="typescript"
              code={`// Scalar list (array column)
model Post {
  id   Int      @id @default(autoincrement())
  tags String[]
}

// Explicit many-to-many with metadata
model PostTag {
  postId  Int
  tagId   Int
  addedAt DateTime @default(now())
  post    Post     @relation(fields: [postId], references: [id])
  tag     Tag      @relation(fields: [tagId], references: [id])

  @@id([postId, tagId])
}`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What are ENUM types, and what are the trade-offs?">
            <ul className="list-disc pl-6 space-y-1">
              <li>Enums are custom types with a fixed set of labels — strong validation at the DB layer</li>
              <li>Pros: readable, compact storage, check without a separate CHECK list</li>
              <li>Cons: adding/renaming values needs <code>ALTER TYPE</code>; removing values is painful; migrations can be awkward</li>
              <li>Alternative: <code>TEXT</code> + <code>CHECK</code>, or a lookup table for frequently changing sets</li>
              <li>Enum values sort in the order they were declared, not alphabetically. That is sometimes exactly what you want for a status ladder</li>
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

          <InterviewQACard level="Mid" question="How do you add, rename, or remove a value from an existing ENUM?">
            <p>
              Adding and renaming are single commands. Removing a value is the hard one, because Postgres has no <code>DROP VALUE</code>.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><code>ALTER TYPE ... ADD VALUE</code> appends a label. Use <code>BEFORE</code> or <code>AFTER</code> to control the sort position</li>
              <li>Before Postgres 12, <code>ADD VALUE</code> could not run inside a transaction block at all. From 12 it can, but you still cannot use the new value in the same transaction that added it. This bites people using migration tools that wrap everything in one transaction</li>
              <li><code>ADD VALUE IF NOT EXISTS</code> makes the migration safe to re-run</li>
              <li><code>ALTER TYPE ... RENAME VALUE old TO new</code> renames in place, and existing rows follow automatically</li>
              <li><strong>To remove a value</strong> you create a new type, migrate the column, and drop the old type. Update any rows still using the doomed label first</li>
              <li>This whole dance is the main reason experienced teams choose a lookup table for statuses that change often</li>
            </ul>
            <CodeBlock
              title="Add and rename"
              language="sql"
              code={`ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'refunded';
ALTER TYPE order_status ADD VALUE 'packed' AFTER 'paid';
ALTER TYPE order_status RENAME VALUE 'cancelled' TO 'canceled';

SELECT enumlabel, enumsortorder
FROM pg_enum
WHERE enumtypid = 'order_status'::regtype
ORDER BY enumsortorder;`}
            />
            <CodeBlock
              title="Removing a value: swap the type"
              language="sql"
              code={`-- 1. Move rows off the value you are dropping
UPDATE orders SET status = 'canceled' WHERE status = 'refunded';

-- 2. Create the new type without it
CREATE TYPE order_status_new AS ENUM ('pending', 'paid', 'packed', 'shipped', 'canceled');

-- 3. Swap the column over (rewrites the table, so plan the lock)
ALTER TABLE orders
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE order_status_new
    USING status::text::order_status_new,
  ALTER COLUMN status SET DEFAULT 'pending';

-- 4. Clean up
DROP TYPE order_status;
ALTER TYPE order_status_new RENAME TO order_status;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="ENUM, lookup table, or TEXT with a CHECK — which do you pick and why?">
            <p>
              All three stop bad values. They differ in how easily the list can change, whether the list can carry extra information, and how much work a
              schema migration is. A senior answer names the deciding factor rather than picking a favourite.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>ENUM:</strong> compact (4 bytes), self-documenting, sorts in declared order, and gives clean generated types in Prisma and similar tools. Cost: every change is a DDL migration, and you cannot attach a label, colour, or sort weight to a value</li>
              <li><strong>TEXT with a CHECK:</strong> easiest to change, since altering a constraint is cheaper than altering a type, and you can add it <code>NOT VALID</code> then validate. Cost: the allowed list lives in a constraint definition, which tools do not introspect as nicely, and it stores the full string on every row</li>
              <li><strong>Lookup table with a foreign key:</strong> the most flexible. Values become data, so a product manager can add one without a deploy, and you can store a display name, a sort order, and an is_active flag next to it. Cost: an extra join, and you must plan what happens when a value is retired</li>
              <li><strong>Deciding rule:</strong> if the set is fixed by code logic and changes maybe once a year, use an ENUM. If the set is business data that grows, use a lookup table. If you want the middle ground with the least ceremony, use TEXT plus CHECK</li>
              <li><strong>Migration cost matters most:</strong> ENUM changes are DDL on a shared type, which can conflict with concurrent deploys. A lookup table change is a plain INSERT</li>
              <li>Whichever you choose, keep the database as the last line of defence. The application should also validate, so users get a good error message instead of a constraint violation</li>
            </ul>
            <CodeBlock
              title="TEXT with a CHECK"
              language="sql"
              code={`CREATE TABLE tickets (
  id     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'pending', 'resolved', 'closed'))
);

-- Changing the list is a constraint swap, not a type rewrite
ALTER TABLE tickets DROP CONSTRAINT tickets_status_check;
ALTER TABLE tickets ADD CONSTRAINT tickets_status_check
  CHECK (status IN ('open', 'pending', 'on_hold', 'resolved', 'closed'));`}
            />
            <CodeBlock
              title="Lookup table version"
              language="sql"
              code={`CREATE TABLE ticket_statuses (
  code       TEXT PRIMARY KEY,
  label      TEXT NOT NULL,
  sort_order SMALLINT NOT NULL,
  is_active  BOOLEAN NOT NULL DEFAULT true
);

INSERT INTO ticket_statuses (code, label, sort_order) VALUES
  ('open', 'Open', 1),
  ('pending', 'Waiting on customer', 2),
  ('resolved', 'Resolved', 3);

CREATE TABLE tickets (
  id     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  status TEXT NOT NULL REFERENCES ticket_statuses (code)
);

-- Adding a value is now just data
INSERT INTO ticket_statuses (code, label, sort_order)
VALUES ('on_hold', 'On hold', 4);`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

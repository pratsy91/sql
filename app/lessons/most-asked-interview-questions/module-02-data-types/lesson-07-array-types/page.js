import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 7: Array Types - Module 2 - Most Asked Interview Questions',
  description:
    'Most asked interview questions on PostgreSQL arrays — when to use an array, ANY and unnest, array vs junction table, GIN indexes, and Prisma scalar lists',
};

export default function MaiqM02L07ArrayTypes() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 7: Array Types</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Arrays are convenient. Interviews test whether you know they are 1-indexed, when a junction table is better, and how to query them.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="What is an array type in PostgreSQL?">
            <p>
              Any type can become an array by adding <code>[]</code>. A <code>TEXT[]</code> column stores a list of strings on the same row.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Postgres arrays are <strong>1-indexed</strong>, not 0-indexed. <code>tags[1]</code> is the first element</li>
              <li>Reading past the end returns NULL, not an error</li>
              <li>An empty array <code>{`'{}'`}</code> is not the same as NULL. NULL means &quot;unknown list&quot;. Empty means &quot;known, no items&quot;</li>
              <li>Declare <code>{`NOT NULL DEFAULT '{}'`}</code> so you do not have to handle both</li>
            </ul>
            <CodeBlock
              title="Array column"
              language="sql"
              code={`CREATE TABLE posts (
  id   BIGSERIAL PRIMARY KEY,
  tags TEXT[] NOT NULL DEFAULT '{}'
);

INSERT INTO posts (tags) VALUES (ARRAY['sql', 'postgres']);
SELECT tags[1] AS first_tag, array_length(tags, 1) AS n FROM posts;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="How do you check if an array contains a value?">
            <p>
              The two most asked operators are <code>ANY</code> and containment <code>@&gt;</code>.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><code>&apos;sql&apos; = ANY (tags)</code> is true if that string is in the list</li>
              <li><code>tags @&gt; ARRAY[&apos;postgres&apos;]</code> is true if the column contains every value on the right</li>
              <li><code>&amp;&amp;</code> means overlap: at least one value in common</li>
              <li><code>unnest(tags)</code> turns the array into rows so you can <code>GROUP BY</code></li>
            </ul>
            <CodeBlock
              title="Contains, overlap, unnest"
              language="sql"
              code={`SELECT * FROM posts WHERE 'sql' = ANY (tags);
SELECT * FROM posts WHERE tags @> ARRAY['postgres'];
SELECT * FROM posts WHERE tags && ARRAY['sql', 'postgres'];

SELECT tag, count(*)
FROM posts, unnest(tags) AS tag
GROUP BY tag
ORDER BY count(*) DESC;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="When would you use arrays in PostgreSQL?">
            <ul className="list-disc pl-6 space-y-1">
              <li>Small, ordered collections owned by the row (tags, roles) when you do not need to join as entities</li>
              <li>Operators: <code>ANY</code>, <code>ALL</code>, <code>@&gt;</code>, overlap</li>
              <li>GIN indexes help containment queries</li>
              <li>Prefer a junction table when the list is large, relational, or needs its own metadata</li>
              <li>Remember Postgres arrays are 1-indexed, not 0-indexed, and reading past the end gives NULL instead of an error</li>
            </ul>
            <CodeBlock
              title="Array column with a GIN index"
              language="sql"
              code={`CREATE INDEX posts_tags_gin ON posts USING GIN (tags);

SELECT * FROM posts WHERE tags @> ARRAY['postgres'];
SELECT * FROM posts WHERE 'sql' = ANY (tags);

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
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="What are the production pitfalls of array columns?">
            <ul className="list-disc pl-6 space-y-1">
              <li>A GIN index helps <code>@&gt;</code> and overlap. It does not help <code>tags[1] = &apos;sql&apos;</code> or <code>array_length</code> filters unless you add an expression index</li>
              <li><code>= ANY (array)</code> cannot use a B-tree on the array column the way <code>IN (select ...)</code> uses a B-tree on a normal column</li>
              <li>Updating one tag rewrites the whole row, including TOAST if the array is large</li>
              <li>NULL elements inside an array are allowed and surprise people: <code>ARRAY[1, NULL] @&gt; ARRAY[NULL]</code> is not true in the way they expect</li>
              <li>Multidimensional arrays exist, but almost nobody wants them in an application table. Use JSONB or a child table</li>
              <li>Prisma <code>String[]</code> maps to <code>TEXT[]</code>. There is no first-class mapping for integer arrays of foreign keys with referential integrity</li>
            </ul>
            <CodeBlock
              title="Empty vs NULL vs contains"
              language="sql"
              code={`SELECT '{}'::text[] IS NULL;          -- false
SELECT array_length('{}'::text[], 1); -- NULL, not 0
SELECT cardinality('{}'::text[]);     -- 0  (use this for counts)

SELECT ARRAY[1,2,3] @> ARRAY[2];      -- true
SELECT ARRAY[1,2,3] && ARRAY[3,9];    -- true`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

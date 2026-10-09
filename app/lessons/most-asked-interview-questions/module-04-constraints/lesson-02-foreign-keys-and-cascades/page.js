import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 2: Foreign Keys and Cascades - Module 4 - Most Asked Interview Questions',
  description:
    'Most asked interview questions on FOREIGN KEY constraints: ON DELETE CASCADE vs SET NULL vs RESTRICT, ON UPDATE CASCADE, NO ACTION vs RESTRICT, orphan rows, indexing FK columns, and Prisma onDelete.',
};

export default function M4L2ForeignKeysAndCascades() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 2: Foreign Keys and Cascades</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          A foreign key links a child row to a parent row. Most of the questions here are about what
          should happen to the child when the parent is deleted or changed.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="What is a FOREIGN KEY?">
            <p>A foreign key says this column must match a real row in another table (or be NULL). That is how the database keeps links valid.</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>The table that points is the <strong>child</strong>; the table it points at is the <strong>parent</strong></li>
              <li>The parent column must be a primary key or have a unique constraint</li>
              <li>If the child column allows NULL, NULL means “not linked to anything”</li>
              <li>Insert or update of a bad value is rejected, and so is deleting a parent that still has children (unless you chose another action)</li>
            </ul>
            <CodeBlock
              title="Foreign key"
              language="sql"
              code={`CREATE TABLE orders (
  id         BIGSERIAL PRIMARY KEY,
  user_id    BIGINT NOT NULL REFERENCES users (id),
  total      NUMERIC(12, 2) NOT NULL
);

-- Named constraint form
ALTER TABLE orders
  ADD CONSTRAINT orders_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users (id);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="What is an orphan row?">
            <p>
              An orphan row is a child row whose parent is gone. For example an order with
              <code>user_id = 42</code> when user 42 no longer exists. Reports break, joins silently drop rows,
              and nobody knows who the order belongs to.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>A foreign key is exactly the tool that prevents orphans — the database refuses the delete or cleans up for you</li>
              <li>Orphans usually appear in databases where the link exists only in application code</li>
              <li>They also appear after someone loads data with constraints disabled, or after a bulk delete run directly in a SQL console</li>
              <li>To find them, look for child rows with no matching parent, then fix the data before adding the constraint</li>
            </ul>
            <CodeBlock
              title="Find orphans before adding the FK"
              language="sql"
              code={`SELECT o.id, o.user_id
FROM orders o
LEFT JOIN users u ON u.id = o.user_id
WHERE o.user_id IS NOT NULL
  AND u.id IS NULL;

-- Clean up, then protect the table going forward
DELETE FROM orders
WHERE user_id IS NOT NULL
  AND user_id NOT IN (SELECT id FROM users);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="Explain ON DELETE CASCADE, SET NULL, and RESTRICT.">
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>CASCADE:</strong> Deleting parent deletes child rows</li>
              <li><strong>SET NULL:</strong> Child FK columns become NULL (column must be nullable)</li>
              <li><strong>RESTRICT / NO ACTION:</strong> Block parent delete if children exist (most common default behavior)</li>
              <li><strong>SET DEFAULT:</strong> Set child FK to its default value</li>
              <li>Same options exist for <code>ON UPDATE</code></li>
            </ul>
            <CodeBlock
              title="FK delete actions"
              language="sql"
              code={`CREATE TABLE posts (
  id      BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE comments (
  id      BIGSERIAL PRIMARY KEY,
  post_id BIGINT REFERENCES posts (id) ON DELETE SET NULL
);`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="Should you index foreign key columns?">
            <p>
              Yes, almost always index the child (referencing) column yourself. Postgres creates an index
              on the parent side automatically because that side is a primary key or unique, but it does
              <strong> not</strong> create one on the child side.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Without it, every delete or key update on the parent has to scan the whole child table to check for children</li>
              <li>You also join on that column constantly (“all orders for this user”), so the index pays for itself</li>
              <li><code>ON DELETE CASCADE</code> without the index is a classic cause of a “simple delete” taking minutes</li>
              <li>Cost is the usual index cost: extra space and a bit of write overhead</li>
              <li>If the FK is part of a composite index that already starts with that column, you do not need a second index</li>
            </ul>
            <CodeBlock
              title="Index the referencing side"
              language="sql"
              code={`CREATE INDEX orders_user_id_idx ON orders (user_id);

-- On a live table, build without blocking writes
CREATE INDEX CONCURRENTLY orders_user_id_idx ON orders (user_id);

-- Rough check: FK constraints whose first column does not lead any index
SELECT c.conrelid::regclass AS child_table, c.conname
FROM pg_constraint c
WHERE c.contype = 'f'
  AND NOT EXISTS (
    SELECT 1
    FROM pg_index i
    WHERE i.indrelid = c.conrelid
      AND i.indkey[0] = c.conkey[1]
  );`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What does ON UPDATE CASCADE do, and when do you need it?">
            <p>
              <code>ON UPDATE CASCADE</code> means: if the parent key value changes, copy the new value into
              every child row automatically.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>It only matters when the parent key can change. With a surrogate id that never changes, it never fires</li>
              <li>It is useful with natural keys, for example a country code or a username used as the key</li>
              <li>Changing a key that thousands of rows reference means rewriting all those rows and their indexes, which can be slow and lock-heavy</li>
              <li>This is one more argument for an immutable surrogate primary key plus a unique natural column</li>
            </ul>
            <CodeBlock
              title="ON UPDATE CASCADE with a natural key"
              language="sql"
              code={`CREATE TABLE countries (
  code TEXT PRIMARY KEY,        -- natural key that could be corrected later
  name TEXT NOT NULL
);

CREATE TABLE cities (
  id           BIGSERIAL PRIMARY KEY,
  country_code TEXT NOT NULL REFERENCES countries (code)
                 ON UPDATE CASCADE
                 ON DELETE RESTRICT,
  name         TEXT NOT NULL
);

-- Every cities.country_code = 'UK' becomes 'GB' automatically
UPDATE countries SET code = 'GB' WHERE code = 'UK';`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What is the difference between NO ACTION and RESTRICT?">
            <p>
              Both refuse to let you break the link. The difference is <em>when</em> the check happens.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>RESTRICT:</strong> the error is raised right away, as part of the statement. It can never be deferred</li>
              <li><strong>NO ACTION (the default):</strong> the check runs at the end of the statement, and can be pushed to commit time if the constraint is <code>DEFERRABLE</code></li>
              <li>That delay matters in one real case: you delete the parent and, in the same statement or transaction, also delete or repoint the children. <code>NO ACTION</code> deferred lets that succeed; <code>RESTRICT</code> fails immediately</li>
              <li>For everyday schemas the visible behaviour is the same, so people use the words as if they were synonyms</li>
            </ul>
            <CodeBlock
              title="Deferred NO ACTION lets a swap succeed"
              language="sql"
              code={`CREATE TABLE child (
  id        BIGSERIAL PRIMARY KEY,
  parent_id BIGINT NOT NULL REFERENCES parent (id)
              ON DELETE NO ACTION
              DEFERRABLE INITIALLY DEFERRED
);

BEGIN;
DELETE FROM parent WHERE id = 1;          -- allowed for now, not checked yet
UPDATE child SET parent_id = 2 WHERE parent_id = 1;
COMMIT;                                    -- checked here, and it passes`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How do you map FK onDelete behavior in Prisma?">
            <ul className="list-disc pl-6 space-y-1">
              <li>Use <code>onDelete</code> on <code>@relation</code>: <code>Cascade</code>, <code>SetNull</code>, <code>Restrict</code>, <code>NoAction</code>, <code>SetDefault</code></li>
              <li>Must match nullable FK fields when using <code>SetNull</code></li>
              <li><code>@@unique</code> / <code>@@id</code> define uniqueness; <code>@relation</code> defines referential actions</li>
              <li><code>onUpdate</code> works the same way and defaults to <code>Cascade</code> in Prisma, which is worth knowing if you use natural keys</li>
            </ul>
            <CodeBlock
              title="Prisma onDelete"
              language="typescript"
              code={`model User {
  id    Int    @id @default(autoincrement())
  posts Post[]
}

model Post {
  id     Int  @id @default(autoincrement())
  userId Int
  user   User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Comment {
  id     Int   @id @default(autoincrement())
  postId Int?
  post   Post? @relation(fields: [postId], references: [id], onDelete: SetNull)
}`}
            />
            <CodeBlock
              title="Index the FK in Prisma"
              language="typescript"
              code={`model Order {
  id     Int  @id @default(autoincrement())
  userId Int
  user   User @relation(fields: [userId], references: [id], onDelete: Restrict)

  @@index([userId])   // Prisma does not add this for you
}`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="How do you choose a delete action for a real production schema?">
            <p>
              Ask one question per relationship: can the child exist on its own? If not, cascade. If yes,
              keep it and unlink it. If deleting the parent should be a deliberate act, block it.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Owned detail rows</strong> (order items, post tags, tokens): <code>CASCADE</code>. The child is meaningless without the parent</li>
              <li><strong>Financial or audit records</strong> (invoices, payments, logs): <code>RESTRICT</code>, or never delete the parent at all and soft delete instead</li>
              <li><strong>Optional link</strong> (a post moved out of a deleted category): <code>SET NULL</code></li>
              <li>Cascades chain. Deleting one user can delete a long tree of rows in one transaction, taking many locks and writing a lot of WAL. Know the blast radius before you enable it</li>
              <li>For large cleanups, delete in batches from the leaves upward instead of relying on one giant cascading delete</li>
            </ul>
            <CodeBlock
              title="Batched delete from the leaves up"
              language="sql"
              code={`-- Repeat until zero rows affected, so each transaction stays short
DELETE FROM order_items
WHERE id IN (
  SELECT oi.id
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id
  WHERE o.user_id = 42
  LIMIT 5000
);

DELETE FROM orders WHERE user_id = 42;
DELETE FROM users WHERE id = 42;`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

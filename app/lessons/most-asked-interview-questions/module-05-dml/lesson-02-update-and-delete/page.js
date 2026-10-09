import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 2: UPDATE and DELETE - Module 5 - Most Asked Interview Questions',
  description:
    'Most asked interview questions on UPDATE and DELETE: safe writes, forgetting WHERE, UPDATE ... FROM joins, DELETE with RETURNING, soft vs hard delete, DELETE vs TRUNCATE vs DROP, and Prisma updateMany / deleteMany.',
};

export default function M5L2UpdateAndDelete() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 2: UPDATE and DELETE</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Changing and removing rows is where real accidents happen. These questions are about doing it
          safely, and about the three very different ways to make rows disappear.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="How do you UPDATE and DELETE rows safely?">
            <ul className="list-disc pl-6 space-y-1">
              <li>Always use a precise <code>WHERE</code> — missing WHERE updates/deletes the whole table</li>
              <li>Prefer transactions and <code>RETURNING</code> to verify impact</li>
              <li>In apps, soft-delete (<code>deleted_at</code>) is common vs hard delete</li>
              <li>Run the <code>WHERE</code> as a <code>SELECT count(*)</code> first, so you know how many rows you are about to touch</li>
              <li>Update by primary key whenever you can. It is the one filter that cannot accidentally match extra rows</li>
            </ul>
            <CodeBlock
              title="UPDATE and DELETE"
              language="sql"
              code={`BEGIN;
UPDATE products
SET price = price * 1.1
WHERE category = 'electronics'
RETURNING id, price;

DELETE FROM sessions
WHERE expires_at < now()
RETURNING id;
COMMIT;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="What happens if you forget the WHERE clause?">
            <p>
              Every row in the table is changed or removed. There is no confirmation prompt. An
              <code> UPDATE users SET name = &apos;x&apos;</code> rewrites all ten million rows.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>If you are still inside a transaction, <code>ROLLBACK</code> undoes it completely. This is the main reason to type <code>BEGIN;</code> before any manual write</li>
              <li>If autocommit was on and it committed, the data is gone and you are into point-in-time recovery from backups</li>
              <li>The row count in the response is your warning sign: expecting 1 and seeing <code>UPDATE 9412031</code> means stop and roll back</li>
              <li>Habits that prevent it: write the <code>WHERE</code> first and the <code>SET</code> second, run it as a <code>SELECT</code> first, and use <code>RETURNING</code> so you see what changed</li>
              <li>psql has <code>\set ON_ERROR_ROLLBACK</code> and many GUI tools have a “safe update” mode that refuses a write with no <code>WHERE</code></li>
              <li>Best protection long term: production write access goes through reviewed code, not a console</li>
            </ul>
            <CodeBlock
              title="Check first, then commit"
              language="sql"
              code={`-- 1. How many rows will this touch?
SELECT count(*) FROM products WHERE category = 'electronics';

-- 2. Do it inside a transaction
BEGIN;
UPDATE products SET price = price * 1.1 WHERE category = 'electronics';
-- Postgres replies: UPDATE 128   <- does that number look right?
ROLLBACK;   -- or COMMIT; once you are sure`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="DELETE vs TRUNCATE vs DROP — what is the difference?">
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>DELETE:</strong> Removes rows (optional WHERE); fires triggers; MVCC row cleanup later; can roll back</li>
              <li><strong>TRUNCATE:</strong> Quickly empties a table; resets identity/sequences optionally; cannot WHERE; still transactional in PG</li>
              <li><strong>DROP:</strong> Removes the table definition and data entirely</li>
              <li>Rule of thumb: <code>DELETE</code> for some rows, <code>TRUNCATE</code> for all rows, <code>DROP</code> when the table itself should not exist</li>
            </ul>
            <CodeBlock
              title="DELETE / TRUNCATE / DROP"
              language="sql"
              code={`DELETE FROM logs WHERE created_at < now() - interval '30 days';
TRUNCATE TABLE staging_import RESTART IDENTITY;
DROP TABLE IF EXISTS staging_import;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="How do you UPDATE one table using values from another table?">
            <p>
              PostgreSQL uses <code>UPDATE ... SET ... FROM other_table WHERE join condition</code>. There is no
              <code> UPDATE ... JOIN</code> syntax like MySQL has.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>The table being updated is named once, after <code>UPDATE</code>. Do not repeat it in <code>FROM</code>, or you create an accidental self join that updates far too many rows</li>
              <li>The join condition goes in <code>WHERE</code>, together with any extra filters</li>
              <li>If the <code>FROM</code> side matches several rows for one target row, Postgres picks one of them, and which one is not defined. Aggregate first when that can happen</li>
              <li><code>DELETE ... USING</code> is the same pattern for deletes</li>
              <li>An alternative for a single computed value is a correlated scalar subquery in <code>SET</code></li>
            </ul>
            <CodeBlock
              title="UPDATE ... FROM"
              language="sql"
              code={`-- Copy the customer tier onto recent orders
UPDATE orders o
SET tier = c.tier
FROM customers c
WHERE c.id = o.customer_id
  AND o.created_at >= current_date - 7;

-- Aggregate first so each order matches exactly one row
UPDATE orders o
SET item_total = t.total
FROM (
  SELECT order_id, sum(qty * unit_price) AS total
  FROM order_items
  GROUP BY order_id
) t
WHERE t.order_id = o.id;

-- Scalar subquery alternative
UPDATE orders o
SET item_count = (
  SELECT count(*) FROM order_items i WHERE i.order_id = o.id
);

-- DELETE with a join
DELETE FROM order_items i
USING orders o
WHERE o.id = i.order_id
  AND o.status = 'cancelled';`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How do you use DELETE ... RETURNING?">
            <p>
              <code>RETURNING</code> hands back the rows that were just deleted. You get a receipt of exactly
              what disappeared, in the same statement.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Useful for logging, for reporting how many rows a cleanup job removed, and for verifying a manual delete before you commit</li>
              <li>Combined with a CTE it becomes “move rows”: delete from the live table and insert the returned rows into an archive table atomically</li>
              <li>It is also the queue pattern: claim and remove a job in one statement so two workers cannot take the same job</li>
            </ul>
            <CodeBlock
              title="DELETE ... RETURNING"
              language="sql"
              code={`DELETE FROM sessions
WHERE expires_at < now()
RETURNING id, user_id;

-- Archive as you delete
WITH removed AS (
  DELETE FROM notifications
  WHERE read_at IS NOT NULL
    AND read_at < now() - interval '90 days'
  RETURNING *
)
INSERT INTO notifications_archive
SELECT * FROM removed;

-- Pop one job off a queue safely
DELETE FROM job_queue
WHERE id = (
  SELECT id FROM job_queue
  ORDER BY created_at
  FOR UPDATE SKIP LOCKED
  LIMIT 1
)
RETURNING *;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Soft delete or hard delete — how do you choose?">
            <p>
              A hard delete removes the row. A soft delete keeps the row and marks it, usually with a
              <code> deleted_at</code> timestamp, and every query then filters on it.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Soft delete wins when</strong> users need undo, when auditors or regulators need history, when other rows still reference the record, or when deleting would cascade into important data</li>
              <li><strong>Hard delete wins when</strong> the data is disposable (expired sessions, cache rows, logs), when privacy rules require real erasure, or when the table must stay small and fast</li>
              <li>Costs of soft delete: every single query must remember the filter, or deleted rows leak into the UI. Use a view or a Prisma extension so the filter cannot be forgotten</li>
              <li>Unique constraints need care, because a deleted row still occupies the email. A partial unique index <code>WHERE deleted_at IS NULL</code> is the fix</li>
              <li>The table keeps growing, so indexes get bigger and scans get slower. Many teams soft delete first, then purge or archive after a retention window</li>
              <li>“Right to be forgotten” requests need a real delete or an anonymisation step, so plan a purge job even if you soft delete day to day</li>
            </ul>
            <CodeBlock
              title="Soft delete pattern"
              language="sql"
              code={`ALTER TABLE users ADD COLUMN deleted_at TIMESTAMPTZ;

-- "Delete"
UPDATE users SET deleted_at = now() WHERE id = 42;

-- Every read must filter
SELECT * FROM users WHERE deleted_at IS NULL;

-- Make it hard to forget
CREATE VIEW active_users AS
  SELECT * FROM users WHERE deleted_at IS NULL;

-- Uniqueness that ignores deleted rows
CREATE UNIQUE INDEX users_live_email_uidx
  ON users (email) WHERE deleted_at IS NULL;

-- Purge later, in batches
DELETE FROM users
WHERE deleted_at < now() - interval '180 days';`}
            />
            <CodeBlock
              title="Prisma soft delete"
              language="typescript"
              code={`await prisma.user.update({
  where: { id: 42 },
  data: { deletedAt: new Date() },
});

const users = await prisma.user.findMany({
  where: { deletedAt: null },
});`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How do you update or delete many rows with Prisma?">
            <CodeBlock
              title="updateMany / deleteMany"
              language="typescript"
              code={`await prisma.session.deleteMany({
  where: { expiresAt: { lt: new Date() } },
});

await prisma.product.updateMany({
  where: { category: 'electronics' },
  data: { price: { multiply: 1.1 } }, // or set absolute values
});`}
            />
            <ul className="list-disc pl-6 space-y-1">
              <li>Both return only a count, such as <code>{'{ count: 128 }'}</code>, not the affected rows</li>
              <li><code>updateMany</code> with an empty <code>where</code> updates the whole table, exactly like a missing <code>WHERE</code></li>
              <li><code>update</code> throws <code>P2025</code> when no row matches; <code>updateMany</code> quietly reports a count of zero</li>
              <li>Atomic number helpers are <code>increment</code>, <code>decrement</code>, <code>multiply</code>, and <code>divide</code>. They become real SQL arithmetic, so no read-modify-write race</li>
            </ul>
            <p>Note: for complex expressions, prefer <code>$executeRaw</code> / SQL for clarity and performance.</p>
            <CodeBlock
              title="Raw SQL when the expression is complex"
              language="typescript"
              code={`const rows = await prisma.$executeRawUnsafe(
  'UPDATE orders o SET tier = c.tier FROM customers c WHERE c.id = o.customer_id'
);`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="When is TRUNCATE preferable to DELETE, and what are the gotchas?">
            <ul className="list-disc pl-6 space-y-1">
              <li>Prefer TRUNCATE to empty large tables quickly (minimal WAL vs row-by-row DELETE)</li>
              <li>Requires stronger locks; cannot delete a subset with WHERE</li>
              <li>By default cannot truncate if FK references exist unless <code>CASCADE</code> (dangerous)</li>
              <li>Still transactional in PostgreSQL — can ROLLBACK unlike some other databases’ folklore</li>
              <li><code>TRUNCATE</code> takes an <code>ACCESS EXCLUSIVE</code> lock, so even readers wait. On a busy table, set a <code>lock_timeout</code> and retry rather than blocking everything</li>
              <li>It does not fire per-row triggers, only statement-level ones, so audit triggers will not see the rows leave</li>
              <li>It does not reset sequences unless you ask with <code>RESTART IDENTITY</code></li>
              <li><code>DELETE</code> leaves dead rows for autovacuum and does not shrink the file; after a massive delete you may still need <code>VACUUM FULL</code> or a rewrite to reclaim disk</li>
            </ul>
            <CodeBlock
              title="TRUNCATE options"
              language="sql"
              code={`SET lock_timeout = '3s';

-- Empty several tables together, reset their id sequences
TRUNCATE TABLE order_items, orders RESTART IDENTITY;

-- CASCADE also truncates every table referencing these ones: know the list first
TRUNCATE TABLE users CASCADE;`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

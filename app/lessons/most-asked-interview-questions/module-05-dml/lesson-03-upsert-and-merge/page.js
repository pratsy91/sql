import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 3: UPSERT and MERGE - Module 5 - Most Asked Interview Questions',
  description:
    'Most asked interview questions on UPSERT: ON CONFLICT DO NOTHING vs DO UPDATE, what EXCLUDED means, deleting duplicate rows keeping the lowest id, Prisma upsert, and MERGE in PostgreSQL 15+.',
};

export default function M5L3UpsertAndMerge() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 3: UPSERT and MERGE</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Upsert means “insert this row, but if it already exists, update it instead.” It is the standard
          answer to the race condition you get from checking first and then inserting.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="How does UPSERT work with ON CONFLICT?">
            <ul className="list-disc pl-6 space-y-1">
              <li>Insert a row; if a unique constraint/index conflicts, update (or do nothing)</li>
              <li>Specify conflict target: column(s) or constraint name</li>
              <li><code>EXCLUDED</code> refers to the row that was proposed for insert</li>
              <li>It is atomic. Two concurrent requests for the same email cannot both insert, and neither one errors out</li>
              <li>There must be a unique constraint or unique index on the conflict target, otherwise Postgres has no way to detect the conflict</li>
            </ul>
            <CodeBlock
              title="ON CONFLICT upsert"
              language="sql"
              code={`INSERT INTO users (email, name, login_count)
VALUES ('ada@example.com', 'Ada', 1)
ON CONFLICT (email)
DO UPDATE SET
  name = EXCLUDED.name,
  login_count = users.login_count + 1,
  updated_at = now()
RETURNING *;

INSERT INTO tags (name)
VALUES ('postgres')
ON CONFLICT (name) DO NOTHING;`}
            />
            <CodeBlock
              title="Target a named constraint instead of columns"
              language="sql"
              code={`INSERT INTO memberships (org_id, user_id, role)
VALUES (1, 7, 'admin')
ON CONFLICT ON CONSTRAINT memberships_org_id_user_id_key
DO UPDATE SET role = EXCLUDED.role;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What does EXCLUDED mean in ON CONFLICT DO UPDATE?">
            <p>
              <code>EXCLUDED</code> is the row you tried to insert — the one that got <em>excluded</em> because
              of the conflict. The table name refers to the row already stored. Having both lets you combine
              old and new values.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><code>EXCLUDED.qty</code> is the incoming value; <code>inventory.qty</code> is the value on disk</li>
              <li>So <code>SET qty = inventory.qty + EXCLUDED.qty</code> means “add the new amount to what is there”, while <code>SET qty = EXCLUDED.qty</code> means “overwrite”</li>
              <li><code>EXCLUDED</code> includes defaults that were computed for the attempted insert, so it is a complete row, not just the columns you listed</li>
              <li>You can also add a <code>WHERE</code> after the <code>DO UPDATE SET</code> to skip pointless writes, for example only update when the value actually changed</li>
              <li>It exists only inside the <code>DO UPDATE</code> clause. You cannot use it in <code>DO NOTHING</code> or elsewhere</li>
            </ul>
            <CodeBlock
              title="Old row vs EXCLUDED row"
              language="sql"
              code={`INSERT INTO inventory (product_id, qty, updated_at)
VALUES (10, 5, now())
ON CONFLICT (product_id)
DO UPDATE SET
  qty        = inventory.qty + EXCLUDED.qty,  -- add to the stored amount
  updated_at = EXCLUDED.updated_at            -- take the incoming timestamp
RETURNING product_id, qty;

-- Keep whichever value is newer, and skip no-op updates
INSERT INTO prices (sku, amount, seen_at)
VALUES ('ABC', 19.99, now())
ON CONFLICT (sku)
DO UPDATE SET
  amount  = EXCLUDED.amount,
  seen_at = EXCLUDED.seen_at
WHERE prices.amount IS DISTINCT FROM EXCLUDED.amount;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="ON CONFLICT DO NOTHING vs DO UPDATE — which do you pick?">
            <p>
              <code>DO NOTHING</code> means “if it is already there, leave it alone and do not error.”
              <code> DO UPDATE</code> means “if it is already there, refresh it with my values.”
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>DO NOTHING</strong> fits idempotent inserts: a tag list, a seed script, replaying a message you may have already processed. First write wins</li>
              <li><strong>DO UPDATE</strong> fits syncing from an external source, counters, and “last write wins” caches. Latest write wins</li>
              <li><code>DO NOTHING</code> can skip the conflict target entirely, and then it swallows <em>any</em> unique or exclusion conflict on the table. That is convenient and also a way to hide a real bug, so naming the target is safer</li>
              <li>Big difference with <code>RETURNING</code>: <code>DO NOTHING</code> returns no row when it skipped, so your code cannot tell “already existed” from “inserted” without extra work. <code>DO UPDATE</code> always returns the row</li>
              <li><code>DO NOTHING</code> takes no row lock on the existing row, so it is cheaper on hot keys. <code>DO UPDATE</code> locks and writes a new row version even when nothing really changed</li>
            </ul>
            <CodeBlock
              title="Telling insert apart from conflict"
              language="sql"
              code={`-- Returns nothing if the tag already existed
INSERT INTO tags (name) VALUES ('postgres')
ON CONFLICT (name) DO NOTHING
RETURNING id;

-- Always gives you the id, inserted or not
INSERT INTO tags (name) VALUES ('postgres')
ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
RETURNING id, (xmax = 0) AS was_inserted;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How do you delete duplicate rows and keep the one with the lowest id?">
            <p>
              A very common live-coding question. Group the rows by whatever makes them duplicates, keep the
              smallest id in each group, and delete the rest.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Simplest version: <code>DELETE ... WHERE id NOT IN (SELECT min(id) ... GROUP BY email)</code></li>
              <li>A self join version is usually faster on large tables: delete <code>a</code> where a matching <code>b</code> has a smaller id</li>
              <li>The general version uses <code>ROW_NUMBER()</code> partitioned by the duplicate key, which lets you choose the survivor by any rule, such as newest login or most complete profile</li>
              <li>Always run the <code>SELECT</code> form first and count what would go. Then wrap the delete in a transaction</li>
              <li>Repoint child rows to the surviving id <em>before</em> deleting, or foreign keys will block you (or cascades will delete real data)</li>
              <li>Finish the job by adding the unique constraint, otherwise the duplicates come back tomorrow</li>
            </ul>
            <CodeBlock
              title="Three ways to de-duplicate"
              language="sql"
              code={`-- 1. Keep the lowest id per email
DELETE FROM users
WHERE id NOT IN (
  SELECT min(id) FROM users GROUP BY email
);

-- 2. Self join: usually the fastest on big tables
DELETE FROM users a
USING users b
WHERE a.email = b.email
  AND a.id > b.id;

-- 3. ROW_NUMBER: pick the survivor by any rule you like
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY lower(email)
           ORDER BY last_login_at DESC NULLS LAST, id
         ) AS rn
  FROM users
)
DELETE FROM users u
USING ranked r
WHERE u.id = r.id AND r.rn > 1;

-- Then stop it happening again
CREATE UNIQUE INDEX CONCURRENTLY users_email_uidx ON users (email);`}
            />
            <CodeBlock
              title="Move children to the survivor first"
              language="sql"
              code={`WITH keep AS (
  SELECT lower(email) AS email_key, min(id) AS keep_id
  FROM users
  GROUP BY lower(email)
)
UPDATE orders o
SET user_id = k.keep_id
FROM users u
JOIN keep k ON k.email_key = lower(u.email)
WHERE o.user_id = u.id
  AND o.user_id <> k.keep_id;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How does Prisma upsert work?">
            <p>
              <code>prisma.model.upsert</code> takes a <code>where</code> on a unique field, a
              <code> create</code> block for the new row, and an <code>update</code> block for the existing one.
            </p>
            <CodeBlock
              title="Prisma upsert"
              language="typescript"
              code={`await prisma.user.upsert({
  where: { email: 'ada@example.com' },
  create: { email: 'ada@example.com', name: 'Ada', loginCount: 1 },
  update: { name: 'Ada', loginCount: { increment: 1 } },
});`}
            />
            <ul className="list-disc pl-6 space-y-1">
              <li>The <code>where</code> must use a unique field or a unique combination, because that is the conflict target</li>
              <li>For a simple single-table case Prisma emits a real <code>INSERT ... ON CONFLICT DO UPDATE</code>, so it is atomic</li>
              <li>With nested writes or a non-unique filter it falls back to a find, then an insert or update, inside a transaction. Under heavy concurrency that path can still raise <code>P2002</code>, so keep a retry</li>
              <li>There is no bulk upsert. For many rows, loop inside a transaction, or write one raw <code>INSERT ... SELECT ... ON CONFLICT</code> statement</li>
              <li><code>createMany</code> with <code>skipDuplicates</code> is the bulk equivalent of <code>DO NOTHING</code>, not of <code>DO UPDATE</code></li>
            </ul>
            <CodeBlock
              title="Bulk upsert needs raw SQL"
              language="typescript"
              code={`await prisma.$executeRawUnsafe(
  'INSERT INTO inventory (product_id, qty) ' +
  'SELECT * FROM unnest($1::bigint[], $2::int[]) ' +
  'ON CONFLICT (product_id) DO UPDATE SET qty = inventory.qty + EXCLUDED.qty',
  productIds,
  quantities
);`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="What is MERGE in PostgreSQL 15+, and how does it compare to ON CONFLICT?">
            <ul className="list-disc pl-6 space-y-1">
              <li><code>MERGE</code> (PG 15+) matches a source to a target and runs conditional INSERT/UPDATE/DELETE</li>
              <li>More expressive when multiple actions depend on match/not-matched</li>
              <li><code>ON CONFLICT</code> remains the idiomatic upsert for single-table insert races</li>
              <li>Know both — interviews often ask “UPSERT vs MERGE”</li>
              <li>Key difference: <code>MERGE</code> decides by a join condition, so it does <strong>not</strong> need a unique constraint. That also means it is not race-proof; two concurrent MERGEs can both see “not matched” and both insert</li>
              <li><code>ON CONFLICT</code> relies on the unique index, which is exactly what makes it safe under concurrency</li>
              <li>So the rule is: <code>ON CONFLICT</code> for concurrent application writes, <code>MERGE</code> for batch or ETL work where you control who is writing</li>
              <li>Until PG 17, <code>MERGE</code> did not support <code>RETURNING</code></li>
            </ul>
            <CodeBlock
              title="MERGE (PostgreSQL 15+)"
              language="sql"
              code={`MERGE INTO inventory AS t
USING (VALUES (1, 10), (2, 5)) AS s(product_id, qty)
ON t.product_id = s.product_id
WHEN MATCHED THEN
  UPDATE SET qty = t.qty + s.qty
WHEN NOT MATCHED THEN
  INSERT (product_id, qty) VALUES (s.product_id, s.qty);`}
            />
            <CodeBlock
              title="Three outcomes in one statement"
              language="sql"
              code={`MERGE INTO stock AS t
USING daily_feed AS s
ON t.sku = s.sku
WHEN MATCHED AND s.qty = 0 THEN
  DELETE
WHEN MATCHED AND t.qty <> s.qty THEN
  UPDATE SET qty = s.qty, updated_at = now()
WHEN NOT MATCHED THEN
  INSERT (sku, qty) VALUES (s.sku, s.qty);`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

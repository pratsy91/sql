import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';
import InterviewQACard from '../../../components/InterviewQACard';

export const metadata = {
  title: 'Module 5: DML - Most Asked Interview Questions',
  description:
    'Most asked interview questions on PostgreSQL DML covering junior to senior — INSERT RETURNING, UPDATE, DELETE vs TRUNCATE, UPSERT, COPY, MERGE, bulk patterns, and Prisma Client writes',
};

export default function Module5DML() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Module 5: DML</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Most asked interview questions for Phase 5 — Junior → Senior. Includes PostgreSQL (latest) and Prisma where relevant.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="What is DML?">
            <p>DML (Data Manipulation Language) changes or reads row data inside existing tables.</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Core write statements: <code>INSERT</code>, <code>UPDATE</code>, <code>DELETE</code></li>
              <li>Often discussed with <code>SELECT</code> (technically DQL) and <code>MERGE</code> / upsert patterns</li>
              <li>Works inside transactions for atomic multi-step changes</li>
            </ul>
          </InterviewQACard>

          <InterviewQACard level="Junior" question="How does INSERT ... RETURNING work?">
            <ul className="list-disc pl-6 space-y-1">
              <li>Returns columns from the inserted row(s) without a separate <code>SELECT</code></li>
              <li>Ideal for getting generated IDs, defaults, and timestamps</li>
              <li>Works with <code>UPDATE</code> and <code>DELETE</code> too</li>
            </ul>
            <CodeBlock
              title="INSERT RETURNING"
              language="sql"
              code={`INSERT INTO users (email, name)
VALUES ('ada@example.com', 'Ada')
RETURNING id, created_at;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="How do you UPDATE and DELETE rows safely?">
            <ul className="list-disc pl-6 space-y-1">
              <li>Always use a precise <code>WHERE</code> — missing WHERE updates/deletes the whole table</li>
              <li>Prefer transactions and <code>RETURNING</code> to verify impact</li>
              <li>In apps, soft-delete (<code>deleted_at</code>) is common vs hard delete</li>
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

          <InterviewQACard level="Junior" question="DELETE vs TRUNCATE vs DROP — what is the difference?">
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>DELETE:</strong> Removes rows (optional WHERE); fires triggers; MVCC row cleanup later; can roll back</li>
              <li><strong>TRUNCATE:</strong> Quickly empties a table; resets identity/sequences optionally; cannot WHERE; still transactional in PG</li>
              <li><strong>DROP:</strong> Removes the table definition and data entirely</li>
            </ul>
            <CodeBlock
              title="DELETE / TRUNCATE / DROP"
              language="sql"
              code={`DELETE FROM logs WHERE created_at < now() - interval '30 days';
TRUNCATE TABLE staging_import RESTART IDENTITY;
DROP TABLE IF EXISTS staging_import;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="How do Prisma create and update map to SQL?">
            <CodeBlock
              title="Prisma create / update"
              language="typescript"
              code={`const user = await prisma.user.create({
  data: { email: 'ada@example.com', name: 'Ada' },
});

const updated = await prisma.user.update({
  where: { id: user.id },
  data: { name: 'Ada Lovelace' },
});

await prisma.user.delete({ where: { id: user.id } });`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="How does UPSERT work with ON CONFLICT?">
            <ul className="list-disc pl-6 space-y-1">
              <li>Insert a row; if a unique constraint/index conflicts, update (or do nothing)</li>
              <li>Specify conflict target: column(s) or constraint name</li>
              <li><code>EXCLUDED</code> refers to the row that was proposed for insert</li>
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
              title="Prisma upsert"
              language="typescript"
              code={`await prisma.user.upsert({
  where: { email: 'ada@example.com' },
  create: { email: 'ada@example.com', name: 'Ada', loginCount: 1 },
  update: { name: 'Ada', loginCount: { increment: 1 } },
});`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What is COPY and when do you use it?">
            <ul className="list-disc pl-6 space-y-1">
              <li><code>COPY</code> bulk-loads or exports data efficiently (CSV/binary)</li>
              <li>Much faster than thousands of single-row inserts</li>
              <li><code>COPY ... FROM STDIN</code> used by drivers and tools; server-side <code>FROM 'file'</code> needs filesystem access</li>
              <li><code>\\copy</code> in psql runs client-side and is preferred for local files</li>
            </ul>
            <CodeBlock
              title="COPY examples"
              language="sql"
              code={`COPY staging_users (email, name)
FROM STDIN WITH (FORMAT csv, HEADER true);

\\copy products FROM 'products.csv' WITH (FORMAT csv, HEADER true);

COPY orders TO STDOUT WITH (FORMAT csv, HEADER true);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What bulk insert patterns are commonly asked?">
            <ul className="list-disc pl-6 space-y-1">
              <li>Multi-row <code>INSERT INTO t VALUES (...), (...), (...)</code></li>
              <li><code>INSERT ... SELECT</code> from staging tables</li>
              <li><code>COPY</code> for very large loads</li>
              <li>Batch size trade-off: fewer round-trips vs memory and lock duration</li>
            </ul>
            <CodeBlock
              title="Multi-row insert"
              language="sql"
              code={`INSERT INTO events (user_id, event_type)
VALUES
  (1, 'login'),
  (1, 'view'),
  (2, 'login');`}
            />
            <CodeBlock
              title="Prisma createMany"
              language="typescript"
              code={`await prisma.event.createMany({
  data: [
    { userId: 1, eventType: 'login' },
    { userId: 1, eventType: 'view' },
    { userId: 2, eventType: 'login' },
  ],
  skipDuplicates: true, // ON CONFLICT DO NOTHING style when unique would collide
});`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What does Prisma skipDuplicates do?">
            <ul className="list-disc pl-6 space-y-1">
              <li>On <code>createMany</code>, maps to ignoring unique conflicts (PostgreSQL: <code>ON CONFLICT DO NOTHING</code>)</li>
              <li>Does not update existing rows — use <code>upsert</code> or raw SQL for true upserts in bulk</li>
              <li><code>createMany</code> does not return created rows on most databases</li>
            </ul>
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
            <p>Note: for complex expressions, prefer <code>$executeRaw</code> / SQL for clarity and performance.</p>
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
          </InterviewQACard>

          <InterviewQACard level="Senior" question="How do you design bulk loads without hurting live traffic?">
            <ul className="list-disc pl-6 space-y-1">
              <li>Load into a staging UNLOGGED/temp table, validate, then insert into live tables</li>
              <li>Batch commits; avoid one multi-hour transaction (vacuum/xmin horizon issues)</li>
              <li>Drop/disable nonessential indexes during huge loads, then rebuild (with care)</li>
              <li>Watch WAL volume, autovacuum, and replication lag on replicas</li>
            </ul>
            <CodeBlock
              title="Staging then promote"
              language="sql"
              code={`CREATE TABLE staging_users (LIKE users INCLUDING DEFAULTS);

\\copy staging_users (email, name) FROM 'users.csv' CSV HEADER;

INSERT INTO users (email, name)
SELECT email, name FROM staging_users
ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="What concurrency issues appear with UPDATE/DELETE at scale?">
            <ul className="list-disc pl-6 space-y-1">
              <li>Row-level locks: two transactions updating the same row queue or abort on serialization failures</li>
              <li>Hot rows (counters, inventory) become bottlenecks — consider queues, sharding keys, or advisory locks</li>
              <li><code>SELECT ... FOR UPDATE SKIP LOCKED</code> for worker job claims</li>
              <li>Idempotent retries for transient unique violations and deadlocks</li>
            </ul>
            <CodeBlock
              title="SKIP LOCKED job claim"
              language="sql"
              code={`BEGIN;
SELECT id FROM jobs
WHERE status = 'pending'
ORDER BY id
FOR UPDATE SKIP LOCKED
LIMIT 1;

UPDATE jobs SET status = 'running', locked_at = now()
WHERE id = $1
RETURNING *;
COMMIT;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="When is TRUNCATE preferable to DELETE, and what are the gotchas?">
            <ul className="list-disc pl-6 space-y-1">
              <li>Prefer TRUNCATE to empty large tables quickly (minimal WAL vs row-by-row DELETE)</li>
              <li>Requires stronger locks; cannot delete a subset with WHERE</li>
              <li>By default cannot truncate if FK references exist unless <code>CASCADE</code> (dangerous)</li>
              <li>Still transactional in PostgreSQL — can ROLLBACK unlike some other databases’ folklore</li>
            </ul>
          </InterviewQACard>

          <InterviewQACard level="Senior" question="What Prisma write pitfalls do seniors call out?">
            <ul className="list-disc pl-6 space-y-1">
              <li>N+1 writes in loops — prefer <code>createMany</code>, transactions, or raw bulk SQL</li>
              <li><code>upsert</code> is not always optimal under heavy contention; know SQL <code>ON CONFLICT</code></li>
              <li>Interactive transactions (<code>prisma.$transaction(async tx =&gt; ...)</code>) hold connections — keep them short with poolers</li>
              <li>Use <code>$transaction([...])</code> sequential batching for independent writes when appropriate</li>
            </ul>
            <CodeBlock
              title="Prisma interactive transaction"
              language="typescript"
              code={`await prisma.$transaction(async (tx) => {
  const order = await tx.order.create({
    data: { userId: 1, total: 42.5 },
  });
  await tx.inventory.update({
    where: { productId: 10 },
    data: { qty: { decrement: 1 } },
  });
  return order;
});`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

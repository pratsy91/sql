import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 2: Database Fundamentals - Module 1 - Most Asked Interview Questions',
  description:
    'Most asked interview questions on transactions, ACID, primary keys, table vs view, the cluster to table hierarchy, client-server architecture, WAL, and MVCC',
};

export default function MaiqM01L02DatabaseFundamentals() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 2: Database Fundamentals</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          The core ideas every Postgres interview checks: transactions, ACID, how objects are organised, and how Postgres keeps data safe while many people use it.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="What is a transaction?">
            <p>
              A transaction is a group of SQL statements treated as one unit of work. Either every statement in the group takes effect, or none of them do.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><code>BEGIN</code> starts it, <code>COMMIT</code> saves it, <code>ROLLBACK</code> throws the whole group away</li>
              <li>The classic example is a money transfer: take money out of one account and put it into another. Both steps must happen together</li>
              <li>If you do not write <code>BEGIN</code>, Postgres still runs each single statement inside its own tiny transaction (this is called autocommit)</li>
              <li>If any statement raises an error inside a transaction block, the rest is blocked until you <code>ROLLBACK</code></li>
            </ul>
            <CodeBlock
              title="Transaction basics"
              language="sql"
              code={`BEGIN;
INSERT INTO orders (user_id, total) VALUES (7, 250.00);
UPDATE inventory SET stock = stock - 1 WHERE sku = 'ABC';
COMMIT;   -- both rows are saved together

BEGIN;
DELETE FROM orders WHERE id = 99;
ROLLBACK; -- nothing was deleted`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="Explain ACID properties.">
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Atomicity:</strong> All steps in a transaction succeed, or none of them do. If one fails, the database undoes the rest</li>
              <li><strong>Consistency:</strong> Rules (required fields, foreign keys) stay true after the transaction</li>
              <li><strong>Isolation:</strong> Two people working at the same time do not see each other&apos;s half-finished changes</li>
              <li><strong>Durability:</strong> After COMMIT, the data stays even if the server crashes</li>
            </ul>
            <CodeBlock
              title="Simple ACID transaction"
              language="sql"
              code={`BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT; -- both updates stick together, or neither does on ROLLBACK`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="What is a primary key?">
            <p>
              A primary key is the column (or set of columns) that identifies each row uniquely. No two rows can share the same value, and it can never be NULL.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>A table can have only one primary key, but that key may cover more than one column</li>
              <li>Postgres automatically creates a unique index for it, so lookups by id are fast</li>
              <li>Other tables point at it with a foreign key</li>
              <li><strong>Surrogate key:</strong> a meaningless generated number or UUID, like <code>id</code>. This is the normal choice</li>
              <li><strong>Natural key:</strong> real data such as an email. Risky, because real data changes</li>
            </ul>
            <CodeBlock
              title="Primary key and foreign key"
              language="sql"
              code={`CREATE TABLE users (
  id    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email TEXT UNIQUE NOT NULL
);

CREATE TABLE orders (
  id      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users (id),
  total   NUMERIC(12, 2) NOT NULL
);

-- Composite primary key: the pair must be unique
CREATE TABLE post_tags (
  post_id BIGINT NOT NULL,
  tag_id  BIGINT NOT NULL,
  PRIMARY KEY (post_id, tag_id)
);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="Explain the PostgreSQL hierarchy: cluster, database, schema, table.">
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Cluster / instance:</strong> One running Postgres server (one data folder on disk)</li>
              <li><strong>Database:</strong> A named database inside that server, such as <code>app_prod</code>. You connect to one database at a time</li>
              <li><strong>Schema:</strong> A folder of objects inside a database. The default folder is <code>public</code></li>
              <li><strong>Table / view / function:</strong> The actual objects inside a schema</li>
            </ul>
            <CodeBlock
              title="Qualified object names"
              language="sql"
              code={`-- Fully qualified: database is selected by connection; schema.table
SELECT * FROM public.users;

CREATE SCHEMA reporting;
CREATE TABLE reporting.daily_stats (...);`}
            />
            <p>
              One query cannot join tables from two different databases in the same cluster. To do that you need a schema inside one database,
              or an extension such as <code>postgres_fdw</code> or <code>dblink</code>.
            </p>
          </InterviewQACard>

          <InterviewQACard level="Junior" question="What is the difference between a table and a view?">
            <p>
              A table really holds rows on disk. A view is a saved SELECT statement with a name. When you query the view, Postgres runs that SELECT for you.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>A view stores no data of its own, so it always shows current rows from the underlying tables</li>
              <li>Views are used to hide complex joins, or to expose only some columns to a reporting role</li>
              <li>A view costs the same as running its query, so a slow query behind a view is still slow</li>
              <li>A <strong>materialized view</strong> is the exception: it does store the result on disk and must be refreshed</li>
            </ul>
            <CodeBlock
              title="Table vs view"
              language="sql"
              code={`CREATE TABLE users (
  id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email     TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE VIEW active_users AS
SELECT id, email FROM users WHERE is_active;

SELECT * FROM active_users; -- runs the SELECT above, live`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="How does PostgreSQL client/server architecture work?">
            <ul className="list-disc pl-6 space-y-1">
              <li>The main Postgres process listens on port 5432. Each new connection gets its own worker process</li>
              <li>Apps connect with a driver (node-postgres, JDBC, or Prisma). They all speak Postgres&apos;s network protocol</li>
              <li>Background jobs write logs (WAL), flush data to disk, and clean old row versions (autovacuum)</li>
              <li>Each connection uses memory, so production apps use a pool instead of opening thousands of connections</li>
            </ul>
            <CodeBlock
              title="See the processes behind your connections"
              language="sql"
              code={`SELECT pid, backend_type, usename, state
FROM pg_stat_activity
ORDER BY backend_type;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What is WAL, in simple words?">
            <p>
              WAL stands for write-ahead log. Before Postgres changes a data page, it first writes a short note about that change into a log file on disk.
              Only then does it change the real page in memory.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Why:</strong> the log is written in order and is cheap to flush. That is what makes COMMIT durable and fast at the same time</li>
              <li><strong>Crash recovery:</strong> on restart, Postgres replays the WAL and finishes any work that was committed but not yet written to the data files</li>
              <li><strong>Replication:</strong> a replica just reads the primary&apos;s WAL stream and applies it</li>
              <li><strong>Point-in-time recovery:</strong> a base backup plus archived WAL lets you restore the database to a chosen second</li>
              <li>A <strong>checkpoint</strong> is the moment Postgres flushes dirty pages to the data files so older WAL can be recycled</li>
            </ul>
            <CodeBlock
              title="Inspect WAL settings and position"
              language="sql"
              code={`SHOW wal_level;            -- replica or logical
SELECT pg_current_wal_lsn(); -- current write position

-- How much WAL is on disk right now
SELECT count(*) AS wal_files, pg_size_pretty(sum(size)) AS total
FROM pg_ls_waldir();`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="Explain MVCC at a high level and why readers don’t block writers in PostgreSQL.">
            <ul className="list-disc pl-6 space-y-1">
              <li>MVCC means multi-version concurrency control. When you update a row, Postgres keeps the old copy and writes a new one. Readers still see the old copy until you commit</li>
              <li>So a SELECT usually does not wait for an UPDATE, and an UPDATE usually does not wait for a SELECT</li>
              <li>VACUUM later deletes the old copies. A transaction that stays open for a long time stops that cleanup and the table grows</li>
              <li>Isolation level (default is READ COMMITTED) decides how fresh that snapshot is</li>
              <li>The cost of this design is bloat: dead row versions take space until autovacuum removes them</li>
            </ul>
            <CodeBlock
              title="Find long transactions that block cleanup"
              language="sql"
              code={`SELECT pid, now() - xact_start AS running_for, state, left(query, 60)
FROM pg_stat_activity
WHERE xact_start IS NOT NULL
ORDER BY xact_start
LIMIT 10;

-- Dead rows waiting for vacuum
SELECT relname, n_live_tup, n_dead_tup, last_autovacuum
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC
LIMIT 10;`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'MVCC (Multi-Version Concurrency Control) - PostgreSQL Learning',
  description: 'Learn about PostgreSQL MVCC including how it works, transaction IDs, and visibility rules',
};

export default function MVCC() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">MVCC (Multi-Version Concurrency Control)</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">What is MVCC?</h2>
          <p className="mb-4">
            MVCC (Multi-Version Concurrency Control) is PostgreSQL's concurrency control method. 
            Instead of locking rows for reading, PostgreSQL maintains multiple versions of rows. 
            Each transaction sees a consistent snapshot of the database, allowing readers and 
            writers to work concurrently without blocking each other.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">How MVCC Works</h2>

          <CodeBlock
            title="SQL: Understanding MVCC Behavior"
            language="sql"
            code={`-- MVCC allows concurrent reads and writes
-- Transaction 1 (Reader):
BEGIN;
  SELECT * FROM users;  -- Sees snapshot at transaction start
  -- Transaction 2 (Writer): UPDATE users SET name = 'New' WHERE id = 1; COMMIT;
  SELECT * FROM users;  -- Still sees old value (consistent snapshot)
COMMIT;

-- Each row has system columns for MVCC
SELECT 
  xmin,        -- Transaction ID that created this version
  xmax,         -- Transaction ID that deleted/updated this version
  cmin,         -- Command ID within transaction
  cmax,         -- Command ID within transaction
  ctid          -- Current tuple ID (physical location)
FROM users;

-- View row versions
SELECT 
  ctid,
  xmin,
  xmax,
  name,
  email
FROM users
ORDER BY ctid;

-- Understanding xmin and xmax
-- xmin: Transaction that inserted this row version
-- xmax: Transaction that deleted/updated this row version (or 0 if not deleted)
-- If xmax is set and transaction is committed, this row version is dead`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Transaction IDs</h2>

          <CodeBlock
            title="SQL: Working with Transaction IDs"
            language="sql"
            code={`-- Get current transaction ID
SELECT txid_current();

-- Get transaction snapshot
SELECT txid_current_snapshot();

-- Snapshot format: xmin:xmax:xip_list
-- xmin: Earliest transaction ID still active
-- xmax: Next transaction ID to be assigned
-- xip_list: List of active transaction IDs

-- Check if transaction is visible
SELECT txid_visible_in_snapshot(
  txid_current(),
  txid_current_snapshot()
);

-- Transaction ID wraparound
-- PostgreSQL uses 32-bit transaction IDs (0 to 2^32-1)
-- After 2 billion transactions, IDs wrap around
-- VACUUM FREEZE prevents wraparound issues

-- Check transaction age
SELECT 
  age(datfrozenxid) AS oldest_transaction_age
FROM pg_database
WHERE datname = current_database();

-- View transaction IDs in use
SELECT 
  datname,
  age(datfrozenxid) AS transaction_age
FROM pg_database
ORDER BY transaction_age DESC;

-- Monitor transaction ID usage
SELECT 
  schemaname,
  tablename,
  n_dead_tup,
  last_vacuum,
  last_autovacuum
FROM pg_stat_user_tables
WHERE n_dead_tup > 0
ORDER BY n_dead_tup DESC;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Visibility Rules</h2>

          <CodeBlock
            title="SQL: Row Visibility Rules"
            language="sql"
            code={`-- A row version is visible to a transaction if:
-- 1. xmin is committed and xmin < snapshot.xmin OR xmin in snapshot
-- 2. xmax is 0 OR xmax is not committed OR xmax > snapshot.xmax

-- Example: Understanding visibility
-- Transaction 1 (ID: 100):
BEGIN;
  INSERT INTO users (name) VALUES ('Alice');
  -- xmin = 100, xmax = 0
COMMIT;

-- Transaction 2 (ID: 101) starts after Transaction 1 commits:
BEGIN;
  SELECT * FROM users;  -- Sees Alice (xmin=100 is committed)
  -- Transaction 3 (ID: 102): UPDATE users SET name = 'Bob' WHERE name = 'Alice';
  -- Old row: xmax = 102
  -- New row: xmin = 102
  SELECT * FROM users;  -- Still sees Alice (xmax=102 not committed yet)
  -- Transaction 3 commits
  SELECT * FROM users;  -- Still sees Alice (xmax=102 > snapshot.xmax)
COMMIT;

-- Check row visibility manually
SELECT 
  ctid,
  xmin,
  xmax,
  CASE 
    WHEN xmax = 0 THEN 'Not deleted'
    WHEN xmax > txid_current() THEN 'Deleted by future transaction'
    ELSE 'Deleted'
  END AS status
FROM users;

-- Understanding tuple visibility
-- PostgreSQL uses visibility map and FSM (Free Space Map)
-- VACUUM removes dead tuples (rows with committed xmax)

-- Force visibility check
SET enable_seqscan = off;
SELECT * FROM users WHERE ctid = '(0,1)';`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">VACUUM and MVCC</h2>

          <CodeBlock
            title="SQL: VACUUM and Dead Tuples"
            language="sql"
            code={`-- VACUUM removes dead tuples
VACUUM users;

-- VACUUM ANALYZE (also updates statistics)
VACUUM ANALYZE users;

-- VACUUM FREEZE (prevents transaction ID wraparound)
VACUUM FREEZE users;

-- View dead tuples before VACUUM
SELECT 
  schemaname,
  tablename,
  n_live_tup,
  n_dead_tup,
  last_vacuum,
  last_autovacuum
FROM pg_stat_user_tables
WHERE tablename = 'users';

-- Check table bloat
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  n_dead_tup,
  n_live_tup,
  ROUND(n_dead_tup * 100.0 / NULLIF(n_live_tup + n_dead_tup, 0), 2) AS dead_pct
FROM pg_stat_user_tables
WHERE n_dead_tup > 0
ORDER BY dead_pct DESC;

-- VACUUM FULL (rewrites table, requires exclusive lock)
VACUUM FULL users;

-- Auto-vacuum settings
SHOW autovacuum;
SHOW autovacuum_vacuum_threshold;
SHOW autovacuum_vacuum_scale_factor;

-- Manual vacuum with options
VACUUM (VERBOSE, ANALYZE) users;

-- Vacuum all tables
VACUUM;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">MVCC and Performance</h2>

          <CodeBlock
            title="SQL: MVCC Performance Considerations"
            language="sql"
            code={`-- MVCC overhead: Multiple row versions
-- Each UPDATE creates a new row version
-- Old versions remain until VACUUM

-- Monitor table bloat
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
  pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) AS indexes_size,
  n_dead_tup,
  n_live_tup
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- HOT (Heap Only Tuple) updates
-- If updated columns are not indexed, update can be HOT
-- HOT updates don't require index updates

-- Check for HOT updates
SELECT 
  schemaname,
  tablename,
  n_tup_hot_upd
FROM pg_stat_user_tables;

-- MVCC and indexes
-- Indexes point to row versions (ctid)
-- When row is updated, index entries may need updates
-- VACUUM removes dead index entries

-- Reindex to clean up indexes
REINDEX TABLE users;

-- Monitor index bloat
SELECT 
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
ORDER BY pg_relation_size(indexrelid) DESC;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Prisma: MVCC</h2>

          <CodeBlock
            title="Prisma: MVCC Behavior"
            language="prisma"
            code={`// Prisma automatically benefits from MVCC
// Transactions see consistent snapshots

// Read transaction sees snapshot
const users = await prisma.$transaction(async (tx) => {
  // Takes snapshot at transaction start
  const users1 = await tx.user.findMany();
  
  // Another transaction updates users here
  
  const users2 = await tx.user.findMany();
  // users1 and users2 are the same (consistent snapshot)
  
  return users1;
}, {
  isolationLevel: 'RepeatableRead'
});

// MVCC allows concurrent reads and writes
// Multiple read transactions can run concurrently
const [users1, users2] = await Promise.all([
  prisma.user.findMany(),
  prisma.user.findMany()
]);

// Write transaction creates new row versions
await prisma.$transaction(async (tx) => {
  // Creates new row version
  await tx.user.update({
    where: { id: 1 },
    data: { name: 'Updated' }
  });
  // Old row version remains until VACUUM
});

// Monitor dead tuples (requires raw SQL)
const stats = await prisma.$queryRaw\`
  SELECT 
    schemaname,
    tablename,
    n_dead_tup,
    n_live_tup
  FROM pg_stat_user_tables
  WHERE schemaname = 'public'
\`;

// Trigger VACUUM (requires raw SQL)
await prisma.$executeRaw\`VACUUM ANALYZE users\`;

// Check transaction ID
const txId = await prisma.$queryRaw\`
  SELECT txid_current() AS current_txid
\`;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Run VACUUM regularly</strong> to remove dead tuples</li>
              <li><strong>Monitor table bloat</strong> and dead tuple counts</li>
              <li><strong>Use VACUUM FREEZE</strong> to prevent transaction ID wraparound</li>
              <li><strong>Configure autovacuum</strong> appropriately for your workload</li>
              <li><strong>Understand HOT updates</strong> - they're more efficient</li>
              <li><strong>Monitor index bloat</strong> and reindex when needed</li>
              <li><strong>Keep transactions short</strong> to reduce dead tuple accumulation</li>
              <li><strong>Use appropriate isolation levels</strong> for your use case</li>
            </ul>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}


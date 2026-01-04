import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Locking - PostgreSQL Learning',
  description: 'Learn about PostgreSQL locking including table locks, row locks, advisory locks, and deadlocks',
};

export default function Locking() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Locking</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">What is Locking?</h2>
          <p className="mb-4">
            PostgreSQL uses locks to ensure data consistency and prevent conflicts between concurrent transactions. 
            Locks can be at the table level or row level, and can be shared (for reads) or exclusive (for writes).
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Table Locks</h2>

          <CodeBlock
            title="SQL: Table-Level Locks"
            language="sql"
            code={`-- Explicit table lock
BEGIN;
  LOCK TABLE users IN ACCESS EXCLUSIVE MODE;
  -- Perform operations that need exclusive access
  TRUNCATE TABLE users;
COMMIT;

-- Lock modes (from least to most restrictive)
BEGIN;
  -- ACCESS SHARE - allows concurrent reads, blocks writes
  LOCK TABLE users IN ACCESS SHARE MODE;
  
  -- ROW SHARE - allows concurrent reads and writes
  LOCK TABLE users IN ROW SHARE MODE;
  
  -- ROW EXCLUSIVE - allows concurrent reads, blocks writes
  LOCK TABLE users IN ROW EXCLUSIVE MODE;
  
  -- SHARE UPDATE EXCLUSIVE - allows concurrent reads
  LOCK TABLE users IN SHARE UPDATE EXCLUSIVE MODE;
  
  -- SHARE - blocks writes, allows reads
  LOCK TABLE users IN SHARE MODE;
  
  -- SHARE ROW EXCLUSIVE - blocks writes and some reads
  LOCK TABLE users IN SHARE ROW EXCLUSIVE MODE;
  
  -- EXCLUSIVE - blocks writes, allows reads
  LOCK TABLE users IN EXCLUSIVE MODE;
  
  -- ACCESS EXCLUSIVE - blocks all operations
  LOCK TABLE users IN ACCESS EXCLUSIVE MODE;
COMMIT;

-- Lock with NOWAIT (fails immediately if lock unavailable)
BEGIN;
  LOCK TABLE users IN ACCESS EXCLUSIVE MODE NOWAIT;
  -- If lock unavailable, throws error immediately
COMMIT;

-- Lock with timeout
BEGIN;
  SET lock_timeout = '5s';
  LOCK TABLE users IN ACCESS EXCLUSIVE MODE;
  -- Waits up to 5 seconds, then throws error
COMMIT;

-- View current locks
SELECT 
  locktype,
  relation::regclass,
  mode,
  granted
FROM pg_locks
WHERE relation = 'users'::regclass;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Row Locks</h2>

          <CodeBlock
            title="SQL: Row-Level Locks"
            language="sql"
            code={`-- FOR UPDATE (exclusive row lock)
BEGIN;
  SELECT * FROM users WHERE id = 1 FOR UPDATE;
  -- Other transactions cannot update/delete this row
  UPDATE users SET name = 'Updated' WHERE id = 1;
COMMIT;

-- FOR NO KEY UPDATE (locks row, but allows foreign key operations)
BEGIN;
  SELECT * FROM users WHERE id = 1 FOR NO KEY UPDATE;
  UPDATE users SET name = 'Updated' WHERE id = 1;
COMMIT;

-- FOR SHARE (shared row lock)
BEGIN;
  SELECT * FROM users WHERE id = 1 FOR SHARE;
  -- Other transactions can also FOR SHARE, but not FOR UPDATE
COMMIT;

-- FOR KEY SHARE (weakest lock, allows concurrent updates)
BEGIN;
  SELECT * FROM users WHERE id = 1 FOR KEY SHARE;
  -- Allows most concurrent operations
COMMIT;

-- Lock multiple rows
BEGIN;
  SELECT * FROM users WHERE status = 'active' FOR UPDATE;
  -- All matching rows are locked
  UPDATE users SET status = 'inactive' WHERE status = 'active';
COMMIT;

-- NOWAIT with row locks
BEGIN;
  SELECT * FROM users WHERE id = 1 FOR UPDATE NOWAIT;
  -- Fails immediately if row is locked
COMMIT;

-- SKIP LOCKED (skip locked rows)
BEGIN;
  SELECT * FROM users WHERE status = 'pending' FOR UPDATE SKIP LOCKED;
  -- Returns only unlocked rows
COMMIT;

-- View row locks
SELECT 
  locktype,
  relation::regclass,
  page,
  tuple,
  mode,
  granted
FROM pg_locks
WHERE locktype = 'tuple';`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Advisory Locks</h2>

          <CodeBlock
            title="SQL: Advisory Locks"
            language="sql"
            code={`-- Session-level advisory locks
SELECT pg_advisory_lock(12345);
-- Lock acquired, other sessions cannot acquire same lock
SELECT pg_advisory_unlock(12345);

-- Try to acquire lock (non-blocking)
SELECT pg_try_advisory_lock(12345);  -- Returns true if acquired, false if not

-- Transaction-level advisory locks
BEGIN;
  SELECT pg_advisory_xact_lock(12345);
  -- Lock held until transaction ends
  -- Automatically released on COMMIT or ROLLBACK
COMMIT;

-- Try transaction-level lock
BEGIN;
  SELECT pg_try_advisory_xact_lock(12345);
  -- Returns true/false, doesn't block
COMMIT;

-- Named advisory locks (using bigint)
SELECT pg_advisory_lock(hashtext('my_lock_name'));
SELECT pg_advisory_unlock(hashtext('my_lock_name'));

-- Advisory locks with two integers
SELECT pg_advisory_lock(1, 2);
SELECT pg_advisory_unlock(1, 2);

-- Check if lock is held
SELECT pg_advisory_lock_held(12345);  -- Returns true/false

-- View advisory locks
SELECT 
  locktype,
  objid,
  mode,
  granted
FROM pg_locks
WHERE locktype = 'advisory';

-- Example: Using advisory locks for application logic
BEGIN;
  -- Acquire lock before critical section
  PERFORM pg_advisory_xact_lock(hashtext('process_payments'));
  
  -- Critical section - only one transaction can execute this
  UPDATE accounts SET balance = balance - 100 WHERE id = 1;
  UPDATE accounts SET balance = balance + 100 WHERE id = 2;
  
  -- Lock automatically released on commit
COMMIT;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Deadlocks</h2>

          <CodeBlock
            title="SQL: Understanding and Handling Deadlocks"
            language="sql"
            code={`-- Deadlock example
-- Transaction 1:
BEGIN;
  UPDATE users SET name = 'User 1' WHERE id = 1;
  -- Transaction 2: UPDATE users SET name = 'User 2' WHERE id = 2;
  UPDATE users SET name = 'User 1 Updated' WHERE id = 2;  -- Waits for Transaction 2
  -- Transaction 2: UPDATE users SET name = 'User 2 Updated' WHERE id = 1;  -- Deadlock!
COMMIT;

-- Deadlock detection
-- PostgreSQL automatically detects deadlocks and rolls back one transaction
-- Error: ERROR: deadlock detected

-- Preventing deadlocks: Always lock in same order
-- Good: Always lock lower ID first
BEGIN;
  SELECT * FROM users WHERE id = 1 FOR UPDATE;
  SELECT * FROM users WHERE id = 2 FOR UPDATE;
COMMIT;

-- Bad: Different order in different transactions causes deadlock
-- Transaction 1: Lock id=1, then id=2
-- Transaction 2: Lock id=2, then id=1  -- Deadlock risk!

-- Using NOWAIT to avoid deadlocks
BEGIN;
  SELECT * FROM users WHERE id = 1 FOR UPDATE NOWAIT;
  -- If locked, fails immediately instead of waiting
COMMIT;

-- Using SKIP LOCKED
BEGIN;
  SELECT * FROM users WHERE status = 'pending' FOR UPDATE SKIP LOCKED;
  -- Only processes unlocked rows, avoids deadlocks
COMMIT;

-- Deadlock timeout
SET deadlock_timeout = '1s';  -- Default is 1 second
BEGIN;
  UPDATE users SET name = 'Test' WHERE id = 1;
COMMIT;

-- View deadlock information
SELECT 
  pid,
  usename,
  application_name,
  state,
  wait_event_type,
  wait_event
FROM pg_stat_activity
WHERE wait_event_type = 'Lock';`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Lock Monitoring</h2>

          <CodeBlock
            title="SQL: Monitoring Locks"
            language="sql"
            code={`-- View all locks
SELECT 
  l.locktype,
  l.database,
  l.relation::regclass,
  l.page,
  l.tuple,
  l.virtualxid,
  l.transactionid,
  l.classid,
  l.objid,
  l.objsubid,
  l.virtualtransaction,
  l.pid,
  l.mode,
  l.granted,
  a.usename,
  a.query,
  a.query_start
FROM pg_locks l
LEFT JOIN pg_stat_activity a ON l.pid = a.pid
ORDER BY l.granted, l.pid;

-- Find blocking queries
SELECT 
  blocked_locks.pid AS blocked_pid,
  blocking_locks.pid AS blocking_pid,
  blocked_activity.usename AS blocked_user,
  blocking_activity.usename AS blocking_user,
  blocked_activity.query AS blocked_statement,
  blocking_activity.query AS blocking_statement
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks 
  ON blocking_locks.locktype = blocked_locks.locktype
  AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
  AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
  AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
  AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
  AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
  AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
  AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
  AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
  AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
  AND blocking_locks.pid != blocked_locks.pid
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;

-- View lock wait time
SELECT 
  pid,
  now() - pg_stat_activity.query_start AS duration,
  query
FROM pg_stat_activity
WHERE wait_event_type = 'Lock'
ORDER BY duration DESC;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Prisma: Locking</h2>

          <CodeBlock
            title="Prisma: Using Locks"
            language="prisma"
            code={`// Prisma doesn't have direct lock APIs
// Use raw SQL for explicit locking

// Row-level lock with FOR UPDATE
const user = await prisma.$queryRaw\`
  SELECT * FROM users WHERE id = 1 FOR UPDATE
\`;

// Then update
await prisma.user.update({
  where: { id: 1 },
  data: { name: 'Updated' }
});

// Transaction with locking
await prisma.$transaction(async (tx) => {
  // Lock row
  await tx.$queryRaw\`
    SELECT * FROM accounts WHERE id = 1 FOR UPDATE
  \`;
  
  // Update
  await tx.account.update({
    where: { id: 1 },
    data: { balance: { decrement: 100 } }
  });
});

// Advisory lock
await prisma.$executeRaw\`
  SELECT pg_advisory_lock(12345)
\`;

try {
  // Critical section
  await prisma.user.update({
    where: { id: 1 },
    data: { name: 'Updated' }
  });
} finally {
  // Release lock
  await prisma.$executeRaw\`
    SELECT pg_advisory_unlock(12345)
  \`;
}

// Transaction-level advisory lock
await prisma.$transaction(async (tx) => {
  await tx.$executeRaw\`
    SELECT pg_advisory_xact_lock(12345)
  \`;
  
  // Lock automatically released on commit
  await tx.user.update({
    where: { id: 1 },
    data: { name: 'Updated' }
  });
});

// SKIP LOCKED pattern
const users = await prisma.$queryRaw\`
  SELECT * FROM users 
  WHERE status = 'pending' 
  FOR UPDATE SKIP LOCKED
  LIMIT 10
\`;

// Process unlocked users
for (const user of users) {
  await prisma.user.update({
    where: { id: user.id },
    data: { status: 'processing' }
  });
}`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Use row-level locks</strong> instead of table locks when possible</li>
              <li><strong>Lock in consistent order</strong> to prevent deadlocks</li>
              <li><strong>Keep lock duration short</strong> - release locks quickly</li>
              <li><strong>Use NOWAIT or SKIP LOCKED</strong> to avoid blocking</li>
              <li><strong>Use advisory locks</strong> for application-level coordination</li>
              <li><strong>Monitor locks</strong> in production to identify bottlenecks</li>
              <li><strong>Handle deadlocks</strong> with retry logic</li>
              <li><strong>Set appropriate timeouts</strong> to prevent indefinite waits</li>
            </ul>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}


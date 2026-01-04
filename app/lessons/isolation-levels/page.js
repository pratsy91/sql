import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Isolation Levels - PostgreSQL Learning',
  description: 'Learn about PostgreSQL transaction isolation levels including READ UNCOMMITTED, READ COMMITTED, REPEATABLE READ, and SERIALIZABLE',
};

export default function IsolationLevels() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Isolation Levels</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">What are Isolation Levels?</h2>
          <p className="mb-4">
            Isolation levels determine how transactions interact with each other and what data 
            anomalies they can see. PostgreSQL supports READ COMMITTED (default), REPEATABLE READ, 
            and SERIALIZABLE. READ UNCOMMITTED is not supported and is treated as READ COMMITTED.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">READ COMMITTED (Default)</h2>

          <CodeBlock
            title="SQL: READ COMMITTED Isolation"
            language="sql"
            code={`-- READ COMMITTED is the default isolation level
BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;
  -- Can see committed changes from other transactions
  SELECT * FROM users;
  
  -- If another transaction commits changes, this query will see them
  SELECT * FROM users;
COMMIT;

-- Example: Non-repeatable read (allowed in READ COMMITTED)
-- Transaction 1:
BEGIN;
  SELECT balance FROM accounts WHERE id = 1;  -- Returns 1000
  -- Transaction 2 commits: UPDATE accounts SET balance = 900 WHERE id = 1;
  SELECT balance FROM accounts WHERE id = 1;  -- Returns 900 (different!)
COMMIT;

-- Example: Phantom reads (allowed in READ COMMITTED)
-- Transaction 1:
BEGIN;
  SELECT COUNT(*) FROM users WHERE status = 'active';  -- Returns 10
  -- Transaction 2 commits: INSERT INTO users (status) VALUES ('active');
  SELECT COUNT(*) FROM users WHERE status = 'active';  -- Returns 11 (different!)
COMMIT;

-- Setting default isolation level
SET default_transaction_isolation = 'read committed';
-- Or in postgresql.conf:
-- default_transaction_isolation = 'read committed'`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">REPEATABLE READ</h2>

          <CodeBlock
            title="SQL: REPEATABLE READ Isolation"
            language="sql"
            code={`-- REPEATABLE READ prevents non-repeatable reads
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;
  -- Takes a snapshot at transaction start
  SELECT * FROM users;
  
  -- Even if other transactions commit changes, this sees the same data
  SELECT * FROM users;  -- Same results as first query
  
  -- But phantom reads can still occur
  SELECT COUNT(*) FROM users WHERE status = 'active';
  -- Another transaction inserts a row
  SELECT COUNT(*) FROM users WHERE status = 'active';  -- May see new row
COMMIT;

-- Example: Non-repeatable read prevented
-- Transaction 1:
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;
  SELECT balance FROM accounts WHERE id = 1;  -- Returns 1000
  -- Transaction 2 commits: UPDATE accounts SET balance = 900 WHERE id = 1;
  SELECT balance FROM accounts WHERE id = 1;  -- Still returns 1000 (same!)
COMMIT;

-- Serialization failure in REPEATABLE READ
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;
  SELECT * FROM users WHERE id = 1;
  -- Another transaction updates the same row
  UPDATE users SET name = 'Updated' WHERE id = 1;
  -- May get: ERROR: could not serialize access due to concurrent update
COMMIT;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">SERIALIZABLE</h2>

          <CodeBlock
            title="SQL: SERIALIZABLE Isolation"
            language="sql"
            code={`-- SERIALIZABLE provides highest isolation
BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;
  -- Prevents all anomalies: dirty reads, non-repeatable reads, phantom reads
  SELECT * FROM users;
  
  -- All queries see consistent snapshot
  SELECT COUNT(*) FROM users WHERE status = 'active';
  
  -- Updates are serialized
  UPDATE users SET status = 'inactive' WHERE id = 1;
COMMIT;

-- Example: Prevents phantom reads
-- Transaction 1:
BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;
  SELECT COUNT(*) FROM users WHERE status = 'active';  -- Returns 10
  -- Transaction 2 tries to insert: INSERT INTO users (status) VALUES ('active');
  -- Transaction 2 may be blocked or get serialization error
  SELECT COUNT(*) FROM users WHERE status = 'active';  -- Still returns 10
COMMIT;

-- Serialization failure detection
BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;
  SELECT SUM(balance) FROM accounts;
  -- Another transaction modifies accounts
  UPDATE accounts SET balance = balance + 100 WHERE id = 1;
  -- May get: ERROR: could not serialize access due to read/write dependencies
COMMIT;

-- Handling serialization failures
DO $$
BEGIN
  BEGIN
    BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;
      UPDATE users SET status = 'active';
    COMMIT;
  EXCEPTION
    WHEN serialization_failure THEN
      -- Retry the transaction
      RAISE NOTICE 'Serialization failure, retrying...';
  END;
END;
$$;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Isolation Level Comparison</h2>

          <CodeBlock
            title="SQL: Comparing Isolation Levels"
            language="sql"
            code={`-- Check current isolation level
SHOW transaction_isolation;
-- Or
SELECT current_setting('transaction_isolation');

-- Test different isolation levels
BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;
  SELECT current_setting('transaction_isolation');  -- read committed
COMMIT;

BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;
  SELECT current_setting('transaction_isolation');  -- repeatable read
COMMIT;

BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;
  SELECT current_setting('transaction_isolation');  -- serializable
COMMIT;

-- Isolation level and locking behavior
BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;
  -- Locks are released after statement
  SELECT * FROM users FOR UPDATE;  -- Locks rows
  -- Locks released after SELECT completes
COMMIT;

BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;
  -- Locks held until transaction end
  SELECT * FROM users FOR UPDATE;  -- Locks rows
  -- Locks held until COMMIT
COMMIT;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Transaction Anomalies</h2>

          <CodeBlock
            title="SQL: Understanding Transaction Anomalies"
            language="sql"
            code={`-- Dirty Read (not possible in PostgreSQL)
-- READ UNCOMMITTED would allow this, but PostgreSQL doesn't support it
-- Transaction 1: BEGIN; UPDATE users SET name = 'Dirty'; (not committed)
-- Transaction 2: SELECT * FROM users;  -- Would see 'Dirty' in READ UNCOMMITTED
-- But in PostgreSQL, Transaction 2 sees old value until Transaction 1 commits

-- Non-repeatable Read (allowed in READ COMMITTED)
-- Transaction 1:
BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;
  SELECT balance FROM accounts WHERE id = 1;  -- 1000
  -- Transaction 2: UPDATE accounts SET balance = 900 WHERE id = 1; COMMIT;
  SELECT balance FROM accounts WHERE id = 1;  -- 900 (different!)
COMMIT;

-- Phantom Read (allowed in READ COMMITTED and REPEATABLE READ)
-- Transaction 1:
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;
  SELECT COUNT(*) FROM users WHERE status = 'active';  -- 10
  -- Transaction 2: INSERT INTO users (status) VALUES ('active'); COMMIT;
  SELECT COUNT(*) FROM users WHERE status = 'active';  -- 11 (new row appears!)
COMMIT;

-- Serialization Anomaly (prevented in SERIALIZABLE)
-- Transaction 1:
BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;
  SELECT SUM(balance) FROM accounts;  -- 10000
  -- Transaction 2: UPDATE accounts SET balance = balance + 1000 WHERE id = 1; COMMIT;
  UPDATE accounts SET balance = balance - 500 WHERE id = 2;
  -- May fail with serialization error
COMMIT;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Prisma: Isolation Levels</h2>

          <CodeBlock
            title="Prisma: Setting Isolation Levels"
            language="prisma"
            code={`// Prisma supports isolation levels in transactions
await prisma.$transaction(
  async (tx) => {
    const users = await tx.user.findMany();
    return users;
  },
  {
    isolationLevel: 'ReadCommitted'  // Default
  }
);

// Available isolation levels
await prisma.$transaction(
  async (tx) => {
    // Your operations
    const user = await tx.user.findUnique({ where: { id: 1 } });
    return user;
  },
  {
    isolationLevel: 'ReadUncommitted'  // Treated as ReadCommitted in PostgreSQL
  }
);

await prisma.$transaction(
  async (tx) => {
    const users = await tx.user.findMany();
    // Non-repeatable reads prevented
    return users;
  },
  {
    isolationLevel: 'RepeatableRead'
  }
);

await prisma.$transaction(
  async (tx) => {
    // Highest isolation, prevents all anomalies
    const count = await tx.user.count({ where: { status: 'active' } });
    await tx.user.create({ data: { name: 'Test', status: 'active' } });
    return count;
  },
  {
    isolationLevel: 'Serializable',
    maxWait: 5000,
    timeout: 10000
  }
);

// Handling serialization failures
let retries = 3;
while (retries > 0) {
  try {
    await prisma.$transaction(
      async (tx) => {
        await tx.user.update({
          where: { id: 1 },
          data: { name: 'Updated' }
        });
      },
      {
        isolationLevel: 'Serializable'
      }
    );
    break;  // Success
  } catch (error) {
    if (error.code === 'P2034' && retries > 0) {
      // Serialization failure, retry
      retries--;
      await new Promise(resolve => setTimeout(resolve, 100));
    } else {
      throw error;
    }
  }
}`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Use READ COMMITTED</strong> for most applications (default)</li>
              <li><strong>Use REPEATABLE READ</strong> when you need consistent reads</li>
              <li><strong>Use SERIALIZABLE</strong> for critical operations requiring highest isolation</li>
              <li><strong>Handle serialization failures</strong> with retry logic</li>
              <li><strong>Understand trade-offs</strong> - higher isolation = more locking</li>
              <li><strong>Test under load</strong> to understand behavior</li>
              <li><strong>Monitor deadlocks</strong> and serialization failures</li>
              <li><strong>Keep transactions short</strong> especially with higher isolation</li>
            </ul>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}


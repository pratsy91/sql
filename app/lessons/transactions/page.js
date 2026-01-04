import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Transactions - PostgreSQL Learning',
  description: 'Learn about PostgreSQL transactions including BEGIN, COMMIT, ROLLBACK, savepoints, and transaction isolation',
};

export default function Transactions() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Transactions</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">What are Transactions?</h2>
          <p className="mb-4">
            A transaction is a sequence of database operations that are executed as a single unit. 
            Transactions ensure ACID properties: Atomicity, Consistency, Isolation, and Durability. 
            Either all operations succeed (COMMIT) or all are rolled back (ROLLBACK).
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">BEGIN, COMMIT, ROLLBACK</h2>

          <CodeBlock
            title="SQL: Basic Transaction Control"
            language="sql"
            code={`-- Basic transaction
BEGIN;
  INSERT INTO users (name, email) VALUES ('John Doe', 'john@example.com');
  INSERT INTO profiles (user_id, bio) VALUES (LASTVAL(), 'Software developer');
COMMIT;

-- Transaction with rollback
BEGIN;
  UPDATE accounts SET balance = balance - 100 WHERE id = 1;
  UPDATE accounts SET balance = balance + 100 WHERE id = 2;
  
  -- If something goes wrong, rollback
  -- ROLLBACK;
  
  -- If everything is OK, commit
COMMIT;

-- Explicit BEGIN (optional - each statement is auto-committed)
BEGIN;
  SELECT * FROM users;
  INSERT INTO logs (message) VALUES ('Transaction started');
COMMIT;

-- Rollback example
BEGIN;
  DELETE FROM users WHERE id = 999;
  -- Realize mistake
  ROLLBACK;  -- All changes are undone

-- Auto-commit mode (default)
INSERT INTO users (name, email) VALUES ('Jane Doe', 'jane@example.com');
-- Automatically committed`}
          />

          <CodeBlock
            title="SQL: Transaction with Error Handling"
            language="sql"
            code={`-- Transaction with exception handling
DO $$
BEGIN
  BEGIN
    INSERT INTO users (name, email) VALUES ('Test User', 'test@example.com');
    INSERT INTO profiles (user_id, bio) VALUES (LASTVAL(), 'Test bio');
    COMMIT;
  EXCEPTION
    WHEN OTHERS THEN
      ROLLBACK;
      RAISE NOTICE 'Transaction rolled back: %', SQLERRM;
  END;
END;
$$;

-- Nested transactions (using savepoints)
BEGIN;
  INSERT INTO users (name, email) VALUES ('User 1', 'user1@example.com');
  
  SAVEPOINT sp1;
  
  BEGIN
    INSERT INTO users (name, email) VALUES ('User 2', 'user2@example.com');
    -- If this fails, rollback to savepoint
  EXCEPTION
    WHEN OTHERS THEN
      ROLLBACK TO SAVEPOINT sp1;
  END;
  
  COMMIT;  -- User 1 is committed, User 2 may or may not be`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Savepoints</h2>

          <CodeBlock
            title="SQL: Savepoints"
            language="sql"
            code={`-- Using savepoints
BEGIN;
  INSERT INTO users (name, email) VALUES ('Alice', 'alice@example.com');
  
  SAVEPOINT before_update;
  
  UPDATE users SET email = 'alice.new@example.com' WHERE name = 'Alice';
  
  -- If update is wrong, rollback to savepoint
  ROLLBACK TO SAVEPOINT before_update;
  
  -- Continue with transaction
  UPDATE users SET name = 'Alice Smith' WHERE name = 'Alice';
  
  COMMIT;

-- Multiple savepoints
BEGIN;
  INSERT INTO table1 (data) VALUES ('data1');
  SAVEPOINT sp1;
  
  INSERT INTO table2 (data) VALUES ('data2');
  SAVEPOINT sp2;
  
  INSERT INTO table3 (data) VALUES ('data3');
  
  -- Rollback to sp2 (undoes table3 insert)
  ROLLBACK TO SAVEPOINT sp2;
  
  -- Rollback to sp1 (undoes table2 and table3 inserts)
  -- ROLLBACK TO SAVEPOINT sp1;
  
  COMMIT;  -- Only table1 insert is committed

-- Releasing savepoints
BEGIN;
  SAVEPOINT sp1;
  INSERT INTO users (name) VALUES ('Test');
  RELEASE SAVEPOINT sp1;  -- Savepoint is released
  -- Can't rollback to sp1 anymore
COMMIT;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Transaction Isolation</h2>

          <CodeBlock
            title="SQL: Setting Transaction Isolation Level"
            language="sql"
            code={`-- Set isolation level for transaction
BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;
  SELECT * FROM users;
  UPDATE users SET status = 'active' WHERE id = 1;
COMMIT;

-- Different isolation levels
BEGIN TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
  -- Not supported in PostgreSQL (uses READ COMMITTED instead)
COMMIT;

BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;  -- Default
  SELECT * FROM accounts;
COMMIT;

BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;
  SELECT * FROM users;
  -- Same query will see same data even if other transactions modify it
COMMIT;

BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;
  -- Highest isolation, prevents all anomalies
  SELECT * FROM users;
  UPDATE users SET status = 'active';
COMMIT;

-- Using SET TRANSACTION
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
BEGIN;
  SELECT * FROM users;
COMMIT;

-- Read-only transaction
BEGIN TRANSACTION READ ONLY;
  SELECT * FROM users;
  -- Cannot modify data
COMMIT;

-- Read-write transaction (default)
BEGIN TRANSACTION READ WRITE;
  INSERT INTO users (name) VALUES ('Test');
COMMIT;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Transaction Properties</h2>

          <CodeBlock
            title="SQL: Transaction Properties"
            language="sql"
            code={`-- Check transaction status
SELECT txid_current();  -- Current transaction ID

-- Check if in transaction
SELECT pg_is_in_recovery();  -- Check if in recovery mode

-- Transaction timestamps
SELECT 
  transaction_timestamp(),  -- Transaction start time
  statement_timestamp(),    -- Current statement start time
  clock_timestamp();        -- Current time (changes during transaction)

-- Transaction ID functions
SELECT 
  txid_current(),           -- Current transaction ID
  txid_current_snapshot(); -- Current snapshot

-- Example: Transaction with timestamps
BEGIN;
  SELECT transaction_timestamp() AS tx_start;
  -- Do some work
  SELECT statement_timestamp() AS stmt_time;
  -- Do more work
  SELECT clock_timestamp() AS current_time;
COMMIT;

-- Long-running transaction example
BEGIN;
  -- Long operation
  PERFORM pg_sleep(5);  -- Sleep for 5 seconds
  INSERT INTO logs (message, created_at) 
  VALUES ('Long transaction', transaction_timestamp());
COMMIT;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Prisma: Transactions</h2>

          <CodeBlock
            title="Prisma: Transaction API"
            language="prisma"
            code={`// Prisma transaction API
const result = await prisma.$transaction(async (tx) => {
  // Create user
  const user = await tx.user.create({
    data: {
      name: 'John Doe',
      email: 'john@example.com'
    }
  });

  // Create profile
  const profile = await tx.profile.create({
    data: {
      userId: user.id,
      bio: 'Software developer'
    }
  });

  // Update account
  await tx.account.update({
    where: { id: 1 },
    data: { balance: { decrement: 100 } }
  });

  return { user, profile };
});

// Transaction with error handling
try {
  await prisma.$transaction(async (tx) => {
    await tx.user.create({
      data: { name: 'Test', email: 'test@example.com' }
    });
    
    // If this fails, entire transaction rolls back
    await tx.account.update({
      where: { id: 999 },  // Non-existent ID
      data: { balance: 100 }
    });
  });
} catch (error) {
  console.error('Transaction failed:', error);
}

// Sequential operations in transaction
await prisma.$transaction([
  prisma.user.create({
    data: { name: 'Alice', email: 'alice@example.com' }
  }),
  prisma.user.create({
    data: { name: 'Bob', email: 'bob@example.com' }
  }),
  prisma.user.create({
    data: { name: 'Charlie', email: 'charlie@example.com' }
  })
]);`}
          />

          <CodeBlock
            title="Prisma: Transaction Options"
            language="prisma"
            code={`// Transaction with timeout
await prisma.$transaction(
  async (tx) => {
    // Long-running operations
    await tx.user.create({ data: { name: 'Test' } });
  },
  {
    maxWait: 5000,  // Maximum time to wait for transaction (ms)
    timeout: 10000,  // Maximum time for transaction to complete (ms)
    isolationLevel: 'ReadCommitted'  // Isolation level
  }
);

// Isolation levels in Prisma
await prisma.$transaction(
  async (tx) => {
    const users = await tx.user.findMany();
    return users;
  },
  {
    isolationLevel: 'Serializable'  // ReadCommitted, ReadUncommitted, RepeatableRead, Serializable
  }
);

// Interactive transactions (Prisma 4.7+)
await prisma.$transaction(async (tx) => {
  const user = await tx.user.findUnique({
    where: { id: 1 }
  });

  if (user) {
    await tx.user.update({
      where: { id: 1 },
      data: { name: 'Updated Name' }
    });
  }

  return user;
}, {
  isolationLevel: 'ReadCommitted'
});

// Raw SQL in transaction
await prisma.$transaction(async (tx) => {
  await tx.$executeRaw\`INSERT INTO users (name) VALUES ('Test')\`;
  await tx.$queryRaw\`SELECT * FROM users\`;
});`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Keep transactions short</strong> - long transactions can cause locks</li>
              <li><strong>Use savepoints</strong> for partial rollbacks</li>
              <li><strong>Handle errors</strong> appropriately in transactions</li>
              <li><strong>Choose appropriate isolation level</strong> for your use case</li>
              <li><strong>Commit or rollback</strong> explicitly when needed</li>
              <li><strong>Avoid nested transactions</strong> - use savepoints instead</li>
              <li><strong>Test transaction behavior</strong> under concurrent load</li>
              <li><strong>Monitor long-running transactions</strong> in production</li>
            </ul>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}


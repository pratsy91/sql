import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';

export const metadata = {
  title: 'Transactions & Concurrency - Interview Cheatsheet',
  description: 'Transactions, isolation levels, and concurrency control for interviews',
};

export default function TransactionsConcurrency() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Transactions & Concurrency - Interview Cheatsheet</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Transaction Basics</h2>
          
          <CodeBlock
            title="Transaction Syntax"
            language="sql"
            code={`-- Start transaction explicitly
BEGIN;
-- or
START TRANSACTION;

-- Multiple operations
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;

-- Commit (save changes)
COMMIT;

-- Rollback (undo changes)
ROLLBACK;`}
          />

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Transaction Properties (ACID)</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li><strong>Atomicity:</strong> All or nothing - transaction completes fully or not at all</li>
              <li><strong>Consistency:</strong> Database remains in valid state (constraints satisfied)</li>
              <li><strong>Isolation:</strong> Concurrent transactions don't interfere</li>
              <li><strong>Durability:</strong> Committed changes persist even after crash</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">ACID Isolation Levels</h2>
          
          <div className="bg-red-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Read Uncommitted (Lowest Isolation)</h3>
            <p className="text-sm mb-2">Allows dirty reads, non-repeatable reads, phantom reads</p>
            <CodeBlock
              title="Dirty Read Example"
              language="sql"
              code={`-- Transaction 1
BEGIN;
UPDATE accounts SET balance = 1000 WHERE id = 1;
-- Not committed yet

-- Transaction 2 (Read Uncommitted)
BEGIN TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
SELECT balance FROM accounts WHERE id = 1;  -- Reads 1000 (dirty read!)
-- If Transaction 1 rolls back, Transaction 2 saw uncommitted data`}
            />
            <p className="text-sm mt-2 text-red-600 dark:text-red-400">
              <strong>PostgreSQL Note:</strong> PostgreSQL doesn't actually allow READ UNCOMMITTED - it treats it as READ COMMITTED
            </p>
          </div>

          <div className="bg-orange-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Read Committed (PostgreSQL Default)</h3>
            <p className="text-sm mb-2">Prevents dirty reads, but allows non-repeatable reads and phantom reads</p>
            <CodeBlock
              title="Non-Repeatable Read Example"
              language="sql"
              code={`-- Transaction 1
BEGIN;
SELECT balance FROM accounts WHERE id = 1;  -- Returns 500
-- ...
SELECT balance FROM accounts WHERE id = 1;  -- Returns 600 (different!)
COMMIT;

-- Transaction 2 (committed between reads)
BEGIN;
UPDATE accounts SET balance = 600 WHERE id = 1;
COMMIT;`}
            />
          </div>

          <div className="bg-yellow-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Repeatable Read</h3>
            <p className="text-sm mb-2">Prevents dirty reads and non-repeatable reads, but allows phantom reads</p>
            <CodeBlock
              title="Phantom Read Example"
              language="sql"
              code={`-- Transaction 1
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;
SELECT COUNT(*) FROM accounts WHERE balance > 1000;  -- Returns 5
-- ...
SELECT COUNT(*) FROM accounts WHERE balance > 1000;  -- Returns 6 (new row!)
COMMIT;

-- Transaction 2 (inserts new row matching condition)
BEGIN;
INSERT INTO accounts (balance) VALUES (1500);
COMMIT;`}
            />
          </div>

          <div className="bg-green-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Serializable (Highest Isolation)</h3>
            <p className="text-sm mb-2">Prevents all: dirty reads, non-repeatable reads, phantom reads</p>
            <CodeBlock
              title="Serializable Isolation"
              language="sql"
              code={`-- Transactions execute as if serial (one after another)
BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;
-- All concurrent transactions see consistent snapshot
COMMIT;`}
            />
            <p className="text-sm mt-2">
              <strong>Trade-off:</strong> Highest consistency, but may cause serialization failures that require retries
            </p>
          </div>

          <CodeBlock
            title="Setting Isolation Level"
            language="sql"
            code={`-- Per transaction
BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;

-- For current session
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;

-- Default for all transactions
ALTER DATABASE mydb SET default_transaction_isolation = 'repeatable read';`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Concurrency Problems</h2>
          
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">1. Dirty Read</h3>
            <p className="text-sm">Reading uncommitted data that may be rolled back</p>
            <p className="text-sm"><strong>Prevented by:</strong> READ COMMITTED and above</p>
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">2. Non-Repeatable Read</h3>
            <p className="text-sm">Same row read twice returns different values (UPDATE happened)</p>
            <p className="text-sm"><strong>Prevented by:</strong> REPEATABLE READ and above</p>
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">3. Phantom Read</h3>
            <p className="text-sm">Same query executed twice returns different rows (INSERT/DELETE happened)</p>
            <p className="text-sm"><strong>Prevented by:</strong> SERIALIZABLE</p>
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">4. Lost Update</h3>
            <p className="text-sm">Two transactions update same row, second overwrites first</p>
            <CodeBlock
              title="Lost Update Problem"
              language="sql"
              code={`-- Transaction 1
BEGIN;
SELECT balance FROM accounts WHERE id = 1;  -- 500
-- Calculates new balance: 500 + 100 = 600
UPDATE accounts SET balance = 600 WHERE id = 1;
COMMIT;

-- Transaction 2 (concurrent)
BEGIN;
SELECT balance FROM accounts WHERE id = 1;  -- 500 (read before Transaction 1 committed)
-- Calculates new balance: 500 + 50 = 550
UPDATE accounts SET balance = 550 WHERE id = 1;  -- Lost Transaction 1's +100!
COMMIT;`}
            />
            <p className="text-sm mt-2"><strong>Solutions:</strong> SELECT FOR UPDATE, optimistic locking, application-level locks</p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Locking Mechanisms</h2>
          
          <CodeBlock
            title="Row-Level Locking"
            language="sql"
            code={`-- SELECT FOR UPDATE: Exclusive lock on rows
BEGIN;
SELECT * FROM accounts WHERE id = 1 FOR UPDATE;
-- Other transactions wait until this commits
UPDATE accounts SET balance = 600 WHERE id = 1;
COMMIT;

-- SELECT FOR SHARE: Shared lock (others can also SELECT FOR SHARE)
BEGIN;
SELECT * FROM accounts WHERE id = 1 FOR SHARE;
COMMIT;

-- NOWAIT: Don't wait, fail immediately if lock unavailable
SELECT * FROM accounts WHERE id = 1 FOR UPDATE NOWAIT;

-- SKIP LOCKED: Skip locked rows
SELECT * FROM accounts WHERE balance > 1000 FOR UPDATE SKIP LOCKED;`}
          />

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Lock Types</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li><strong>Row-level locks:</strong> Lock specific rows (most granular)</li>
              <li><strong>Table-level locks:</strong> Lock entire table</li>
              <li><strong>Advisory locks:</strong> Application-level locks using pg_advisory_lock()</li>
              <li><strong>Exclusive locks:</strong> Only one transaction can hold</li>
              <li><strong>Shared locks:</strong> Multiple transactions can hold</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">MVCC (Multi-Version Concurrency Control)</h2>
          
          <div className="bg-blue-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">How MVCC Works</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>Instead of locking rows, PostgreSQL creates multiple versions of rows</li>
              <li>Each transaction sees a snapshot of the database at transaction start</li>
              <li>Readers don't block writers, writers don't block readers</li>
              <li>Old versions cleaned up by VACUUM</li>
            </ul>
          </div>

          <CodeBlock
            title="MVCC Example"
            language="sql"
            code={`-- Transaction 1 starts
BEGIN;  -- Gets transaction ID (xid) = 100
SELECT * FROM accounts WHERE id = 1;  -- Sees version valid at xid=100

-- Transaction 2 starts and updates
BEGIN;  -- Gets xid = 101
UPDATE accounts SET balance = 600 WHERE id = 1;
COMMIT;  -- Creates new row version

-- Transaction 1 still sees old version (balance = 500)
SELECT * FROM accounts WHERE id = 1;  -- Still sees old data
COMMIT;  -- Now would see new version`}
          />

          <div className="bg-yellow-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Transaction IDs (xid)</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>Each row has xmin (transaction that created it) and xmax (transaction that deleted it)</li>
              <li>Transactions see rows where xmin &lt; their xid and (xmax is NULL or xmax &gt; their xid)</li>
              <li>xid wraps around every 2 billion transactions (requires VACUUM FREEZE)</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Deadlocks</h2>
          
          <CodeBlock
            title="Deadlock Example"
            language="sql"
            code={`-- Transaction 1
BEGIN;
UPDATE accounts SET balance = 600 WHERE id = 1;  -- Locks row 1
UPDATE accounts SET balance = 700 WHERE id = 2;  -- Waits for lock on row 2

-- Transaction 2 (concurrent)
BEGIN;
UPDATE accounts SET balance = 800 WHERE id = 2;  -- Locks row 2
UPDATE accounts SET balance = 900 WHERE id = 1;  -- Waits for lock on row 1
-- DEADLOCK! Both waiting for each other

-- PostgreSQL detects and rolls back one transaction:
-- ERROR: deadlock detected
-- DETAIL: Process waits for ShareLock on transaction; blocked by process.`}
          />

          <div className="bg-red-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Preventing Deadlocks</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>Always acquire locks in the same order</li>
              <li>Keep transactions short</li>
              <li>Use consistent ordering of table updates</li>
              <li>Use lower isolation levels when possible</li>
              <li>Application-level: retry logic for deadlock errors</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Common Interview Questions</h2>
          
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Q: Explain Isolation Levels</h3>
            <p className="text-sm mb-2">
              Isolation levels control how transactions interact with each other. From lowest to highest:
            </p>
            <ol className="list-decimal pl-6 space-y-1 text-sm">
              <li><strong>READ UNCOMMITTED:</strong> Can read uncommitted data (dirty reads)</li>
              <li><strong>READ COMMITTED:</strong> Only read committed data (PostgreSQL default)</li>
              <li><strong>REPEATABLE READ:</strong> Consistent reads throughout transaction</li>
              <li><strong>SERIALIZABLE:</strong> Transactions execute as if serial</li>
            </ol>
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Q: What is MVCC?</h3>
            <p className="text-sm mb-2">
              Multi-Version Concurrency Control maintains multiple versions of rows. Each transaction 
              sees a snapshot of the database. Benefits:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>Readers don't block writers</li>
              <li>Writers don't block readers</li>
              <li>Better concurrency than locking-based systems</li>
              <li>Trade-off: More storage needed for multiple versions</li>
            </ul>
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Q: How to handle Lost Update problem?</h3>
            <CodeBlock
              title="Solutions for Lost Update"
              language="sql"
              code={`-- Solution 1: SELECT FOR UPDATE (Pessimistic Locking)
BEGIN;
SELECT * FROM accounts WHERE id = 1 FOR UPDATE;
-- Update with locked row
UPDATE accounts SET balance = balance + 100 WHERE id = 1;
COMMIT;

-- Solution 2: Optimistic Locking (version column)
UPDATE accounts 
SET balance = balance + 100, version = version + 1
WHERE id = 1 AND version = :expected_version;
-- Check if rows_affected > 0, retry if not

-- Solution 3: Database constraints/triggers
-- Use constraints to prevent invalid states`}
            />
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Q: What causes deadlocks and how to prevent?</h3>
            <p className="text-sm mb-2">
              Deadlocks occur when two or more transactions wait for each other's locks. Prevent by:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>Acquiring locks in consistent order</li>
              <li>Keeping transactions short</li>
              <li>Using appropriate isolation levels</li>
              <li>Implementing retry logic in application</li>
            </ul>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}


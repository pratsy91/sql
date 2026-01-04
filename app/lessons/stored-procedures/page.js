import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Stored Procedures - PostgreSQL Learning',
  description: 'Learn about PostgreSQL stored procedures using CREATE PROCEDURE, CALL, and transaction control',
};

export default function StoredProcedures() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Stored Procedures</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">What are Stored Procedures?</h2>
          <p className="mb-4">
            Stored procedures in PostgreSQL are similar to functions but can control transactions. 
            They don't return values like functions but can have OUT parameters. Procedures are called 
            with the CALL statement and can commit or rollback transactions.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">CREATE PROCEDURE</h2>

          <CodeBlock
            title="SQL: Basic Procedure"
            language="sql"
            code={`-- Basic stored procedure
CREATE OR REPLACE PROCEDURE update_user_status(
  user_id INTEGER,
  new_status TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE users SET status = new_status WHERE id = user_id;
END;
$$;

-- Call the procedure
CALL update_user_status(1, 'active');

-- Procedure with multiple parameters
CREATE OR REPLACE PROCEDURE transfer_funds(
  from_account_id INTEGER,
  to_account_id INTEGER,
  amount NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE accounts SET balance = balance - amount WHERE id = from_account_id;
  UPDATE accounts SET balance = balance + amount WHERE id = to_account_id;
END;
$$;

CALL transfer_funds(1, 2, 100.00);

-- Procedure with default parameters
CREATE OR REPLACE PROCEDURE log_message(
  message TEXT,
  log_level TEXT DEFAULT 'INFO'
)
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO logs (message, level, created_at)
  VALUES (message, log_level, NOW());
END;
$$;

CALL log_message('User logged in');
CALL log_message('Error occurred', 'ERROR');`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Procedures with OUT Parameters</h2>

          <CodeBlock
            title="SQL: Procedures with OUT Parameters"
            language="sql"
            code={`-- Procedure with OUT parameter
CREATE OR REPLACE PROCEDURE create_user(
  name TEXT,
  email TEXT,
  OUT user_id INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO users (name, email) VALUES (name, email)
  RETURNING id INTO user_id;
END;
$$;

-- Call procedure with OUT parameter
DO $$
DECLARE
  new_user_id INTEGER;
BEGIN
  CALL create_user('John Doe', 'john@example.com', new_user_id);
  RAISE NOTICE 'Created user with ID: %', new_user_id;
END;
$$;

-- Multiple OUT parameters
CREATE OR REPLACE PROCEDURE get_user_stats(
  user_id INTEGER,
  OUT total_orders INTEGER,
  OUT total_spent NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  SELECT COUNT(*), COALESCE(SUM(total), 0)
  INTO total_orders, total_spent
  FROM orders
  WHERE user_id = get_user_stats.user_id;
END;
$$;

-- Call with multiple OUT parameters
DO $$
DECLARE
  orders_count INTEGER;
  spent_amount NUMERIC;
BEGIN
  CALL get_user_stats(1, orders_count, spent_amount);
  RAISE NOTICE 'User has % orders, spent %', orders_count, spent_amount;
END;
$$;

-- INOUT parameters
CREATE OR REPLACE PROCEDURE increment_counter(
  INOUT counter INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  counter := counter + 1;
END;
$$;

DO $$
DECLARE
  my_counter INTEGER := 5;
BEGIN
  CALL increment_counter(my_counter);
  RAISE NOTICE 'Counter is now: %', my_counter;  -- Output: 6
END;
$$;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">CALL Statement</h2>

          <CodeBlock
            title="SQL: Using CALL"
            language="sql"
            code={`-- Simple CALL
CREATE OR REPLACE PROCEDURE cleanup_old_logs()
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM logs WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$;

CALL cleanup_old_logs();

-- CALL with parameters
CREATE OR REPLACE PROCEDURE process_order(order_id INTEGER)
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE orders SET status = 'processed' WHERE id = order_id;
  INSERT INTO order_history (order_id, action, timestamp)
  VALUES (order_id, 'processed', NOW());
END;
$$;

CALL process_order(123);

-- CALL in transaction
BEGIN;
  CALL process_order(1);
  CALL process_order(2);
  CALL process_order(3);
COMMIT;

-- CALL with OUT parameters in DO block
DO $$
DECLARE
  result_id INTEGER;
BEGIN
  CALL create_user('Jane Doe', 'jane@example.com', result_id);
  RAISE NOTICE 'Created user ID: %', result_id;
END;
$$;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Transaction Control</h2>

          <CodeBlock
            title="SQL: Transaction Control in Procedures"
            language="sql"
            code={`-- Procedure with COMMIT
CREATE OR REPLACE PROCEDURE process_payment(
  order_id INTEGER,
  amount NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO payments (order_id, amount, created_at)
  VALUES (order_id, amount, NOW());
  
  UPDATE orders SET status = 'paid' WHERE id = order_id;
  
  COMMIT;  -- Commit the transaction
END;
$$;

-- Procedure with transaction control
CREATE OR REPLACE PROCEDURE batch_process_orders()
LANGUAGE plpgsql
AS $$
DECLARE
  order_rec RECORD;
BEGIN
  FOR order_rec IN SELECT id FROM orders WHERE status = 'pending' LOOP
    BEGIN
      UPDATE orders SET status = 'processing' WHERE id = order_rec.id;
      -- Process order
      UPDATE orders SET status = 'completed' WHERE id = order_rec.id;
      COMMIT;
    EXCEPTION
      WHEN OTHERS THEN
        ROLLBACK;
        RAISE NOTICE 'Error processing order %: %', order_rec.id, SQLERRM;
    END;
  END LOOP;
END;
$$;

-- Procedure with SAVEPOINT
CREATE OR REPLACE PROCEDURE complex_operation()
LANGUAGE plpgsql
AS $$
BEGIN
  -- First operation
  INSERT INTO table1 (data) VALUES ('test1');
  
  SAVEPOINT sp1;
  
  BEGIN
    -- Second operation
    INSERT INTO table2 (data) VALUES ('test2');
    
    -- If this fails, rollback to savepoint
  EXCEPTION
    WHEN OTHERS THEN
      ROLLBACK TO SAVEPOINT sp1;
      RAISE;
  END;
  
  -- Continue if successful
  INSERT INTO table3 (data) VALUES ('test3');
END;
$$;

-- Procedure that doesn't commit (default behavior)
CREATE OR REPLACE PROCEDURE update_user_name(
  user_id INTEGER,
  new_name TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE users SET name = new_name WHERE id = user_id;
  -- No COMMIT - transaction control is up to caller
END;
$$;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Procedures vs Functions</h2>

          <CodeBlock
            title="SQL: Procedures vs Functions"
            language="sql"
            code={`-- Function: Returns a value, cannot control transactions
CREATE OR REPLACE FUNCTION calculate_total(price NUMERIC, quantity INTEGER)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN price * quantity;
END;
$$;

SELECT calculate_total(10.00, 5);  -- Returns 50.00

-- Procedure: No return value, can control transactions
CREATE OR REPLACE PROCEDURE update_inventory(
  product_id INTEGER,
  quantity_change INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE products 
  SET stock = stock + quantity_change 
  WHERE id = product_id;
  
  COMMIT;  -- Procedures can commit
END;
$$;

CALL update_inventory(1, -5);

-- Function with side effects (not recommended)
CREATE OR REPLACE FUNCTION update_and_return(user_id INTEGER, new_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE users SET name = new_name WHERE id = user_id;
  RETURN new_name;  -- Function returns value
  -- Cannot use COMMIT in function
END;
$$;

-- Procedure with OUT parameter (similar to function return)
CREATE OR REPLACE PROCEDURE get_user_name(
  user_id INTEGER,
  OUT user_name TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  SELECT name INTO user_name FROM users WHERE id = user_id;
  -- Can use COMMIT if needed
END;
$$;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Prisma: Stored Procedures</h2>

          <CodeBlock
            title="Prisma: Creating and Calling Procedures"
            language="prisma"
            code={`// Prisma doesn't support creating procedures directly
// Use raw SQL to create procedures

// Create a procedure
await prisma.$executeRaw\`
  CREATE OR REPLACE PROCEDURE update_user_status(
    user_id INTEGER,
    new_status TEXT
  )
  LANGUAGE plpgsql
  AS $$
  BEGIN
    UPDATE users SET status = new_status WHERE id = user_id;
  END;
  $$;
\`;

// Call procedure
await prisma.$executeRaw\`
  CALL update_user_status(1, 'active')
\`;

// Procedure with OUT parameter
await prisma.$executeRaw\`
  CREATE OR REPLACE PROCEDURE create_user(
    name TEXT,
    email TEXT,
    OUT user_id INTEGER
  )
  LANGUAGE plpgsql
  AS $$
  BEGIN
    INSERT INTO users (name, email) VALUES (name, email)
    RETURNING id INTO user_id;
  END;
  $$;
\`;

// Call procedure with OUT parameter
const result = await prisma.$queryRaw\`
  DO $$
  DECLARE
    new_id INTEGER;
  BEGIN
    CALL create_user('John Doe', 'john@example.com', new_id);
    RAISE NOTICE 'Created user ID: %', new_id;
  END;
  $$;
\`;

// Procedure in transaction
await prisma.$transaction(async (tx) => {
  await tx.$executeRaw\`CALL process_order(1)\`;
  await tx.$executeRaw\`CALL process_order(2)\`;
});`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Use procedures</strong> for operations that need transaction control</li>
              <li><strong>Use functions</strong> for calculations and queries that return values</li>
              <li><strong>Use OUT parameters</strong> to return values from procedures</li>
              <li><strong>Be careful with COMMIT</strong> - it commits the entire transaction</li>
              <li><strong>Use SAVEPOINT</strong> for partial rollbacks</li>
              <li><strong>Handle exceptions</strong> appropriately in procedures</li>
              <li><strong>Document transaction behavior</strong> - whether procedure commits or not</li>
              <li><strong>Consider caller's transaction</strong> when using COMMIT</li>
            </ul>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}


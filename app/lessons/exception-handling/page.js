import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Exception Handling - PostgreSQL Learning',
  description: 'Learn about PL/pgSQL exception handling with BEGIN/EXCEPTION/END blocks, error codes, and RAISE statements',
};

export default function ExceptionHandling() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Exception Handling</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Basic Exception Handling</h2>

          <CodeBlock
            title="SQL: BEGIN/EXCEPTION/END"
            language="sql"
            code={`-- Basic exception handling
CREATE OR REPLACE FUNCTION safe_divide(a NUMERIC, b NUMERIC)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN a / b;
EXCEPTION
  WHEN division_by_zero THEN
    RETURN NULL;
END;
$$;

-- Multiple exception handlers
CREATE OR REPLACE FUNCTION insert_user_safe(name TEXT, email TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  user_id INTEGER;
BEGIN
  INSERT INTO users (name, email) VALUES (name, email)
  RETURNING id INTO user_id;
  
  RETURN user_id;
EXCEPTION
  WHEN unique_violation THEN
    RAISE NOTICE 'User with email % already exists', email;
    RETURN NULL;
  WHEN not_null_violation THEN
    RAISE NOTICE 'Name and email are required';
    RETURN NULL;
  WHEN OTHERS THEN
    RAISE NOTICE 'Unexpected error occurred';
    RETURN NULL;
END;
$$;

-- Exception with error details
CREATE OR REPLACE FUNCTION process_order(order_id INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  -- Process order logic
  UPDATE orders SET status = 'processed' WHERE id = order_id;
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error processing order %: %', order_id, SQLERRM;
    RETURN FALSE;
END;
$$;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Error Codes</h2>

          <CodeBlock
            title="SQL: Handling Specific Error Codes"
            language="sql"
            code={`-- Handling specific PostgreSQL error codes
CREATE OR REPLACE FUNCTION handle_errors()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  -- Code that might raise errors
  RETURN 'Success';
EXCEPTION
  WHEN unique_violation THEN
    RETURN 'Duplicate key violation';
  WHEN foreign_key_violation THEN
    RETURN 'Foreign key violation';
  WHEN not_null_violation THEN
    RETURN 'Not null violation';
  WHEN check_violation THEN
    RETURN 'Check constraint violation';
  WHEN invalid_text_representation THEN
    RETURN 'Invalid text representation';
  WHEN numeric_value_out_of_range THEN
    RETURN 'Numeric value out of range';
  WHEN string_data_right_truncation THEN
    RETURN 'String data too long';
  WHEN OTHERS THEN
    RETURN 'Other error: ' || SQLERRM;
END;
$$;

-- Using SQLSTATE
CREATE OR REPLACE FUNCTION get_error_type()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  error_code TEXT;
BEGIN
  -- Operation that might fail
  INSERT INTO users (name) VALUES (NULL);
  RETURN 'Success';
EXCEPTION
  WHEN OTHERS THEN
    error_code := SQLSTATE;
    CASE error_code
      WHEN '23505' THEN RETURN 'Unique violation';
      WHEN '23503' THEN RETURN 'Foreign key violation';
      WHEN '23502' THEN RETURN 'Not null violation';
      WHEN '23514' THEN RETURN 'Check violation';
      ELSE RETURN 'Error code: ' || error_code;
    END CASE;
END;
$$;

-- Common error codes
CREATE OR REPLACE FUNCTION error_code_reference()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN 'Common error codes:
23502 - Not null violation
23503 - Foreign key violation
23505 - Unique violation
23514 - Check violation
42P01 - Undefined table
42703 - Undefined column';
EXCEPTION
  WHEN OTHERS THEN
    RETURN SQLERRM;
END;
$$;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">RAISE Statements</h2>

          <CodeBlock
            title="SQL: RAISE Statements"
            language="sql"
            code={`-- RAISE NOTICE (informational message)
CREATE OR REPLACE FUNCTION log_operation(operation TEXT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE NOTICE 'Starting operation: %', operation;
  -- Perform operation
  RAISE NOTICE 'Operation completed: %', operation;
END;
$$;

-- RAISE WARNING (warning message)
CREATE OR REPLACE FUNCTION check_threshold(value NUMERIC)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  IF value > 100 THEN
    RAISE WARNING 'Value % exceeds threshold', value;
    RETURN FALSE;
  END IF;
  RETURN TRUE;
END;
$$;

-- RAISE EXCEPTION (raise an error)
CREATE OR REPLACE FUNCTION validate_age(age INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  IF age < 0 THEN
    RAISE EXCEPTION 'Age cannot be negative: %', age;
  END IF;
  IF age > 150 THEN
    RAISE EXCEPTION 'Age % is unrealistic', age;
  END IF;
  RETURN TRUE;
END;
$$;

-- RAISE with error code
CREATE OR REPLACE FUNCTION custom_error()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION USING
    ERRCODE = 'P0001',
    MESSAGE = 'Custom application error',
    HINT = 'Check the input parameters',
    DETAIL = 'This is a detailed error message';
END;
$$;

-- RAISE with different levels
CREATE OR REPLACE FUNCTION logging_example()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE DEBUG 'Debug message';
  RAISE LOG 'Log message';
  RAISE INFO 'Info message';
  RAISE NOTICE 'Notice message';
  RAISE WARNING 'Warning message';
  -- RAISE EXCEPTION 'Exception message';  -- This would stop execution
END;
$$;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Exception Information Variables</h2>

          <CodeBlock
            title="SQL: Exception Information Variables"
            language="sql"
            code={`-- Using SQLERRM, SQLSTATE, GET STACKED DIAGNOSTICS
CREATE OR REPLACE FUNCTION detailed_error_info()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  error_message TEXT;
  error_state TEXT;
  error_detail TEXT;
  error_hint TEXT;
  error_context TEXT;
BEGIN
  -- Operation that might fail
  INSERT INTO users (id, name) VALUES (1, 'Test');
  RETURN 'Success';
EXCEPTION
  WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS
      error_message = MESSAGE_TEXT,
      error_state = RETURNED_SQLSTATE,
      error_detail = PG_EXCEPTION_DETAIL,
      error_hint = PG_EXCEPTION_HINT,
      error_context = PG_EXCEPTION_CONTEXT;
    
    RETURN 'Error: ' || error_message || E'\\n' ||
           'State: ' || error_state || E'\\n' ||
           'Detail: ' || error_detail || E'\\n' ||
           'Hint: ' || error_hint || E'\\n' ||
           'Context: ' || error_context;
END;
$$;

-- Using SQLERRM and SQLSTATE directly
CREATE OR REPLACE FUNCTION simple_error_info()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  -- Operation that might fail
  SELECT 1/0;
  RETURN 'Success';
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'Error: ' || SQLERRM || ' (Code: ' || SQLSTATE || ')';
END;
$$;

-- GET DIAGNOSTICS for non-exception info
CREATE OR REPLACE FUNCTION get_row_count()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  row_count INTEGER;
BEGIN
  UPDATE users SET last_login = NOW() WHERE active = TRUE;
  
  GET DIAGNOSTICS row_count = ROW_COUNT;
  
  RETURN row_count;
END;
$$;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Nested Exception Handling</h2>

          <CodeBlock
            title="SQL: Nested Exception Blocks"
            language="sql"
            code={`-- Nested exception handling
CREATE OR REPLACE FUNCTION nested_exceptions()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  BEGIN
    -- Inner block
    BEGIN
      -- Operation that might fail
      INSERT INTO users (id, name) VALUES (1, 'Test');
    EXCEPTION
      WHEN unique_violation THEN
        RAISE NOTICE 'Inner: Unique violation caught';
        -- Re-raise or handle
    END;
    
    -- Another operation
    SELECT 1/0;
  EXCEPTION
    WHEN division_by_zero THEN
      RAISE NOTICE 'Outer: Division by zero caught';
  END;
  
  RETURN 'Completed';
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'Outermost: ' || SQLERRM;
END;
$$;

-- Exception propagation
CREATE OR REPLACE FUNCTION propagate_exception()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  BEGIN
    RAISE EXCEPTION 'Inner error';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Caught inner error, re-raising';
      RAISE;  -- Re-raise the exception
  END;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Caught in outer block: %', SQLERRM;
END;
$$;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Prisma: Exception Handling</h2>

          <CodeBlock
            title="Prisma: Exception Handling in Functions"
            language="prisma"
            code={`// Prisma doesn't support PL/pgSQL exception handling directly
// Create functions with exception handling using raw SQL

// Function with exception handling
await prisma.$executeRaw\`
  CREATE OR REPLACE FUNCTION safe_insert_user(name TEXT, email TEXT)
  RETURNS INTEGER
  LANGUAGE plpgsql
  AS $$
  DECLARE
    user_id INTEGER;
  BEGIN
    INSERT INTO users (name, email) VALUES (name, email)
    RETURNING id INTO user_id;
    
    RETURN user_id;
  EXCEPTION
    WHEN unique_violation THEN
      RAISE NOTICE 'User with email % already exists', email;
      RETURN NULL;
    WHEN OTHERS THEN
      RAISE NOTICE 'Error: %', SQLERRM;
      RETURN NULL;
  END;
  $$;
\`;

// Call function and handle errors in Prisma
try {
  const result = await prisma.$queryRaw\`
    SELECT safe_insert_user('John Doe', 'john@example.com') AS user_id
  \`;
} catch (error) {
  console.error('Error calling function:', error);
}

// Function that raises exceptions
await prisma.$executeRaw\`
  CREATE OR REPLACE FUNCTION validate_input(value INTEGER)
  RETURNS BOOLEAN
  LANGUAGE plpgsql
  AS $$
  BEGIN
    IF value < 0 THEN
      RAISE EXCEPTION 'Value must be positive: %', value;
    END IF;
    RETURN TRUE;
  END;
  $$;
\`;

// Handle exceptions from Prisma
try {
  await prisma.$queryRaw\`
    SELECT validate_input(-1) AS result
  \`;
} catch (error) {
  if (error.code === 'P0001') {
    console.error('Validation error:', error.message);
  }
}`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Handle specific exceptions</strong> before general ones</li>
              <li><strong>Use WHEN OTHERS</strong> as a last resort</li>
              <li><strong>Log errors</strong> using RAISE NOTICE or RAISE WARNING</li>
              <li><strong>Use GET STACKED DIAGNOSTICS</strong> for detailed error info</li>
              <li><strong>Re-raise exceptions</strong> when appropriate using RAISE</li>
              <li><strong>Provide meaningful messages</strong> in RAISE EXCEPTION</li>
              <li><strong>Use error codes</strong> for programmatic error handling</li>
              <li><strong>Clean up resources</strong> in exception handlers when needed</li>
            </ul>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}


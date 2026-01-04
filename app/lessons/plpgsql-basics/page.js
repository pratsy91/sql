import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'PL/pgSQL Basics - PostgreSQL Learning',
  description: 'Learn about PL/pgSQL function structure, variables, data types, and basic syntax',
};

export default function PLpgSQLBasics() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">PL/pgSQL Basics</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">What is PL/pgSQL?</h2>
          <p className="mb-4">
            PL/pgSQL is PostgreSQL's procedural language extension. It allows you to write functions, 
            procedures, and triggers with control structures, variables, and exception handling.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Function Structure</h2>

          <CodeBlock
            title="SQL: Basic Function Structure"
            language="sql"
            code={`-- Basic function syntax
CREATE OR REPLACE FUNCTION function_name(parameter1 type1, parameter2 type2)
RETURNS return_type
LANGUAGE plpgsql
AS $$
DECLARE
  -- Variable declarations
BEGIN
  -- Function body
  RETURN value;
END;
$$;

-- Example: Simple function
CREATE OR REPLACE FUNCTION add_numbers(a INTEGER, b INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN a + b;
END;
$$;

-- Call the function
SELECT add_numbers(5, 3);  -- Returns 8

-- Function with default parameters
CREATE OR REPLACE FUNCTION greet(name TEXT, greeting TEXT DEFAULT 'Hello')
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN greeting || ', ' || name || '!';
END;
$$;

SELECT greet('John');  -- Returns 'Hello, John!'
SELECT greet('John', 'Hi');  -- Returns 'Hi, John!'`}
          />

          <CodeBlock
            title="SQL: Function with Multiple Return Types"
            language="sql"
            code={`-- Function returning TABLE
CREATE OR REPLACE FUNCTION get_users_by_age(min_age INTEGER)
RETURNS TABLE(id INTEGER, name TEXT, age INTEGER)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
    SELECT users.id, users.name, users.age
    FROM users
    WHERE users.age >= min_age;
END;
$$;

SELECT * FROM get_users_by_age(18);

-- Function returning SETOF
CREATE OR REPLACE FUNCTION get_even_numbers(max_num INTEGER)
RETURNS SETOF INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  i INTEGER;
BEGIN
  FOR i IN 2..max_num BY 2 LOOP
    RETURN NEXT i;
  END LOOP;
  RETURN;
END;
$$;

SELECT * FROM get_even_numbers(10);  -- Returns 2, 4, 6, 8, 10`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Variables</h2>

          <CodeBlock
            title="SQL: Variable Declarations"
            language="sql"
            code={`-- Variable declaration syntax
CREATE OR REPLACE FUNCTION calculate_total(price NUMERIC, quantity INTEGER)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
  total NUMERIC;
  discount NUMERIC := 0.1;  -- Initialize with default value
  final_price NUMERIC;
BEGIN
  total := price * quantity;
  final_price := total * (1 - discount);
  RETURN final_price;
END;
$$;

-- Variables with different types
CREATE OR REPLACE FUNCTION process_user(user_id INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  user_name TEXT;
  user_age INTEGER;
  is_active BOOLEAN;
  created_at TIMESTAMP;
  metadata JSONB;
BEGIN
  SELECT name, age, active, created_at, metadata
  INTO user_name, user_age, is_active, created_at, metadata
  FROM users
  WHERE id = user_id;
  
  RETURN user_name || ' is ' || user_age || ' years old';
END;
$$;

-- Variable assignment
CREATE OR REPLACE FUNCTION increment_counter()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  counter INTEGER := 0;
BEGIN
  counter := counter + 1;
  counter := counter * 2;
  RETURN counter;
END;
$$;`}
          />

          <CodeBlock
            title="SQL: Variable Scope and Constants"
            language="sql"
            code={`-- Variable scope
CREATE OR REPLACE FUNCTION scope_example()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  outer_var TEXT := 'outer';
BEGIN
  DECLARE
    inner_var TEXT := 'inner';
  BEGIN
    -- Both variables accessible here
    RETURN outer_var || ' - ' || inner_var;
  END;
  -- Only outer_var accessible here
  RETURN outer_var;
END;
$$;

-- Constants
CREATE OR REPLACE FUNCTION calculate_area(radius NUMERIC)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
  PI CONSTANT NUMERIC := 3.14159;
  area NUMERIC;
BEGIN
  area := PI * radius * radius;
  RETURN area;
END;
$$;

-- Using %TYPE for variable types
CREATE OR REPLACE FUNCTION get_user_info(user_id users.id%TYPE)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  user_name users.name%TYPE;
  user_email users.email%TYPE;
BEGIN
  SELECT name, email INTO user_name, user_email
  FROM users
  WHERE id = user_id;
  
  RETURN user_name || ' (' || user_email || ')';
END;
$$;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Data Types</h2>

          <CodeBlock
            title="SQL: PL/pgSQL Data Types"
            language="sql"
            code={`-- All PostgreSQL data types available
CREATE OR REPLACE FUNCTION type_examples()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  -- Numeric types
  int_val INTEGER := 42;
  big_val BIGINT := 9223372036854775807;
  num_val NUMERIC(10, 2) := 1234.56;
  real_val REAL := 3.14;
  
  -- Text types
  text_val TEXT := 'Hello World';
  varchar_val VARCHAR(50) := 'Variable length';
  char_val CHAR(10) := 'Fixed';
  
  -- Boolean
  bool_val BOOLEAN := TRUE;
  
  -- Date/Time
  date_val DATE := '2024-01-01';
  time_val TIME := '12:30:00';
  timestamp_val TIMESTAMP := '2024-01-01 12:30:00';
  interval_val INTERVAL := '1 day 2 hours';
  
  -- Arrays
  int_array INTEGER[] := ARRAY[1, 2, 3, 4, 5];
  text_array TEXT[] := ARRAY['a', 'b', 'c'];
  
  -- JSON
  json_val JSON := '{"key": "value"}';
  jsonb_val JSONB := '{"key": "value"}'::JSONB;
  
  -- Composite types
  point_val POINT := '(1, 2)';
BEGIN
  RETURN 'Types declared successfully';
END;
$$;

-- RECORD type for row data
CREATE OR REPLACE FUNCTION get_user_record(user_id INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  user_rec RECORD;
BEGIN
  SELECT * INTO user_rec
  FROM users
  WHERE id = user_id;
  
  RETURN user_rec.name || ' - ' || user_rec.email;
END;
$$;

-- ROWTYPE for table row structure
CREATE OR REPLACE FUNCTION get_user_rowtype(user_id INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  user_row users%ROWTYPE;
BEGIN
  SELECT * INTO user_row
  FROM users
  WHERE id = user_id;
  
  RETURN user_row.name || ' (' || user_row.id || ')';
END;
$$;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Prisma: PL/pgSQL Functions</h2>

          <CodeBlock
            title="Prisma: Creating Functions"
            language="prisma"
            code={`// Prisma doesn't support creating PL/pgSQL functions directly
// Use raw SQL to create functions

// Create a function
await prisma.$executeRaw\`
  CREATE OR REPLACE FUNCTION add_numbers(a INTEGER, b INTEGER)
  RETURNS INTEGER
  LANGUAGE plpgsql
  AS $$
  BEGIN
    RETURN a + b;
  END;
  $$;
\`;

// Call the function
const result = await prisma.$queryRaw\`
  SELECT add_numbers(5, 3) AS sum
\`;

// Function with parameters
await prisma.$executeRaw\`
  CREATE OR REPLACE FUNCTION get_user_full_name(user_id INTEGER)
  RETURNS TEXT
  LANGUAGE plpgsql
  AS $$
  DECLARE
    full_name TEXT;
  BEGIN
    SELECT first_name || ' ' || last_name INTO full_name
    FROM users
    WHERE id = user_id;
    
    RETURN full_name;
  END;
  $$;
\`;

// Use in queries
const users = await prisma.$queryRaw\`
  SELECT 
    id,
    get_user_full_name(id) AS full_name
  FROM users
\`;`}
          />

          <CodeBlock
            title="Prisma: Calling Functions"
            language="prisma"
            code={`// Call PL/pgSQL functions using raw SQL

// Simple function call
const result = await prisma.$queryRaw\`
  SELECT calculate_total(100.00, 5) AS total
\`;

// Function in WHERE clause
const users = await prisma.user.findMany({
  where: {
    // Use raw SQL for function calls
  }
});

// Or use raw query
const activeUsers = await prisma.$queryRaw\`
  SELECT * FROM users
  WHERE is_user_active(id) = TRUE
\`;

// Function returning table
const userStats = await prisma.$queryRaw\`
  SELECT * FROM get_users_by_age(18)
\`;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Use meaningful names</strong> for functions and variables</li>
              <li><strong>Declare variables</strong> in DECLARE section</li>
              <li><strong>Use %TYPE and %ROWTYPE</strong> for type safety</li>
              <li><strong>Initialize variables</strong> when declaring when possible</li>
              <li><strong>Use CONSTANT</strong> for values that don't change</li>
              <li><strong>Document functions</strong> with comments</li>
              <li><strong>Handle NULL values</strong> appropriately</li>
            </ul>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}


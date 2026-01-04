import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Control Structures - PostgreSQL Learning',
  description: 'Learn about PL/pgSQL control structures including IF/ELSIF/ELSE, CASE, LOOP, WHILE, FOR, EXIT, and CONTINUE',
};

export default function ControlStructures() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Control Structures</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">IF/ELSIF/ELSE</h2>

          <CodeBlock
            title="SQL: IF Statements"
            language="sql"
            code={`-- Basic IF statement
CREATE OR REPLACE FUNCTION check_age(age INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  IF age < 18 THEN
    RETURN 'Minor';
  END IF;
  
  RETURN 'Adult';
END;
$$;

-- IF/ELSE statement
CREATE OR REPLACE FUNCTION get_status(score INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  IF score >= 90 THEN
    RETURN 'Excellent';
  ELSE
    RETURN 'Good';
  END IF;
END;
$$;

-- IF/ELSIF/ELSE statement
CREATE OR REPLACE FUNCTION get_grade(score INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  IF score >= 90 THEN
    RETURN 'A';
  ELSIF score >= 80 THEN
    RETURN 'B';
  ELSIF score >= 70 THEN
    RETURN 'C';
  ELSIF score >= 60 THEN
    RETURN 'D';
  ELSE
    RETURN 'F';
  END IF;
END;
$$;

-- Nested IF statements
CREATE OR REPLACE FUNCTION process_order(order_id INTEGER, discount NUMERIC)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
  total NUMERIC;
  final_total NUMERIC;
BEGIN
  SELECT SUM(price * quantity) INTO total
  FROM order_items
  WHERE order_id = order_id;
  
  IF total > 100 THEN
    IF discount > 0.2 THEN
      final_total := total * (1 - 0.2);
    ELSE
      final_total := total * (1 - discount);
    END IF;
  ELSE
    final_total := total;
  END IF;
  
  RETURN final_total;
END;
$$;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">CASE Statements</h2>

          <CodeBlock
            title="SQL: CASE in PL/pgSQL"
            language="sql"
            code={`-- Simple CASE statement
CREATE OR REPLACE FUNCTION get_day_name(day_num INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  CASE day_num
    WHEN 1 THEN RETURN 'Monday';
    WHEN 2 THEN RETURN 'Tuesday';
    WHEN 3 THEN RETURN 'Wednesday';
    WHEN 4 THEN RETURN 'Thursday';
    WHEN 5 THEN RETURN 'Friday';
    WHEN 6 THEN RETURN 'Saturday';
    WHEN 7 THEN RETURN 'Sunday';
    ELSE RETURN 'Invalid day';
  END CASE;
END;
$$;

-- Searched CASE statement
CREATE OR REPLACE FUNCTION get_price_category(price NUMERIC)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  CASE
    WHEN price < 10 THEN RETURN 'Low';
    WHEN price < 50 THEN RETURN 'Medium';
    WHEN price < 100 THEN RETURN 'High';
    ELSE RETURN 'Premium';
  END CASE;
END;
$$;

-- CASE with multiple statements
CREATE OR REPLACE FUNCTION process_user_type(user_type TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  result TEXT;
BEGIN
  CASE user_type
    WHEN 'admin' THEN
      result := 'Administrator';
      -- Additional logic here
    WHEN 'user' THEN
      result := 'Regular User';
    WHEN 'guest' THEN
      result := 'Guest User';
    ELSE
      result := 'Unknown';
  END CASE;
  
  RETURN result;
END;
$$;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">LOOP Statements</h2>

          <CodeBlock
            title="SQL: Basic LOOP"
            language="sql"
            code={`-- Basic LOOP with EXIT
CREATE OR REPLACE FUNCTION sum_to_n(n INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  i INTEGER := 1;
  total INTEGER := 0;
BEGIN
  LOOP
    total := total + i;
    i := i + 1;
    EXIT WHEN i > n;
  END LOOP;
  
  RETURN total;
END;
$$;

-- LOOP with EXIT WHEN
CREATE OR REPLACE FUNCTION find_first_even(numbers INTEGER[])
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  i INTEGER := 1;
  num INTEGER;
BEGIN
  LOOP
    num := numbers[i];
    EXIT WHEN num % 2 = 0;
    i := i + 1;
    EXIT WHEN i > array_length(numbers, 1);
  END LOOP;
  
  RETURN num;
END;
$$;

-- Nested loops
CREATE OR REPLACE FUNCTION multiplication_table(max_num INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  i INTEGER := 1;
  j INTEGER;
  result TEXT := '';
BEGIN
  LOOP
    j := 1;
    LOOP
      result := result || (i * j) || ' ';
      j := j + 1;
      EXIT WHEN j > max_num;
    END LOOP;
    result := result || E'\\n';
    i := i + 1;
    EXIT WHEN i > max_num;
  END LOOP;
  
  RETURN result;
END;
$$;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">WHILE Loop</h2>

          <CodeBlock
            title="SQL: WHILE Loop"
            language="sql"
            code={`-- Basic WHILE loop
CREATE OR REPLACE FUNCTION factorial(n INTEGER)
RETURNS BIGINT
LANGUAGE plpgsql
AS $$
DECLARE
  result BIGINT := 1;
  counter INTEGER := 1;
BEGIN
  WHILE counter <= n LOOP
    result := result * counter;
    counter := counter + 1;
  END LOOP;
  
  RETURN result;
END;
$$;

-- WHILE with condition
CREATE OR REPLACE FUNCTION countdown(start_num INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  num INTEGER := start_num;
  result TEXT := '';
BEGIN
  WHILE num > 0 LOOP
    result := result || num || ' ';
    num := num - 1;
  END LOOP;
  
  RETURN result;
END;
$$;

-- WHILE with complex condition
CREATE OR REPLACE FUNCTION process_until_condition()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  value INTEGER := 1;
  sum INTEGER := 0;
BEGIN
  WHILE value < 100 AND sum < 1000 LOOP
    sum := sum + value;
    value := value * 2;
  END LOOP;
  
  RETURN sum;
END;
$$;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">FOR Loop</h2>

          <CodeBlock
            title="SQL: FOR Loop"
            language="sql"
            code={`-- FOR loop with integer range
CREATE OR REPLACE FUNCTION sum_range(start_num INTEGER, end_num INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  total INTEGER := 0;
BEGIN
  FOR i IN start_num..end_num LOOP
    total := total + i;
  END LOOP;
  
  RETURN total;
END;
$$;

-- FOR loop with REVERSE
CREATE OR REPLACE FUNCTION reverse_count(n INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  result TEXT := '';
BEGIN
  FOR i IN REVERSE n..1 LOOP
    result := result || i || ' ';
  END LOOP;
  
  RETURN result;
END;
$$;

-- FOR loop with array
CREATE OR REPLACE FUNCTION sum_array(numbers INTEGER[])
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  total INTEGER := 0;
BEGIN
  FOR i IN 1..array_length(numbers, 1) LOOP
    total := total + numbers[i];
  END LOOP;
  
  RETURN total;
END;
$$;

-- FOR loop with query result
CREATE OR REPLACE FUNCTION get_user_names()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  result TEXT := '';
  user_rec RECORD;
BEGIN
  FOR user_rec IN SELECT name FROM users ORDER BY name LOOP
    result := result || user_rec.name || ', ';
  END LOOP;
  
  RETURN result;
END;
$$;

-- FOR loop with dynamic range
CREATE OR REPLACE FUNCTION process_items(item_ids INTEGER[])
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  count INTEGER := 0;
  item_id INTEGER;
BEGIN
  FOREACH item_id IN ARRAY item_ids LOOP
    -- Process each item
    count := count + 1;
  END LOOP;
  
  RETURN count;
END;
$$;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">EXIT and CONTINUE</h2>

          <CodeBlock
            title="SQL: EXIT and CONTINUE"
            language="sql"
            code={`-- EXIT statement
CREATE OR REPLACE FUNCTION find_first_positive(numbers INTEGER[])
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  i INTEGER := 1;
  num INTEGER;
BEGIN
  LOOP
    num := numbers[i];
    IF num > 0 THEN
      EXIT;  -- Exit the loop
    END IF;
    i := i + 1;
    EXIT WHEN i > array_length(numbers, 1);
  END LOOP;
  
  RETURN num;
END;
$$;

-- EXIT with label
CREATE OR REPLACE FUNCTION nested_loop_example()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  result TEXT := '';
  i INTEGER;
  j INTEGER;
BEGIN
  <<outer_loop>>
  FOR i IN 1..5 LOOP
    <<inner_loop>>
    FOR j IN 1..5 LOOP
      IF i * j > 20 THEN
        EXIT outer_loop;  -- Exit outer loop
      END IF;
      result := result || (i * j) || ' ';
    END LOOP inner_loop;
  END LOOP outer_loop;
  
  RETURN result;
END;
$$;

-- CONTINUE statement
CREATE OR REPLACE FUNCTION sum_evens(numbers INTEGER[])
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  total INTEGER := 0;
  num INTEGER;
BEGIN
  FOREACH num IN ARRAY numbers LOOP
    IF num % 2 != 0 THEN
      CONTINUE;  -- Skip odd numbers
    END IF;
    total := total + num;
  END LOOP;
  
  RETURN total;
END;
$$;

-- CONTINUE with label
CREATE OR REPLACE FUNCTION process_matrix()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  count INTEGER := 0;
  i INTEGER;
  j INTEGER;
BEGIN
  <<outer>>
  FOR i IN 1..10 LOOP
    <<inner>>
    FOR j IN 1..10 LOOP
      IF i = j THEN
        CONTINUE inner;  -- Skip diagonal
      END IF;
      count := count + 1;
    END LOOP inner;
  END LOOP outer;
  
  RETURN count;
END;
$$;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Prisma: Control Structures</h2>

          <CodeBlock
            title="Prisma: Using Control Structures in Functions"
            language="prisma"
            code={`// Prisma doesn't support PL/pgSQL control structures directly
// Create functions with control structures using raw SQL

// Function with IF/ELSE
await prisma.$executeRaw\`
  CREATE OR REPLACE FUNCTION check_user_status(user_id INTEGER)
  RETURNS TEXT
  LANGUAGE plpgsql
  AS $$
  DECLARE
    user_status TEXT;
  BEGIN
    SELECT status INTO user_status FROM users WHERE id = user_id;
    
    IF user_status = 'active' THEN
      RETURN 'User is active';
    ELSE
      RETURN 'User is inactive';
    END IF;
  END;
  $$;
\`;

// Function with FOR loop
await prisma.$executeRaw\`
  CREATE OR REPLACE FUNCTION process_orders(order_ids INTEGER[])
  RETURNS INTEGER
  LANGUAGE plpgsql
  AS $$
  DECLARE
    processed_count INTEGER := 0;
    order_id INTEGER;
  BEGIN
    FOREACH order_id IN ARRAY order_ids LOOP
      -- Process order
      processed_count := processed_count + 1;
    END LOOP;
    
    RETURN processed_count;
  END;
  $$;
\`;

// Call functions with control structures
const result = await prisma.$queryRaw\`
  SELECT check_user_status(1) AS status
\`;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Use IF/ELSIF/ELSE</strong> for conditional logic</li>
              <li><strong>Use CASE</strong> for multiple value comparisons</li>
              <li><strong>Use FOR loops</strong> for iterating over known ranges</li>
              <li><strong>Use WHILE loops</strong> when condition is unknown</li>
              <li><strong>Use EXIT</strong> to break out of loops early</li>
              <li><strong>Use CONTINUE</strong> to skip iterations</li>
              <li><strong>Use labels</strong> for nested loops and clarity</li>
              <li><strong>Avoid infinite loops</strong> - always have exit conditions</li>
            </ul>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}


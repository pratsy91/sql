import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Cursors - PostgreSQL Learning',
  description: 'Learn about PL/pgSQL cursors for processing query results row by row',
};

export default function Cursors() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Cursors</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">What are Cursors?</h2>
          <p className="mb-4">
            Cursors allow you to process query results row by row in PL/pgSQL. They provide a way to 
            iterate through result sets and perform operations on each row individually.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Declaring Cursors</h2>

          <CodeBlock
            title="SQL: Cursor Declaration"
            language="sql"
            code={`-- Basic cursor declaration
CREATE OR REPLACE FUNCTION process_users()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  user_cursor CURSOR FOR
    SELECT id, name, email FROM users;
BEGIN
  -- Process cursor
  RETURN 'Processed';
END;
$$;

-- Cursor with parameters
CREATE OR REPLACE FUNCTION process_users_by_status(status TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  user_cursor CURSOR(status_param TEXT) FOR
    SELECT id, name FROM users WHERE status = status_param;
  count INTEGER := 0;
BEGIN
  -- Process cursor
  RETURN count;
END;
$$;

-- Cursor with WHERE clause
CREATE OR REPLACE FUNCTION process_active_users()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  active_cursor CURSOR FOR
    SELECT * FROM users WHERE active = TRUE;
BEGIN
  -- Process cursor
  RETURN 'Done';
END;
$$;

-- Cursor with ORDER BY
CREATE OR REPLACE FUNCTION process_users_sorted()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  sorted_cursor CURSOR FOR
    SELECT id, name, created_at 
    FROM users 
    ORDER BY created_at DESC;
BEGIN
  -- Process cursor
  RETURN 'Done';
END;
$$;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Opening and Closing Cursors</h2>

          <CodeBlock
            title="SQL: Opening and Closing Cursors"
            language="sql"
            code={`-- Open and close cursor
CREATE OR REPLACE FUNCTION count_users()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  user_cursor CURSOR FOR SELECT id FROM users;
  count INTEGER := 0;
  user_id INTEGER;
BEGIN
  OPEN user_cursor;
  
  LOOP
    FETCH user_cursor INTO user_id;
    EXIT WHEN NOT FOUND;
    count := count + 1;
  END LOOP;
  
  CLOSE user_cursor;
  
  RETURN count;
END;
$$;

-- Open cursor with parameters
CREATE OR REPLACE FUNCTION process_users_by_age(min_age INTEGER, max_age INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  age_cursor CURSOR(min INTEGER, max INTEGER) FOR
    SELECT id, name, age FROM users WHERE age BETWEEN min AND max;
  user_rec RECORD;
  count INTEGER := 0;
BEGIN
  OPEN age_cursor(min_age, max_age);
  
  LOOP
    FETCH age_cursor INTO user_rec;
    EXIT WHEN NOT FOUND;
    count := count + 1;
  END LOOP;
  
  CLOSE age_cursor;
  
  RETURN count;
END;
$$;

-- Cursor automatically closed at end of function
CREATE OR REPLACE FUNCTION process_orders()
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
  order_cursor CURSOR FOR SELECT total FROM orders;
  total_amount NUMERIC := 0;
  order_total NUMERIC;
BEGIN
  OPEN order_cursor;
  
  LOOP
    FETCH order_cursor INTO order_total;
    EXIT WHEN NOT FOUND;
    total_amount := total_amount + order_total;
  END LOOP;
  
  -- Cursor automatically closed when function exits
  RETURN total_amount;
END;
$$;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">FETCH Operations</h2>

          <CodeBlock
            title="SQL: FETCH Operations"
            language="sql"
            code={`-- FETCH INTO single variables
CREATE OR REPLACE FUNCTION get_user_names()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  user_cursor CURSOR FOR SELECT name FROM users;
  user_name TEXT;
  result TEXT := '';
BEGIN
  OPEN user_cursor;
  
  LOOP
    FETCH user_cursor INTO user_name;
    EXIT WHEN NOT FOUND;
    result := result || user_name || ', ';
  END LOOP;
  
  CLOSE user_cursor;
  
  RETURN result;
END;
$$;

-- FETCH INTO RECORD
CREATE OR REPLACE FUNCTION process_user_records()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  user_cursor CURSOR FOR SELECT * FROM users;
  user_rec RECORD;
  result TEXT := '';
BEGIN
  OPEN user_cursor;
  
  LOOP
    FETCH user_cursor INTO user_rec;
    EXIT WHEN NOT FOUND;
    result := result || user_rec.name || ' (' || user_rec.email || '), ';
  END LOOP;
  
  CLOSE user_cursor;
  
  RETURN result;
END;
$$;

-- FETCH NEXT, PRIOR, FIRST, LAST, ABSOLUTE, RELATIVE
CREATE OR REPLACE FUNCTION navigate_cursor()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  user_cursor CURSOR FOR SELECT name FROM users ORDER BY name;
  user_name TEXT;
  result TEXT := '';
BEGIN
  OPEN user_cursor;
  
  -- Fetch first row
  FETCH FIRST FROM user_cursor INTO user_name;
  result := result || 'First: ' || user_name || E'\\n';
  
  -- Fetch next row
  FETCH NEXT FROM user_cursor INTO user_name;
  result := result || 'Next: ' || user_name || E'\\n';
  
  -- Fetch absolute position
  FETCH ABSOLUTE 5 FROM user_cursor INTO user_name;
  result := result || 'Position 5: ' || user_name || E'\\n';
  
  -- Fetch relative
  FETCH RELATIVE 2 FROM user_cursor INTO user_name;
  result := result || 'Relative +2: ' || user_name || E'\\n';
  
  -- Fetch last
  FETCH LAST FROM user_cursor INTO user_name;
  result := result || 'Last: ' || user_name || E'\\n';
  
  CLOSE user_cursor;
  
  RETURN result;
END;
$$;

-- Check FOUND after FETCH
CREATE OR REPLACE FUNCTION safe_fetch_example()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  user_cursor CURSOR FOR SELECT id FROM users WHERE id > 1000;
  user_id INTEGER;
  count INTEGER := 0;
BEGIN
  OPEN user_cursor;
  
  LOOP
    FETCH user_cursor INTO user_id;
    IF NOT FOUND THEN
      EXIT;
    END IF;
    count := count + 1;
  END LOOP;
  
  CLOSE user_cursor;
  
  RETURN count;
END;
$$;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Cursor Attributes</h2>

          <CodeBlock
            title="SQL: Cursor Attributes"
            language="sql"
            code={`-- Using %FOUND, %NOTFOUND, %ROWCOUNT, %ISOPEN
CREATE OR REPLACE FUNCTION cursor_attributes_example()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  user_cursor CURSOR FOR SELECT id, name FROM users;
  user_id INTEGER;
  user_name TEXT;
  result TEXT := '';
BEGIN
  OPEN user_cursor;
  
  -- Check if cursor is open
  IF user_cursor%ISOPEN THEN
    result := result || 'Cursor is open' || E'\\n';
  END IF;
  
  LOOP
    FETCH user_cursor INTO user_id, user_name;
    
    -- Check if row was found
    IF user_cursor%FOUND THEN
      result := result || 'Row ' || user_cursor%ROWCOUNT || ': ' || user_name || E'\\n';
    END IF;
    
    EXIT WHEN user_cursor%NOTFOUND;
  END LOOP;
  
  result := result || 'Total rows: ' || user_cursor%ROWCOUNT || E'\\n';
  
  CLOSE user_cursor;
  
  RETURN result;
END;
$$;

-- Using %ROWCOUNT
CREATE OR REPLACE FUNCTION process_with_count()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  order_cursor CURSOR FOR SELECT id FROM orders WHERE status = 'pending';
  order_id INTEGER;
BEGIN
  OPEN order_cursor;
  
  LOOP
    FETCH order_cursor INTO order_id;
    EXIT WHEN NOT FOUND;
    
    -- Process order
    -- Use %ROWCOUNT to track progress
    IF order_cursor%ROWCOUNT % 100 = 0 THEN
      -- Log progress every 100 rows
      RAISE NOTICE 'Processed % rows', order_cursor%ROWCOUNT;
    END IF;
  END LOOP;
  
  CLOSE order_cursor;
  
  RETURN order_cursor%ROWCOUNT;
END;
$$;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Cursor FOR Loop</h2>

          <CodeBlock
            title="SQL: Cursor FOR Loop"
            language="sql"
            code={`-- FOR loop with cursor (simplified)
CREATE OR REPLACE FUNCTION process_users_simple()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  result TEXT := '';
BEGIN
  FOR user_rec IN 
    SELECT id, name, email FROM users
  LOOP
    result := result || user_rec.name || ' (' || user_rec.email || '), ';
  END LOOP;
  
  RETURN result;
END;
$$;

-- FOR loop with named cursor
CREATE OR REPLACE FUNCTION process_users_cursor()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  user_cursor CURSOR FOR SELECT id FROM users WHERE active = TRUE;
  user_rec RECORD;
  count INTEGER := 0;
BEGIN
  FOR user_rec IN user_cursor LOOP
    count := count + 1;
    -- Process user_rec.id
  END LOOP;
  
  RETURN count;
END;
$$;

-- FOR loop with parameterized cursor
CREATE OR REPLACE FUNCTION process_by_category(category_id INTEGER)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
  product_cursor CURSOR(cat_id INTEGER) FOR
    SELECT price, quantity FROM products WHERE category_id = cat_id;
  product_rec RECORD;
  total_value NUMERIC := 0;
BEGIN
  FOR product_rec IN product_cursor(category_id) LOOP
    total_value := total_value + (product_rec.price * product_rec.quantity);
  END LOOP;
  
  RETURN total_value;
END;
$$;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Prisma: Cursors</h2>

          <CodeBlock
            title="Prisma: Using Cursors in Functions"
            language="prisma"
            code={`// Prisma doesn't support cursors directly
// Create functions with cursors using raw SQL

// Function with cursor
await prisma.$executeRaw\`
  CREATE OR REPLACE FUNCTION process_all_users()
  RETURNS INTEGER
  LANGUAGE plpgsql
  AS $$
  DECLARE
    user_cursor CURSOR FOR SELECT id FROM users;
    user_id INTEGER;
    count INTEGER := 0;
  BEGIN
    OPEN user_cursor;
    
    LOOP
      FETCH user_cursor INTO user_id;
      EXIT WHEN NOT FOUND;
      count := count + 1;
    END LOOP;
    
    CLOSE user_cursor;
    
    RETURN count;
  END;
  $$;
\`;

// Function with cursor FOR loop
await prisma.$executeRaw\`
  CREATE OR REPLACE FUNCTION get_user_summary()
  RETURNS TEXT
  LANGUAGE plpgsql
  AS $$
  DECLARE
    result TEXT := '';
    user_rec RECORD;
  BEGIN
    FOR user_rec IN SELECT name, email FROM users LOOP
      result := result || user_rec.name || ' - ' || user_rec.email || E'\\n';
    END LOOP;
    
    RETURN result;
  END;
  $$;
\`;

// Call cursor-based functions
const result = await prisma.$queryRaw\`
  SELECT process_all_users() AS user_count
\`;

const summary = await prisma.$queryRaw\`
  SELECT get_user_summary() AS summary
\`;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Use FOR loops</strong> instead of explicit cursors when possible</li>
              <li><strong>Always close cursors</strong> or let them auto-close</li>
              <li><strong>Check FOUND</strong> after FETCH operations</li>
              <li><strong>Use %ROWCOUNT</strong> to track progress</li>
              <li><strong>Use %ISOPEN</strong> to check cursor state</li>
              <li><strong>Parameterize cursors</strong> for flexibility</li>
              <li><strong>Consider performance</strong> - cursors can be slower than set operations</li>
              <li><strong>Use RECORD type</strong> for fetching entire rows</li>
            </ul>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}


import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'SQL Injection Prevention - PostgreSQL Learning',
  description: 'Learn about preventing SQL injection attacks using parameterized queries and best practices',
};

export default function SQLInjectionPrevention() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">SQL Injection Prevention</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">What is SQL Injection?</h2>
          <p className="mb-4">
            SQL injection is a security vulnerability where an attacker can inject malicious SQL code 
            into queries. This happens when user input is directly concatenated into SQL strings without 
            proper sanitization. The solution is to use parameterized queries (prepared statements) that 
            separate SQL code from data.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Vulnerable Code Examples</h2>

          <CodeBlock
            title="SQL: SQL Injection Vulnerabilities"
            language="sql"
            code={`-- VULNERABLE: String concatenation
-- DO NOT DO THIS:
-- SELECT * FROM users WHERE email = ''' || user_input || '''';

-- Example attack:
-- user_input = 'admin@example.com'' OR ''1''=''1'
-- Results in: SELECT * FROM users WHERE email = 'admin@example.com' OR '1'='1'
-- Returns all users!

-- VULNERABLE: Direct interpolation
-- DO NOT DO THIS:
-- SELECT * FROM users WHERE id = $1
-- WHERE $1 is directly interpolated without parameterization

-- Example attack:
-- user_input = '1; DROP TABLE users; --'
-- Could execute: SELECT * FROM users WHERE id = 1; DROP TABLE users; --

-- VULNERABLE: Dynamic SQL without sanitization
-- DO NOT DO THIS:
-- EXECUTE 'SELECT * FROM ' || table_name || ' WHERE id = ' || user_id;

-- Example attack:
-- table_name = 'users; DROP TABLE orders; --'
-- Could execute: SELECT * FROM users; DROP TABLE orders; -- WHERE id = 1

-- VULNERABLE: LIKE patterns
-- DO NOT DO THIS:
-- SELECT * FROM users WHERE name LIKE '%' || user_input || '%';

-- Example attack:
-- user_input = '%'; DROP TABLE users; --
-- Could execute: SELECT * FROM users WHERE name LIKE '%%'; DROP TABLE users; --%'`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Parameterized Queries</h2>

          <CodeBlock
            title="SQL: Safe Parameterized Queries"
            language="sql"
            code={`-- SAFE: Parameterized query with $1, $2, etc.
PREPARE get_user AS
  SELECT * FROM users WHERE email = $1;
EXECUTE get_user('user@example.com');

-- SAFE: Direct parameterized query
SELECT * FROM users WHERE email = $1;
-- Pass 'user@example.com' as parameter

-- SAFE: Multiple parameters
SELECT * FROM users 
WHERE email = $1 AND status = $2;
-- Pass parameters separately

-- SAFE: Using format() for identifiers (not values!)
-- For table/column names, use format with %I
SELECT * FROM format('%I', table_name);
-- %I properly escapes identifiers

-- SAFE: Using quote_ident() for identifiers
SELECT * FROM quote_ident(table_name);
-- Properly escapes identifier

-- SAFE: Using quote_literal() for values (but prefer parameters)
SELECT * FROM users WHERE email = quote_literal(user_input);
-- Escapes string, but parameters are better

-- SAFE: In PL/pgSQL functions
CREATE FUNCTION get_user(user_email TEXT)
RETURNS TABLE(id INTEGER, name TEXT, email TEXT)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT users.id, users.name, users.email
  FROM users
  WHERE users.email = user_email;  -- Parameter, not concatenated
END;
$$;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Dynamic SQL Safety</h2>

          <CodeBlock
            title="SQL: Safe Dynamic SQL"
            language="sql"
            code={`-- SAFE: Using format() with %I for identifiers
CREATE FUNCTION get_table_data(table_name TEXT)
RETURNS TABLE(id INTEGER)
LANGUAGE plpgsql
AS $$
DECLARE
  sql_text TEXT;
BEGIN
  sql_text := format('SELECT id FROM %I', table_name);
  -- %I escapes identifier properly
  
  RETURN QUERY EXECUTE sql_text;
END;
$$;

-- SAFE: Using format() with %L for literals (but prefer parameters)
CREATE FUNCTION search_users(search_term TEXT)
RETURNS TABLE(id INTEGER, name TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
  sql_text TEXT;
BEGIN
  sql_text := format('SELECT id, name FROM users WHERE name LIKE %L', '%' || search_term || '%');
  -- %L escapes literal, but parameters are better
  
  RETURN QUERY EXECUTE sql_text;
END;
$$;

-- SAFE: Using parameters with EXECUTE
CREATE FUNCTION get_user_by_id(user_id INTEGER)
RETURNS TABLE(id INTEGER, name TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
  sql_text TEXT;
BEGIN
  sql_text := 'SELECT id, name FROM users WHERE id = $1';
  RETURN QUERY EXECUTE sql_text USING user_id;
  -- Parameter passed separately, safe
END;
$$;

-- SAFE: Multiple parameters with EXECUTE
CREATE FUNCTION find_users(email_filter TEXT, status_filter TEXT)
RETURNS TABLE(id INTEGER, name TEXT, email TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
  sql_text TEXT;
BEGIN
  sql_text := 'SELECT id, name, email FROM users WHERE email = $1 AND status = $2';
  RETURN QUERY EXECUTE sql_text USING email_filter, status_filter;
END;
$$;

-- UNSAFE: Direct string concatenation in EXECUTE
-- DO NOT DO THIS:
-- EXECUTE 'SELECT * FROM users WHERE email = ''' || user_input || '''';`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Input Validation</h2>

          <CodeBlock
            title="SQL: Input Validation"
            language="sql"
            code={`-- Validate input before using
CREATE FUNCTION safe_get_user(user_email TEXT)
RETURNS TABLE(id INTEGER, name TEXT, email TEXT)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Validate email format
  IF user_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- Validate length
  IF length(user_email) > 255 THEN
    RAISE EXCEPTION 'Email too long';
  END IF;
  
  -- Use parameterized query
  RETURN QUERY
  SELECT users.id, users.name, users.email
  FROM users
  WHERE users.email = safe_get_user.user_email;
END;
$$;

-- Whitelist validation for identifiers
CREATE FUNCTION safe_get_table(table_name TEXT)
RETURNS TABLE(id INTEGER)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Whitelist allowed table names
  IF table_name NOT IN ('users', 'orders', 'products') THEN
    RAISE EXCEPTION 'Invalid table name';
  END IF;
  
  RETURN QUERY EXECUTE format('SELECT id FROM %I', table_name);
END;
$$;

-- Validate numeric input
CREATE FUNCTION safe_get_user_by_id(user_id TEXT)
RETURNS TABLE(id INTEGER, name TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
  user_id_int INTEGER;
BEGIN
  -- Validate and convert
  BEGIN
    user_id_int := user_id::INTEGER;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE EXCEPTION 'Invalid user ID';
  END;
  
  RETURN QUERY
  SELECT users.id, users.name
  FROM users
  WHERE users.id = user_id_int;
END;
$$;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Prisma: SQL Injection Prevention</h2>

          <CodeBlock
            title="Prisma: Safe Query Practices"
            language="prisma"
            code={`// Prisma automatically uses parameterized queries
// All Prisma queries are safe from SQL injection

// SAFE: Prisma automatically parameterizes
const user = await prisma.user.findUnique({
  where: {
    email: userInput  // Automatically parameterized
  }
});

// SAFE: Prisma where clauses
const users = await prisma.user.findMany({
  where: {
    name: {
      contains: userInput  // Automatically parameterized
    }
  }
});

// SAFE: Prisma raw queries with parameters
const users = await prisma.$queryRaw\`
  SELECT * FROM "User" WHERE email = $1
\`, userInput;
// $1 is parameterized, safe

// SAFE: Multiple parameters
const users = await prisma.$queryRaw\`
  SELECT * FROM "User" 
  WHERE email = $1 AND status = $2
\`, email, status;

// SAFE: Using Prisma.$queryRawUnsafe with format for identifiers
const tableName = 'User';  // From whitelist, not user input
const users = await prisma.$queryRawUnsafe(
  'SELECT * FROM ' + tableName  // Only if tableName is validated
);

// UNSAFE: Direct string interpolation in raw SQL
// DO NOT DO THIS:
// const query = 'SELECT * FROM "User" WHERE email = \\'' + userInput + '\\'';
// await prisma.$queryRawUnsafe(query);

// SAFE: For dynamic table names, use format
const safeTableName = 'User';  // Validated/whitelisted
const users = await prisma.$queryRaw\`
  SELECT * FROM \${Prisma.raw(safeTableName)}
\`;

// Or use format function
const users = await prisma.$queryRaw\`
  SELECT * FROM format('%I', $1)
\`, tableName;  // Only if tableName is validated

// SAFE: Prisma transactions
await prisma.$transaction(async (tx) => {
  await tx.user.create({
    data: {
      email: userInput  // Automatically parameterized
    }
  });
});

// Best practices with Prisma:
// 1. Always use Prisma query methods (automatically safe)
// 2. Use $queryRaw with parameters for raw SQL
// 3. Validate input before queries
// 4. Whitelist table/column names for dynamic queries
// 5. Never use $queryRawUnsafe with user input`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Always use parameterized queries</strong> - never concatenate user input</li>
              <li><strong>Use Prisma query methods</strong> - they're automatically safe</li>
              <li><strong>Validate input</strong> - check format, length, type before using</li>
              <li><strong>Whitelist identifiers</strong> - for table/column names, use whitelists</li>
              <li><strong>Use format() with %I</strong> - for dynamic identifiers, not values</li>
              <li><strong>Use quote_ident()</strong> - for escaping identifiers</li>
              <li><strong>Limit database privileges</strong> - use least privilege principle</li>
              <li><strong>Use prepared statements</strong> - in application code</li>
              <li><strong>Sanitize output</strong> - escape output for display</li>
              <li><strong>Regular security audits</strong> - review code for vulnerabilities</li>
            </ul>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}


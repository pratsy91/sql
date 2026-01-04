import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Dynamic SQL - PostgreSQL Learning',
  description: 'Learn about PL/pgSQL dynamic SQL using EXECUTE and format function',
};

export default function DynamicSQL() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Dynamic SQL</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">What is Dynamic SQL?</h2>
          <p className="mb-4">
            Dynamic SQL allows you to construct and execute SQL statements at runtime. This is useful 
            when you need to build queries based on variable conditions or when table/column names are 
            determined at runtime.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">EXECUTE Statement</h2>

          <CodeBlock
            title="SQL: Basic EXECUTE"
            language="sql"
            code={`-- Basic EXECUTE with string
CREATE OR REPLACE FUNCTION execute_dynamic()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  sql_text TEXT;
  result INTEGER;
BEGIN
  sql_text := 'SELECT COUNT(*) FROM users';
  EXECUTE sql_text INTO result;
  
  RETURN result;
END;
$$;

-- EXECUTE with parameters
CREATE OR REPLACE FUNCTION get_user_count(status TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  count INTEGER;
BEGIN
  EXECUTE 'SELECT COUNT(*) FROM users WHERE status = $1'
    INTO count
    USING status;
  
  RETURN count;
END;
$$;

-- EXECUTE with multiple parameters
CREATE OR REPLACE FUNCTION find_users(min_age INTEGER, max_age INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  count INTEGER;
BEGIN
  EXECUTE 'SELECT COUNT(*) FROM users WHERE age BETWEEN $1 AND $2'
    INTO count
    USING min_age, max_age;
  
  RETURN count;
END;
$$;

-- EXECUTE returning a value
CREATE OR REPLACE FUNCTION get_max_id(table_name TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  max_id INTEGER;
  sql_text TEXT;
BEGIN
  sql_text := 'SELECT MAX(id) FROM ' || quote_ident(table_name);
  EXECUTE sql_text INTO max_id;
  
  RETURN max_id;
END;
$$;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">EXECUTE with Dynamic Table/Column Names</h2>

          <CodeBlock
            title="SQL: Dynamic Table and Column Names"
            language="sql"
            code={`-- Dynamic table name (use quote_ident for safety)
CREATE OR REPLACE FUNCTION count_table_rows(table_name TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  count INTEGER;
  sql_text TEXT;
BEGIN
  sql_text := 'SELECT COUNT(*) FROM ' || quote_ident(table_name);
  EXECUTE sql_text INTO count;
  
  RETURN count;
END;
$$;

-- Dynamic column name
CREATE OR REPLACE FUNCTION get_column_value(
  table_name TEXT, 
  column_name TEXT, 
  id_value INTEGER
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  result TEXT;
  sql_text TEXT;
BEGIN
  sql_text := 'SELECT ' || quote_ident(column_name) || 
              ' FROM ' || quote_ident(table_name) || 
              ' WHERE id = $1';
  
  EXECUTE sql_text INTO result USING id_value;
  
  RETURN result;
END;
$$;

-- Multiple dynamic identifiers
CREATE OR REPLACE FUNCTION update_dynamic_column(
  table_name TEXT,
  column_name TEXT,
  new_value TEXT,
  id_value INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  sql_text TEXT;
BEGIN
  sql_text := 'UPDATE ' || quote_ident(table_name) ||
              ' SET ' || quote_ident(column_name) || ' = $1' ||
              ' WHERE id = $2';
  
  EXECUTE sql_text USING new_value, id_value;
  
  RETURN FOUND;
END;
$$;

-- Dynamic WHERE clause
CREATE OR REPLACE FUNCTION delete_by_condition(
  table_name TEXT,
  condition TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  sql_text TEXT;
  deleted_count INTEGER;
BEGIN
  sql_text := 'DELETE FROM ' || quote_ident(table_name) || 
              ' WHERE ' || condition;
  
  EXECUTE sql_text;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">format Function</h2>

          <CodeBlock
            title="SQL: Using format Function"
            language="sql"
            code={`-- format with %I (identifier) and %L (literal)
CREATE OR REPLACE FUNCTION safe_dynamic_query(table_name TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  count INTEGER;
BEGIN
  EXECUTE format('SELECT COUNT(*) FROM %I', table_name) INTO count;
  
  RETURN count;
END;
$$;

-- format with parameters
CREATE OR REPLACE FUNCTION find_by_column(
  table_name TEXT,
  column_name TEXT,
  search_value TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  count INTEGER;
BEGIN
  EXECUTE format(
    'SELECT COUNT(*) FROM %I WHERE %I = %L',
    table_name,
    column_name,
    search_value
  ) INTO count;
  
  RETURN count;
END;
$$;

-- format with %s (simple string, less safe)
CREATE OR REPLACE FUNCTION simple_format_example()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  result TEXT;
  table_name TEXT := 'users';
BEGIN
  EXECUTE format('SELECT name FROM %s LIMIT 1', table_name) INTO result;
  
  RETURN result;
END;
$$;

-- format with multiple placeholders
CREATE OR REPLACE FUNCTION complex_dynamic_query(
  schema_name TEXT,
  table_name TEXT,
  column_name TEXT,
  operator TEXT,
  value TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  count INTEGER;
  sql_text TEXT;
BEGIN
  sql_text := format(
    'SELECT COUNT(*) FROM %I.%I WHERE %I %s %L',
    schema_name,
    table_name,
    column_name,
    operator,
    value
  );
  
  EXECUTE sql_text INTO count;
  
  RETURN count;
END;
$$;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Security Considerations</h2>

          <CodeBlock
            title="SQL: Safe Dynamic SQL"
            language="sql"
            code={`-- UNSAFE: String concatenation (SQL injection risk)
CREATE OR REPLACE FUNCTION unsafe_query(user_input TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  count INTEGER;
BEGIN
  -- DANGEROUS: Direct string interpolation
  EXECUTE 'SELECT COUNT(*) FROM users WHERE name = ''' || user_input || '''' INTO count;
  RETURN count;
END;
$$;

-- SAFE: Using parameters
CREATE OR REPLACE FUNCTION safe_query(user_input TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  count INTEGER;
BEGIN
  -- SAFE: Using parameterized query
  EXECUTE 'SELECT COUNT(*) FROM users WHERE name = $1' INTO count USING user_input;
  RETURN count;
END;
$$;

-- SAFE: Using format with %L for literals
CREATE OR REPLACE FUNCTION safe_format_query(user_input TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  count INTEGER;
BEGIN
  -- SAFE: format escapes literals properly
  EXECUTE format('SELECT COUNT(*) FROM users WHERE name = %L', user_input) INTO count;
  RETURN count;
END;
$$;

-- SAFE: Using quote_ident for identifiers
CREATE OR REPLACE FUNCTION safe_identifier(table_name TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  count INTEGER;
BEGIN
  -- SAFE: quote_ident properly escapes identifiers
  EXECUTE 'SELECT COUNT(*) FROM ' || quote_ident(table_name) INTO count;
  RETURN count;
END;
$$;

-- Best practice: Combine format with USING for values
CREATE OR REPLACE FUNCTION best_practice_query(
  table_name TEXT,
  column_name TEXT,
  search_value TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  count INTEGER;
BEGIN
  EXECUTE format('SELECT COUNT(*) FROM %I WHERE %I = $1', table_name, column_name)
    INTO count
    USING search_value;
  
  RETURN count;
END;
$$;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Dynamic SQL with RETURNING</h2>

          <CodeBlock
            title="SQL: Dynamic SQL with RETURNING"
            language="sql"
            code={`-- Dynamic INSERT with RETURNING
CREATE OR REPLACE FUNCTION insert_dynamic(
  table_name TEXT,
  column_name TEXT,
  value TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  new_id INTEGER;
BEGIN
  EXECUTE format(
    'INSERT INTO %I (%I) VALUES ($1) RETURNING id',
    table_name,
    column_name
  ) INTO new_id USING value;
  
  RETURN new_id;
END;
$$;

-- Dynamic UPDATE with RETURNING
CREATE OR REPLACE FUNCTION update_dynamic(
  table_name TEXT,
  set_column TEXT,
  set_value TEXT,
  where_column TEXT,
  where_value TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  updated_id INTEGER;
BEGIN
  EXECUTE format(
    'UPDATE %I SET %I = $1 WHERE %I = $2 RETURNING id',
    table_name,
    set_column,
    where_column
  ) INTO updated_id USING set_value, where_value;
  
  RETURN updated_id IS NOT NULL;
END;
$$;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Prisma: Dynamic SQL</h2>

          <CodeBlock
            title="Prisma: Dynamic SQL in Functions"
            language="prisma"
            code={`// Prisma doesn't support dynamic SQL directly
// Create functions with dynamic SQL using raw SQL

// Function with dynamic SQL
await prisma.$executeRaw\`
  CREATE OR REPLACE FUNCTION count_dynamic_table(table_name TEXT)
  RETURNS INTEGER
  LANGUAGE plpgsql
  AS $$
  DECLARE
    count INTEGER;
  BEGIN
    EXECUTE format('SELECT COUNT(*) FROM %I', table_name) INTO count;
    RETURN count;
  END;
  $$;
\`;

// Call dynamic SQL function
const userCount = await prisma.$queryRaw\`
  SELECT count_dynamic_table('users') AS count
\`;

// Function with dynamic query building
await prisma.$executeRaw\`
  CREATE OR REPLACE FUNCTION search_dynamic(
    table_name TEXT,
    column_name TEXT,
    search_value TEXT
  )
  RETURNS INTEGER
  LANGUAGE plpgsql
  AS $$
  DECLARE
    count INTEGER;
  BEGIN
    EXECUTE format(
      'SELECT COUNT(*) FROM %I WHERE %I = $1',
      table_name,
      column_name
    ) INTO count USING search_value;
    
    RETURN count;
  END;
  $$;
\`;

// Use in Prisma
const result = await prisma.$queryRaw\`
  SELECT search_dynamic('users', 'email', 'john@example.com') AS count
\`;

// For complex dynamic queries, use raw SQL directly
const dynamicResult = await prisma.$queryRawUnsafe(
  \`SELECT * FROM \${tableName} WHERE \${columnName} = $1\`,
  searchValue
);`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Always use quote_ident</strong> for table/column names</li>
              <li><strong>Use format with %I</strong> for identifiers</li>
              <li><strong>Use format with %L</strong> for string literals</li>
              <li><strong>Prefer USING clause</strong> for parameter values</li>
              <li><strong>Never concatenate user input</strong> directly into SQL</li>
              <li><strong>Validate input</strong> before using in dynamic SQL</li>
              <li><strong>Use EXECUTE ... INTO</strong> for single-row results</li>
              <li><strong>Handle exceptions</strong> when using dynamic SQL</li>
              <li><strong>Test thoroughly</strong> - dynamic SQL is harder to debug</li>
            </ul>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}


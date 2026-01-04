import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Creating Extensions - PostgreSQL Learning',
  description: 'Learn about creating PostgreSQL extensions including extension structure and development',
};

export default function CreatingExtensions() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Creating Extensions</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Extension Structure</h2>

          <CodeBlock
            title="SQL: Extension Components"
            language="sql"
            code={`-- Extensions consist of:
-- 1. Control file (.control)
-- 2. SQL script files (.sql)
-- 3. Shared library files (.so on Linux, .dylib on macOS, .dll on Windows)
-- 4. Documentation files

-- View extension files location
SHOW sharedir;
-- Extensions are typically in: $sharedir/extension/

-- View extension control file
-- cat $sharedir/extension/extension_name.control

-- Control file format:
-- # comment
-- default_version = '1.0'
-- comment = 'Extension description'
-- requires = 'other_extension'

-- View extension SQL files
-- ls $sharedir/extension/extension_name--*.sql

-- SQL files are versioned:
-- extension_name--1.0.sql
-- extension_name--1.0--1.1.sql  (upgrade script)
-- extension_name--1.1.sql

-- View extension information
SELECT 
  extname,
  extversion,
  nspname AS schema
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
WHERE extname = 'postgis';

-- View extension objects
SELECT 
  n.nspname AS schema,
  c.relname AS object_name,
  c.relkind AS object_type
FROM pg_depend d
JOIN pg_extension e ON d.refobjid = e.oid
JOIN pg_class c ON d.objid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE e.extname = 'postgis'
ORDER BY n.nspname, c.relname;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Simple Extension Example</h2>

          <CodeBlock
            title="SQL: Creating a Simple Extension"
            language="sql"
            code={`-- Example: Simple extension that adds a function

-- 1. Create control file: my_extension.control
-- default_version = '1.0'
-- comment = 'My custom extension'

-- 2. Create SQL file: my_extension--1.0.sql
-- CREATE FUNCTION add_numbers(a INTEGER, b INTEGER)
-- RETURNS INTEGER
-- LANGUAGE plpgsql
-- AS $$
-- BEGIN
--   RETURN a + b;
-- END;
-- $$;
-- 
-- COMMENT ON FUNCTION add_numbers(INTEGER, INTEGER) IS 'Adds two numbers';

-- 3. Install extension
-- Copy files to $sharedir/extension/
-- CREATE EXTENSION my_extension;

-- View extension
SELECT * FROM pg_extension WHERE extname = 'my_extension';

-- Use extension function
SELECT add_numbers(5, 3);  -- Returns 8

-- Drop extension
DROP EXTENSION my_extension;

-- Extension with schema
-- Control file:
-- default_version = '1.0'
-- schema = 'my_schema'
-- 
-- Creates objects in specified schema

-- Extension with dependencies
-- Control file:
-- default_version = '1.0'
-- requires = 'plpgsql'
-- 
-- Requires plpgsql extension

-- Extension with multiple versions
-- my_extension--1.0.sql (initial version)
-- my_extension--1.1.sql (upgrade from 1.0 to 1.1)
-- my_extension--1.2.sql (upgrade from 1.1 to 1.2)

-- Upgrade extension
-- ALTER EXTENSION my_extension UPDATE TO '1.2';`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Extension with Data Types</h2>

          <CodeBlock
            title="SQL: Extension with Custom Types"
            language="sql"
            code={`-- Example: Extension with custom data type

-- Control file: custom_types.control
-- default_version = '1.0'
-- comment = 'Custom data types extension'

-- SQL file: custom_types--1.0.sql
-- CREATE TYPE currency AS (
--   amount NUMERIC,
--   code TEXT
-- );
-- 
-- CREATE FUNCTION currency_add(c1 currency, c2 currency)
-- RETURNS currency
-- LANGUAGE plpgsql
-- AS $$
-- BEGIN
--   IF c1.code != c2.code THEN
--     RAISE EXCEPTION 'Cannot add different currencies';
--   END IF;
--   RETURN (c1.amount + c2.amount, c1.code);
-- END;
-- $$;
-- 
-- CREATE OPERATOR + (
--   LEFTARG = currency,
--   RIGHTARG = currency,
--   FUNCTION = currency_add
-- );

-- Install and use
-- CREATE EXTENSION custom_types;
-- 
-- CREATE TABLE transactions (
--   id SERIAL PRIMARY KEY,
--   amount currency
-- );
-- 
-- INSERT INTO transactions (amount)
-- VALUES ((100.50, 'USD')::currency);
-- 
-- SELECT amount + (50.25, 'USD')::currency FROM transactions;

-- Extension with operators
-- CREATE OPERATOR CLASS my_opclass
-- FOR TYPE my_type USING btree AS
--   OPERATOR 1 <,
--   OPERATOR 2 <=,
--   OPERATOR 3 =,
--   OPERATOR 4 >=,
--   OPERATOR 5 >,
--   FUNCTION 1 my_compare_function(my_type, my_type);`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Extension Management</h2>

          <CodeBlock
            title="SQL: Managing Extensions"
            language="sql"
            code={`-- Install extension
CREATE EXTENSION extension_name;

-- Install with IF NOT EXISTS
CREATE EXTENSION IF NOT EXISTS extension_name;

-- Install in specific schema
CREATE EXTENSION extension_name SCHEMA my_schema;

-- Install with version
CREATE EXTENSION extension_name VERSION '1.0';

-- View installed extensions
SELECT 
  extname,
  extversion,
  nspname AS schema
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
ORDER BY extname;

-- View extension version
SELECT extversion FROM pg_extension WHERE extname = 'postgis';

-- Update extension
ALTER EXTENSION extension_name UPDATE;

-- Update to specific version
ALTER EXTENSION extension_name UPDATE TO '1.2';

-- View available versions
SELECT * FROM pg_available_extension_versions
WHERE name = 'postgis'
ORDER BY version;

-- Drop extension
DROP EXTENSION extension_name;

-- Drop with CASCADE (drops dependent objects)
DROP EXTENSION extension_name CASCADE;

-- View extension dependencies
SELECT 
  e1.extname AS extension,
  e2.extname AS depends_on
FROM pg_depend d
JOIN pg_extension e1 ON d.refobjid = e1.oid
JOIN pg_extension e2 ON d.objid = e2.oid
WHERE e1.extname != e2.extname;

-- Reload extension (for some extensions)
-- ALTER EXTENSION extension_name RELOAD;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Extension Development</h2>

          <CodeBlock
            title="SQL: Extension Development Process"
            language="sql"
            code={`-- Development workflow:

-- 1. Create extension directory structure
-- my_extension/
--   my_extension.control
--   my_extension--1.0.sql
--   Makefile (optional)

-- 2. Control file example (my_extension.control):
-- # PostgreSQL extension
-- default_version = '1.0'
-- comment = 'My custom extension'
-- relocatable = false
-- schema = public

-- 3. SQL file example (my_extension--1.0.sql):
-- CREATE FUNCTION my_function()
-- RETURNS TEXT
-- LANGUAGE plpgsql
-- AS $$
-- BEGIN
--   RETURN 'Hello from extension';
-- END;
-- $$;

-- 4. Install extension (development)
-- Copy files to $sharedir/extension/
-- Or use: CREATE EXTENSION my_extension FROM 'unpackaged';

-- 5. Test extension
SELECT my_function();

-- 6. Create upgrade script (my_extension--1.0--1.1.sql)
-- ALTER FUNCTION my_function() RENAME TO my_new_function;
-- CREATE FUNCTION my_function()
-- RETURNS TEXT
-- LANGUAGE plpgsql
-- AS $$
-- BEGIN
--   RETURN 'Updated function';
-- END;
-- $$;

-- 7. Update extension
-- ALTER EXTENSION my_extension UPDATE TO '1.1';

-- View extension files
SELECT 
  name,
  setting
FROM pg_settings
WHERE name = 'sharedir';

-- Extension best practices:
-- 1. Version all changes
-- 2. Provide upgrade scripts
-- 3. Document functions and types
-- 4. Test thoroughly
-- 5. Handle dependencies
-- 6. Use proper schemas`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Prisma: Creating Extensions</h2>

          <CodeBlock
            title="Prisma: Extension Development"
            language="prisma"
            code={`// Prisma doesn't have direct extension creation support
// Extensions are created at database level using SQL files

// Install custom extension
await prisma.$executeRaw\`
  CREATE EXTENSION IF NOT EXISTS my_extension
\`;

// View installed extensions
const extensions = await prisma.$queryRaw\`
  SELECT 
    extname,
    extversion,
    nspname AS schema
  FROM pg_extension e
  JOIN pg_namespace n ON e.extnamespace = n.oid
  ORDER BY extname
\`;

// Update extension
await prisma.$executeRaw\`
  ALTER EXTENSION my_extension UPDATE
\`;

// Update to specific version
await prisma.$executeRaw\`
  ALTER EXTENSION my_extension UPDATE TO $1
\`, '1.2';

// View available versions
const versions = await prisma.$queryRaw\`
  SELECT 
    name,
    version,
    installed
  FROM pg_available_extension_versions
  WHERE name = $1
  ORDER BY version
\`, 'my_extension';

// Drop extension
await prisma.$executeRaw\`
  DROP EXTENSION IF EXISTS my_extension
\`;

// Check extension dependencies
const dependencies = await prisma.$queryRaw\`
  SELECT 
    e1.extname AS extension,
    e2.extname AS depends_on
  FROM pg_depend d
  JOIN pg_extension e1 ON d.refobjid = e1.oid
  JOIN pg_extension e2 ON d.objid = e2.oid
  WHERE e1.extname = $1
\`, 'my_extension';

// View extension objects
const objects = await prisma.$queryRaw\`
  SELECT 
    n.nspname AS schema,
    c.relname AS object_name,
    CASE c.relkind
      WHEN 'r' THEN 'table'
      WHEN 'v' THEN 'view'
      WHEN 'f' THEN 'function'
      WHEN 't' THEN 'type'
      ELSE 'other'
    END AS object_type
  FROM pg_depend d
  JOIN pg_extension e ON d.refobjid = e.oid
  JOIN pg_class c ON d.objid = c.oid
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE e.extname = $1
  ORDER BY n.nspname, c.relname
\`, 'my_extension';

// Note: Extension files must be created manually
// and placed in PostgreSQL's extension directory
// Prisma can only install and manage existing extensions`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Version your extensions</strong> - use semantic versioning</li>
              <li><strong>Provide upgrade scripts</strong> - for each version change</li>
              <li><strong>Document thoroughly</strong> - functions, types, and usage</li>
              <li><strong>Test extensively</strong> - before distributing</li>
              <li><strong>Handle dependencies</strong> - declare required extensions</li>
              <li><strong>Use appropriate schemas</strong> - organize extension objects</li>
              <li><strong>Follow naming conventions</strong> - consistent with PostgreSQL style</li>
              <li><strong>Make extensions relocatable</strong> - when possible</li>
              <li><strong>Provide uninstall scripts</strong> - clean removal</li>
            </ul>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}


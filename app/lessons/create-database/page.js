import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'CREATE DATABASE - PostgreSQL Learning',
  description: 'Learn about creating databases in PostgreSQL with syntax, options, templates, encoding, locale, and collation',
};

export default function CreateDatabase() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">CREATE DATABASE</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Basic Syntax</h2>
          <p className="mb-4">
            The CREATE DATABASE statement creates a new PostgreSQL database.
          </p>

          <CodeBlock
            title="SQL: Basic CREATE DATABASE"
            language="sql"
            code={`-- Basic database creation
CREATE DATABASE mydatabase;

-- Create database with owner
CREATE DATABASE mydatabase
  WITH OWNER = myuser;

-- Create database with multiple options
CREATE DATABASE mydatabase
  WITH 
  OWNER = myuser
  ENCODING = 'UTF8'
  LC_COLLATE = 'en_US.utf8'
  LC_CTYPE = 'en_US.utf8'
  TEMPLATE = template0;

-- List all databases
\\l

-- Or using SQL
SELECT datname FROM pg_database
WHERE datistemplate = false
ORDER BY datname;

-- Connect to a database
\\c mydatabase

-- Drop a database
DROP DATABASE mydatabase;`}
          />
          <CodeBlock
            title="Prisma: Database Creation"
            language="prisma"
            code={`// Prisma automatically creates the database when you run migrations
// schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// .env
DATABASE_URL="postgresql://username:password@localhost:5432/mydatabase?schema=public"

// When you run migrations, Prisma will:
// 1. Create the database if it doesn't exist
// 2. Create all tables based on your schema
npx prisma migrate dev --name init

// Or create database manually first, then run migrations
// Using raw SQL:
await prisma.$executeRaw\`CREATE DATABASE IF NOT EXISTS mydatabase\`;

// Note: PostgreSQL doesn't support IF NOT EXISTS for CREATE DATABASE
// You need to check first or handle errors`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Database Options</h2>

          <CodeBlock
            title="SQL: Database Options"
            language="sql"
            code={`-- Complete CREATE DATABASE syntax
CREATE DATABASE database_name
  [ WITH ]
  [ OWNER = role_name ]
  [ TEMPLATE = template_name ]
  [ ENCODING = encoding ]
  [ LC_COLLATE = collate_name ]
  [ LC_CTYPE = ctype_name ]
  [ TABLESPACE = tablespace_name ]
  [ ALLOW_CONNECTIONS = true | false ]
  [ CONNECTION LIMIT = max_connections ]
  [ IS_TEMPLATE = true | false ];

-- Example with all options
CREATE DATABASE production_db
  WITH 
  OWNER = admin_user
  TEMPLATE = template0
  ENCODING = 'UTF8'
  LC_COLLATE = 'en_US.UTF-8'
  LC_CTYPE = 'en_US.UTF-8'
  TABLESPACE = fast_ssd
  ALLOW_CONNECTIONS = true
  CONNECTION LIMIT = 100
  IS_TEMPLATE = false;

-- Check database settings
SELECT 
  datname,
  pg_encoding_to_char(encoding) AS encoding,
  datcollate AS collate,
  datctype AS ctype,
  datconnlimit AS connection_limit
FROM pg_database
WHERE datname = 'production_db';`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Template Databases</h2>
          <p className="mb-4">
            PostgreSQL uses template databases when creating new databases. The default template is <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">template1</code>.
          </p>

          <CodeBlock
            title="SQL: Template Databases"
            language="sql"
            code={`-- List template databases
SELECT datname, datistemplate 
FROM pg_database
WHERE datistemplate = true;

-- Default templates:
-- template0: Minimal template (recommended for custom encoding)
-- template1: Default template (includes standard objects)

-- Create database from template0 (recommended for custom settings)
CREATE DATABASE mydb
  WITH TEMPLATE = template0
  ENCODING = 'UTF8'
  LC_COLLATE = 'en_US.utf8'
  LC_CTYPE = 'en_US.utf8';

-- Create database from template1 (includes extensions from template1)
CREATE DATABASE mydb
  WITH TEMPLATE = template1;

-- Create database from custom template
-- First, mark a database as template
UPDATE pg_database SET datistemplate = true WHERE datname = 'mytemplate';

-- Then use it
CREATE DATABASE newdb WITH TEMPLATE = mytemplate;

-- Remove template flag
UPDATE pg_database SET datistemplate = false WHERE datname = 'mytemplate';`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Encoding, Locale, and Collation</h2>

          <CodeBlock
            title="SQL: Encoding and Locale"
            language="sql"
            code={`-- Check available encodings
SELECT * FROM pg_encoding_to_char;

-- Check available locales
SELECT * FROM pg_collation
WHERE collname LIKE '%en_US%'
ORDER BY collname;

-- Create database with specific encoding
CREATE DATABASE utf8_db
  WITH ENCODING = 'UTF8';

-- Create database with locale settings
CREATE DATABASE localized_db
  WITH 
  ENCODING = 'UTF8'
  LC_COLLATE = 'en_US.UTF-8'    -- Collation (sorting rules)
  LC_CTYPE = 'en_US.UTF-8';     -- Character classification

-- Different locale examples
CREATE DATABASE german_db
  WITH 
  ENCODING = 'UTF8'
  LC_COLLATE = 'de_DE.UTF-8'
  LC_CTYPE = 'de_DE.UTF-8';

CREATE DATABASE french_db
  WITH 
  ENCODING = 'UTF8'
  LC_COLLATE = 'fr_FR.UTF-8'
  LC_CTYPE = 'fr_FR.UTF-8';

-- View database encoding and locale
SELECT 
  datname,
  pg_encoding_to_char(encoding) AS encoding,
  datcollate AS collation,
  datctype AS ctype
FROM pg_database
WHERE datname = 'localized_db';

-- Note: Encoding, locale, and collation cannot be changed after database creation
-- You must create a new database with desired settings`}
          />
          <CodeBlock
            title="Prisma: Encoding and Locale"
            language="prisma"
            code={`// Prisma doesn't directly control database encoding/locale
// These are set when the database is created

// If you need specific encoding/locale:
// 1. Create database manually with desired settings
// 2. Then point Prisma to that database

// Manual database creation (run before Prisma migrations)
// CREATE DATABASE myapp_db
//   WITH 
//   ENCODING = 'UTF8'
//   LC_COLLATE = 'en_US.UTF-8'
//   LC_CTYPE = 'en_US.UTF-8'
//   TEMPLATE = template0;

// Then use in Prisma
// DATABASE_URL="postgresql://user:pass@localhost:5432/myapp_db"

// Prisma will use whatever encoding/locale the database has
// schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Check database encoding using raw SQL
const encoding = await prisma.$queryRaw\`
  SELECT pg_encoding_to_char(encoding) AS encoding
  FROM pg_database
  WHERE datname = current_database()
\`;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Connection Limits</h2>

          <CodeBlock
            title="SQL: Connection Limits"
            language="sql"
            code={`-- Create database with connection limit
CREATE DATABASE limited_db
  WITH 
  CONNECTION LIMIT = 10;

-- Unlimited connections (default)
CREATE DATABASE unlimited_db
  WITH 
  CONNECTION LIMIT = -1;

-- Check connection limit
SELECT 
  datname,
  datconnlimit AS connection_limit
FROM pg_database
WHERE datname = 'limited_db';

-- Modify connection limit (requires ALTER DATABASE)
ALTER DATABASE limited_db
  CONNECTION LIMIT = 20;

-- Disable new connections
ALTER DATABASE limited_db
  ALLOW_CONNECTIONS = false;

-- Re-enable connections
ALTER DATABASE limited_db
  ALLOW_CONNECTIONS = true;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">ALTER DATABASE</h2>

          <CodeBlock
            title="SQL: ALTER DATABASE"
            language="sql"
            code={`-- Change database owner
ALTER DATABASE mydatabase OWNER TO new_owner;

-- Rename database
ALTER DATABASE old_name RENAME TO new_name;

-- Change connection limit
ALTER DATABASE mydatabase CONNECTION LIMIT 50;

-- Set default tablespace
ALTER DATABASE mydatabase SET TABLESPACE new_tablespace;

-- Set configuration parameters
ALTER DATABASE mydatabase SET work_mem = '16MB';
ALTER DATABASE mydatabase SET timezone = 'UTC';

-- Reset configuration parameter
ALTER DATABASE mydatabase RESET work_mem;

-- View database settings
SELECT 
  datname,
  pg_catalog.pg_get_userbyid(datdba) AS owner,
  datconnlimit AS connection_limit
FROM pg_database
WHERE datname = 'mydatabase';`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Use UTF8 encoding</strong> for international support</li>
              <li><strong>Use template0</strong> when specifying custom encoding/locale</li>
              <li><strong>Set appropriate locale</strong> based on your application's needs</li>
              <li><strong>Set connection limits</strong> to prevent resource exhaustion</li>
              <li><strong>Choose meaningful names</strong> that reflect the database purpose</li>
              <li><strong>Document database settings</strong> for team reference</li>
            </ul>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}


import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Foreign Data Wrappers (FDW) - PostgreSQL Learning',
  description: 'Learn about PostgreSQL Foreign Data Wrappers including postgres_fdw and file_fdw',
};

export default function ForeignDataWrappers() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Foreign Data Wrappers (FDW)</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">What are Foreign Data Wrappers?</h2>
          <p className="mb-4">
            Foreign Data Wrappers (FDW) allow PostgreSQL to access data stored in external data sources 
            as if they were regular tables. PostgreSQL includes several FDWs, and you can install 
            additional ones for various data sources like other databases, files, APIs, etc.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">postgres_fdw</h2>

          <CodeBlock
            title="SQL: postgres_fdw Setup"
            language="sql"
            code={`-- Install postgres_fdw extension
CREATE EXTENSION IF NOT EXISTS postgres_fdw;

-- Create foreign server
CREATE SERVER foreign_server
FOREIGN DATA WRAPPER postgres_fdw
OPTIONS (
  host 'remote_host',
  port '5432',
  dbname 'remote_database'
);

-- Create user mapping
CREATE USER MAPPING FOR current_user
SERVER foreign_server
OPTIONS (
  user 'remote_user',
  password 'remote_password'
);

-- Create foreign table
CREATE FOREIGN TABLE remote_users (
  id INTEGER,
  name TEXT,
  email TEXT
)
SERVER foreign_server
OPTIONS (
  schema_name 'public',
  table_name 'users'
);

-- Query foreign table
SELECT * FROM remote_users WHERE id = 1;

-- Join local and foreign tables
SELECT 
  l.id AS local_id,
  r.name AS remote_name
FROM local_table l
JOIN remote_users r ON l.id = r.id;

-- View foreign servers
SELECT 
  srvname AS server_name,
  srvtype AS server_type,
  srvversion AS server_version,
  srvoptions AS options
FROM pg_foreign_server;

-- View user mappings
SELECT 
  umuser::regrole AS local_user,
  srvname AS server_name,
  umoptions AS options
FROM pg_user_mappings um
JOIN pg_foreign_server s ON um.umserver = s.oid;

-- View foreign tables
SELECT 
  ft.ftrelid::regclass AS foreign_table,
  s.srvname AS server_name,
  ft.ftoptions AS options
FROM pg_foreign_table ft
JOIN pg_foreign_server s ON ft.ftserver = s.oid;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">postgres_fdw Advanced</h2>

          <CodeBlock
            title="SQL: Advanced postgres_fdw Features"
            language="sql"
            code={`-- Import foreign schema
IMPORT FOREIGN SCHEMA public
FROM SERVER foreign_server
INTO public;

-- Import specific tables
IMPORT FOREIGN SCHEMA public
LIMIT TO (users, orders)
FROM SERVER foreign_server
INTO public;

-- Import excluding specific tables
IMPORT FOREIGN SCHEMA public
EXCEPT (logs, temp_table)
FROM SERVER foreign_server
INTO public;

-- Alter foreign table options
ALTER FOREIGN TABLE remote_users
OPTIONS (
  ADD column_name 'id',
  SET schema_name 'public'
);

-- Pushdown operations (executed on remote server)
-- WHERE clauses, JOINs, and aggregations can be pushed down
SELECT COUNT(*) FROM remote_users WHERE status = 'active';
-- Executed on remote server if possible

-- View foreign table statistics
ANALYZE remote_users;

-- Create index on foreign table (local index)
CREATE INDEX idx_remote_users_email ON remote_users(email);
-- Indexes on foreign tables are local, not on remote server

-- Update foreign server options
ALTER SERVER foreign_server
OPTIONS (
  SET host 'new_host',
  SET port '5433'
);

-- Update user mapping
ALTER USER MAPPING FOR current_user
SERVER foreign_server
OPTIONS (
  SET user 'new_user',
  SET password 'new_password'
);

-- Drop foreign table
DROP FOREIGN TABLE remote_users;

-- Drop user mapping
DROP USER MAPPING FOR current_user SERVER foreign_server;

-- Drop foreign server
DROP SERVER foreign_server CASCADE;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">file_fdw</h2>

          <CodeBlock
            title="SQL: file_fdw Setup"
            language="sql"
            code={`-- Install file_fdw extension
CREATE EXTENSION IF NOT EXISTS file_fdw;

-- Create foreign server
CREATE SERVER file_server
FOREIGN DATA WRAPPER file_fdw;

-- Create foreign table for CSV file
CREATE FOREIGN TABLE csv_data (
  id INTEGER,
  name TEXT,
  email TEXT,
  created_at DATE
)
SERVER file_server
OPTIONS (
  filename '/path/to/data.csv',
  format 'csv',
  header 'true',
  delimiter ','
);

-- Query CSV file
SELECT * FROM csv_data WHERE id > 100;

-- Create foreign table for text file
CREATE FOREIGN TABLE text_data (
  line_number INTEGER,
  content TEXT
)
SERVER file_server
OPTIONS (
  filename '/path/to/data.txt',
  format 'text'
);

-- Create foreign table with custom options
CREATE FOREIGN TABLE custom_csv (
  id INTEGER,
  name TEXT,
  value NUMERIC
)
SERVER file_server
OPTIONS (
  filename '/path/to/data.csv',
  format 'csv',
  header 'true',
  delimiter ';',
  quote '"',
  escape '"',
  null ''
);

-- File formats supported:
-- csv: Comma-separated values
-- text: Text file (one column per line)
-- fixed: Fixed-width format

-- Note: File must be readable by PostgreSQL server process
-- File path is relative to PostgreSQL data directory or absolute

-- Drop foreign table
DROP FOREIGN TABLE csv_data;

-- Drop foreign server
DROP SERVER file_server;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Other FDWs</h2>

          <CodeBlock
            title="SQL: Additional FDWs"
            language="sql"
            code={`-- Other available FDWs (require installation):

-- mysql_fdw (for MySQL databases)
-- CREATE EXTENSION mysql_fdw;
-- CREATE SERVER mysql_server FOREIGN DATA WRAPPER mysql_fdw OPTIONS (host 'mysql_host', port '3306');

-- oracle_fdw (for Oracle databases)
-- CREATE EXTENSION oracle_fdw;
-- CREATE SERVER oracle_server FOREIGN DATA WRAPPER oracle_fdw OPTIONS (dbserver 'oracle_host:1521/orcl');

-- mongo_fdw (for MongoDB)
-- CREATE EXTENSION mongo_fdw;
-- CREATE SERVER mongo_server FOREIGN DATA WRAPPER mongo_fdw OPTIONS (address 'mongo_host', port '27017');

-- redis_fdw (for Redis)
-- CREATE EXTENSION redis_fdw;
-- CREATE SERVER redis_server FOREIGN DATA WRAPPER redis_fdw OPTIONS (address 'redis_host', port '6379');

-- http_fdw (for HTTP APIs)
-- CREATE EXTENSION http_fdw;
-- CREATE SERVER http_server FOREIGN DATA WRAPPER http_fdw OPTIONS (base_url 'https://api.example.com');

-- View available FDWs
SELECT 
  fdwname AS wrapper_name,
  fdwowner::regrole AS owner,
  fdwhandler::regproc AS handler,
  fdwvalidator::regproc AS validator
FROM pg_foreign_data_wrapper;

-- View FDW options
SELECT 
  fdwname,
  fdwoptions
FROM pg_foreign_data_wrapper;

-- Create custom FDW (advanced, requires C programming)
-- See PostgreSQL documentation for FDW development`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Prisma: Foreign Data Wrappers</h2>

          <CodeBlock
            title="Prisma: Using FDWs"
            language="prisma"
            code={`// Prisma doesn't have direct FDW support
// Use raw SQL for FDW operations

// Install postgres_fdw
await prisma.$executeRaw\`
  CREATE EXTENSION IF NOT EXISTS postgres_fdw
\`;

// Create foreign server
await prisma.$executeRaw\`
  CREATE SERVER foreign_server
  FOREIGN DATA WRAPPER postgres_fdw
  OPTIONS (
    host $1,
    port $2,
    dbname $3
  )
\`, 'remote_host', '5432', 'remote_db';

// Create user mapping
await prisma.$executeRaw\`
  CREATE USER MAPPING FOR current_user
  SERVER foreign_server
  OPTIONS (
    user $1,
    password $2
  )
\`, 'remote_user', 'remote_password';

// Create foreign table
await prisma.$executeRaw\`
  CREATE FOREIGN TABLE remote_users (
    id INTEGER,
    name TEXT,
    email TEXT
  )
  SERVER foreign_server
  OPTIONS (
    schema_name 'public',
    table_name 'users'
  )
\`;

// Query foreign table
const users = await prisma.$queryRaw\`
  SELECT * FROM remote_users WHERE id = $1
\`, 1;

// Import foreign schema
await prisma.$executeRaw\`
  IMPORT FOREIGN SCHEMA public
  FROM SERVER foreign_server
  INTO public
\`;

// View foreign servers
const servers = await prisma.$queryRaw\`
  SELECT 
    srvname AS server_name,
    srvoptions AS options
  FROM pg_foreign_server
\`;

// View foreign tables
const tables = await prisma.$queryRaw\`
  SELECT 
    ft.ftrelid::regclass AS foreign_table,
    s.srvname AS server_name
  FROM pg_foreign_table ft
  JOIN pg_foreign_server s ON ft.ftserver = s.oid
\`;

// file_fdw example
await prisma.$executeRaw\`
  CREATE EXTENSION IF NOT EXISTS file_fdw
\`;

await prisma.$executeRaw\`
  CREATE SERVER file_server
  FOREIGN DATA WRAPPER file_fdw
\`;

await prisma.$executeRaw\`
  CREATE FOREIGN TABLE csv_data (
    id INTEGER,
    name TEXT,
    email TEXT
  )
  SERVER file_server
  OPTIONS (
    filename $1,
    format 'csv',
    header 'true'
  )
\`, '/path/to/data.csv';

// Query CSV file
const data = await prisma.$queryRaw\`
  SELECT * FROM csv_data WHERE id > $1
\`, 100;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Use FDWs for data integration</strong> - access external data sources</li>
              <li><strong>Consider performance</strong> - queries may be slower than local tables</li>
              <li><strong>Use pushdown operations</strong> - filter on remote server when possible</li>
              <li><strong>Secure credentials</strong> - use user mappings for authentication</li>
              <li><strong>Monitor network latency</strong> - FDW queries depend on network</li>
              <li><strong>Use appropriate indexes</strong> - local indexes on foreign tables</li>
              <li><strong>Test query performance</strong> - FDW queries can be slow</li>
              <li><strong>Handle connection errors</strong> - external sources may be unavailable</li>
            </ul>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}


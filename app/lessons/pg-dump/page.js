import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'pg_dump - PostgreSQL Learning',
  description: 'Learn about PostgreSQL pg_dump including full database dump, schema-only dump, data-only dump, and custom format',
};

export default function PgDump() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">pg_dump</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">What is pg_dump?</h2>
          <p className="mb-4">
            pg_dump is a utility for backing up PostgreSQL databases. It creates a logical backup 
            of a database in a SQL script or custom format. pg_dump can backup entire databases, 
            specific schemas, or individual tables, and can include or exclude data.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Full Database Dump</h2>

          <CodeBlock
            title="SQL: Full Database Backup"
            language="sql"
            code={`-- Full database dump (SQL format)
-- Command line:
-- pg_dump -U username -d database_name > backup.sql

-- Full database dump with custom format
-- pg_dump -U username -d database_name -Fc -f backup.dump

-- Full database dump with compression
-- pg_dump -U username -d database_name -Fc -Z 9 -f backup.dump

-- Full database dump with verbose output
-- pg_dump -U username -d database_name -v -f backup.sql

-- Full database dump with connection options
-- pg_dump -h localhost -p 5432 -U username -d database_name -f backup.sql

-- Full database dump with password prompt
-- pg_dump -U username -d database_name -W -f backup.sql

-- Full database dump excluding specific tables
-- pg_dump -U username -d database_name -T table1 -T table2 -f backup.sql

-- Full database dump including only specific schemas
-- pg_dump -U username -d database_name -n schema1 -n schema2 -f backup.sql

-- Full database dump with no owner information
-- pg_dump -U username -d database_name --no-owner -f backup.sql

-- Full database dump with no privileges
-- pg_dump -U username -d database_name --no-privileges -f backup.sql`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Schema-Only Dump</h2>

          <CodeBlock
            title="SQL: Schema-Only Backup"
            language="sql"
            code={`-- Schema-only dump (no data)
-- pg_dump -U username -d database_name --schema-only -f schema.sql

-- Schema-only dump for specific schema
-- pg_dump -U username -d database_name -n public --schema-only -f public_schema.sql

-- Schema-only dump with CREATE DATABASE
-- pg_dump -U username -d database_name --schema-only --create -f schema.sql

-- Schema-only dump excluding tables
-- pg_dump -U username -d database_name --schema-only -T table1 -f schema.sql

-- Schema-only dump with no owner
-- pg_dump -U username -d database_name --schema-only --no-owner -f schema.sql

-- Schema-only dump with no privileges
-- pg_dump -U username -d database_name --schema-only --no-privileges -f schema.sql

-- Schema-only dump with clean (DROP statements)
-- pg_dump -U username -d database_name --schema-only --clean -f schema.sql

-- Schema-only dump for specific object types
-- pg_dump -U username -d database_name --schema-only --table=users -f users_schema.sql`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Data-Only Dump</h2>

          <CodeBlock
            title="SQL: Data-Only Backup"
            language="sql"
            code={`-- Data-only dump (no schema)
-- pg_dump -U username -d database_name --data-only -f data.sql

-- Data-only dump for specific table
-- pg_dump -U username -d database_name --data-only --table=users -f users_data.sql

-- Data-only dump with INSERT statements
-- pg_dump -U username -d database_name --data-only --inserts -f data.sql

-- Data-only dump with column names in INSERT
-- pg_dump -U username -d database_name --data-only --column-inserts -f data.sql

-- Data-only dump with COPY statements (default, faster)
-- pg_dump -U username -d database_name --data-only --format=plain -f data.sql

-- Data-only dump excluding specific tables
-- pg_dump -U username -d database_name --data-only -T table1 -T table2 -f data.sql

-- Data-only dump with WHERE clause (for specific rows)
-- pg_dump -U username -d database_name --data-only --table=users --where="id > 1000" -f data.sql

-- Data-only dump with no blobs
-- pg_dump -U username -d database_name --data-only --no-blobs -f data.sql`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Custom Format</h2>

          <CodeBlock
            title="SQL: Custom Format Dumps"
            language="sql"
            code={`-- Custom format dump (compressed, can be restored selectively)
-- pg_dump -U username -d database_name -Fc -f backup.dump

-- Custom format with compression level
-- pg_dump -U username -d database_name -Fc -Z 0 -f backup.dump  (no compression)
-- pg_dump -U username -d database_name -Fc -Z 9 -f backup.dump  (max compression)

-- Custom format with parallel jobs
-- pg_dump -U username -d database_name -Fd -j 4 -f backup_dir/
-- -Fd creates directory format, -j specifies parallel jobs

-- Custom format advantages:
-- 1. Compressed (smaller file size)
-- 2. Can restore selectively (specific tables)
-- 3. Can restore in parallel
-- 4. Faster than plain SQL format

-- List contents of custom format dump
-- pg_restore -l backup.dump

-- Extract SQL from custom format
-- pg_restore backup.dump > backup.sql

-- Custom format with schema-only
-- pg_dump -U username -d database_name -Fc --schema-only -f schema.dump

-- Custom format with data-only
-- pg_dump -U username -d database_name -Fc --data-only -f data.dump`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Advanced pg_dump Options</h2>

          <CodeBlock
            title="SQL: Advanced pg_dump Features"
            language="sql"
            code={`-- Dump with locks (prevents concurrent operations)
-- pg_dump -U username -d database_name --lock-wait-timeout=10000 -f backup.sql

-- Dump with no synchronization (faster, but may have inconsistencies)
-- pg_dump -U username -d database_name --no-synchronized-snapshots -f backup.sql

-- Dump with file size limit
-- pg_dump -U username -d database_name --file-size=1GB -f backup.sql

-- Dump with encoding
-- pg_dump -U username -d database_name --encoding=UTF8 -f backup.sql

-- Dump with verbose progress
-- pg_dump -U username -d database_name -v --progress -f backup.sql

-- Dump with jobs (parallel, directory format only)
-- pg_dump -U username -d database_name -Fd -j 4 -f backup_dir/

-- Dump specific tables
-- pg_dump -U username -d database_name -t users -t orders -f tables.sql

-- Dump excluding specific tables
-- pg_dump -U username -d database_name -T users -T orders -f backup.sql

-- Dump with section control
-- pg_dump -U username -d database_name --section=pre-data -f pre_data.sql
-- pg_dump -U username -d database_name --section=data -f data.sql
-- pg_dump -U username -d database_name --section=post-data -f post_data.sql

-- Dump with role passwords
-- pg_dump -U username -d database_name --roles-only -f roles.sql`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Prisma: pg_dump</h2>

          <CodeBlock
            title="Prisma: Database Backup"
            language="prisma"
            code={`// Prisma doesn't have built-in backup functionality
// Use pg_dump via command line or child process

// Using Node.js child_process
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Full database backup
async function backupDatabase() {
  const { stdout, stderr } = await execAsync(
    'pg_dump -U username -d database_name -Fc -f backup.dump'
  );
  console.log('Backup completed');
}

// Schema-only backup
async function backupSchema() {
  await execAsync(
    'pg_dump -U username -d database_name --schema-only -f schema.sql'
  );
}

// Data-only backup
async function backupData() {
  await execAsync(
    'pg_dump -U username -d database_name --data-only -Fc -f data.dump'
  );
}

// Custom format backup
async function backupCustom() {
  await execAsync(
    'pg_dump -U username -d database_name -Fc -Z 9 -f backup.dump'
  );
}

// Backup with environment variables
async function backupWithEnv() {
  const dbUrl = process.env.DATABASE_URL;
  await execAsync(
    \`pg_dump "\${dbUrl}" -Fc -f backup.dump\`
  );
}

// Scheduled backup
async function scheduledBackup() {
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const filename = \`backup_\${timestamp}.dump\`;
  
  await execAsync(
    \`pg_dump -U username -d database_name -Fc -f \${filename}\`
  );
  
  return filename;
}

// Backup specific tables
async function backupTables() {
  await execAsync(
    'pg_dump -U username -d database_name -t users -t orders -Fc -f tables.dump'
  );
}

// Note: For production, use:
// - Proper error handling
// - Logging
// - Compression
// - Remote storage (S3, etc.)
// - Scheduled backups (cron, etc.)`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Use custom format</strong> for large databases (compressed, faster)</li>
              <li><strong>Schedule regular backups</strong> - automate with cron or scheduler</li>
              <li><strong>Test restores</strong> - regularly verify backups can be restored</li>
              <li><strong>Store backups off-site</strong> - use cloud storage or remote servers</li>
              <li><strong>Use compression</strong> - reduce storage requirements</li>
              <li><strong>Document backup procedures</strong> - maintain clear documentation</li>
              <li><strong>Monitor backup size</strong> - unexpected changes may indicate issues</li>
              <li><strong>Use parallel dumps</strong> - for large databases with directory format</li>
              <li><strong>Include metadata</strong> - owner, privileges, etc. unless specifically excluded</li>
            </ul>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}


import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'pg_restore - PostgreSQL Learning',
  description: 'Learn about PostgreSQL pg_restore including restoring dumps and selective restore',
};

export default function PgRestore() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">pg_restore</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">What is pg_restore?</h2>
          <p className="mb-4">
            pg_restore is a utility for restoring PostgreSQL databases from backups created by pg_dump 
            in custom format or directory format. It can restore entire databases or selectively restore 
            specific objects. For plain SQL dumps, use psql instead.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Restoring Dumps</h2>

          <CodeBlock
            title="SQL: Basic Restore"
            language="sql"
            code={`-- Restore custom format dump
-- pg_restore -U username -d database_name backup.dump

-- Restore directory format dump
-- pg_restore -U username -d database_name backup_dir/

-- Restore with verbose output
-- pg_restore -U username -d database_name -v backup.dump

-- Restore with connection options
-- pg_restore -h localhost -p 5432 -U username -d database_name backup.dump

-- Restore to new database
-- createdb new_database
-- pg_restore -U username -d new_database backup.dump

-- Restore with clean (drop objects first)
-- pg_restore -U username -d database_name --clean backup.dump

-- Restore with create (create database)
-- pg_restore -U username -d database_name --create backup.dump

-- Restore with if-exists (use IF EXISTS in DROP)
-- pg_restore -U username -d database_name --if-exists --clean backup.dump

-- Restore with no owner (ignore ownership)
-- pg_restore -U username -d database_name --no-owner backup.dump

-- Restore with no privileges (ignore privileges)
-- pg_restore -U username -d database_name --no-privileges backup.dump

-- Restore with single transaction (all or nothing)
-- pg_restore -U username -d database_name --single-transaction backup.dump

-- Restore with exit on error
-- pg_restore -U username -d database_name --exit-on-error backup.dump`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Selective Restore</h2>

          <CodeBlock
            title="SQL: Selective Restore Options"
            language="sql"
            code={`-- List contents of dump
-- pg_restore -l backup.dump

-- List contents to file
-- pg_restore -l backup.dump > restore_list.txt

-- Restore specific table
-- pg_restore -U username -d database_name -t users backup.dump

-- Restore multiple tables
-- pg_restore -U username -d database_name -t users -t orders backup.dump

-- Restore specific schema
-- pg_restore -U username -d database_name -n public backup.dump

-- Restore excluding specific table
-- pg_restore -U username -d database_name -T table1 backup.dump

-- Restore using list file (selective restore)
-- pg_restore -l backup.dump > list.txt
-- Edit list.txt to comment out unwanted items (use ;)
-- pg_restore -U username -d database_name -L list.txt backup.dump

-- Restore only schema (no data)
-- pg_restore -U username -d database_name --schema-only backup.dump

-- Restore only data (no schema)
-- pg_restore -U username -d database_name --data-only backup.dump

-- Restore specific section
-- pg_restore -U username -d database_name --section=pre-data backup.dump
-- pg_restore -U username -d database_name --section=data backup.dump
-- pg_restore -U username -d database_name --section=post-data backup.dump

-- Restore with jobs (parallel restore)
-- pg_restore -U username -d database_name -j 4 backup.dump

-- Restore directory format with jobs
-- pg_restore -U username -d database_name -j 4 backup_dir/`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Restore Options</h2>

          <CodeBlock
            title="SQL: Advanced Restore Options"
            language="sql"
            code={`-- Restore with function bodies
-- pg_restore -U username -d database_name --function=function_name backup.dump

-- Restore with trigger
-- pg_restore -U username -d database_name --trigger=trigger_name backup.dump

-- Restore with index
-- pg_restore -U username -d database_name --index=index_name backup.dump

-- Restore with no data for specific table
-- pg_restore -U username -d database_name --table=users --data-only backup.dump

-- Restore with disable triggers
-- pg_restore -U username -d database_name --disable-triggers backup.dump

-- Restore with use set session authorization
-- pg_restore -U username -d database_name --use-set-session-authorization backup.dump

-- Restore with no tablespaces
-- pg_restore -U username -d database_name --no-tablespaces backup.dump

-- Restore with tablespace mapping
-- pg_restore -U username -d database_name --tablespace=old_tablespace:new_tablespace backup.dump

-- Restore with role mapping
-- pg_restore -U username -d database_name --role=old_role:new_role backup.dump

-- Restore with verbose progress
-- pg_restore -U username -d database_name -v --progress backup.dump

-- Extract SQL from custom format
-- pg_restore backup.dump > backup.sql

-- Extract SQL for specific table
-- pg_restore -t users backup.dump > users.sql`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Restoring Plain SQL Dumps</h2>

          <CodeBlock
            title="SQL: Restoring SQL Files"
            language="sql"
            code={`-- For plain SQL dumps, use psql instead of pg_restore

-- Restore SQL file
-- psql -U username -d database_name -f backup.sql

-- Restore SQL file with verbose
-- psql -U username -d database_name -f backup.sql -v ON_ERROR_STOP=1

-- Restore SQL file with single transaction
-- psql -U username -d database_name -f backup.sql --single-transaction

-- Restore SQL file with echo
-- psql -U username -d database_name -f backup.sql --echo-all

-- Restore SQL file to new database
-- createdb new_database
-- psql -U username -d new_database -f backup.sql

-- Restore SQL from stdin
-- psql -U username -d database_name < backup.sql

-- Restore SQL with connection options
-- psql -h localhost -p 5432 -U username -d database_name -f backup.sql

-- Restore SQL with ON_ERROR_STOP
-- psql -U username -d database_name -f backup.sql --set ON_ERROR_STOP=on

-- Restore SQL with quiet mode
-- psql -U username -d database_name -f backup.sql -q`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Prisma: pg_restore</h2>

          <CodeBlock
            title="Prisma: Database Restore"
            language="prisma"
            code={`// Prisma doesn't have built-in restore functionality
// Use pg_restore via command line or child process

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Restore custom format dump
async function restoreDatabase() {
  const { stdout, stderr } = await execAsync(
    'pg_restore -U username -d database_name backup.dump'
  );
  console.log('Restore completed');
}

// Restore with clean
async function restoreClean() {
  await execAsync(
    'pg_restore -U username -d database_name --clean backup.dump'
  );
}

// Restore specific table
async function restoreTable() {
  await execAsync(
    'pg_restore -U username -d database_name -t users backup.dump'
  );
}

// Restore with jobs (parallel)
async function restoreParallel() {
  await execAsync(
    'pg_restore -U username -d database_name -j 4 backup.dump'
  );
}

// Restore SQL file
async function restoreSQL() {
  await execAsync(
    'psql -U username -d database_name -f backup.sql'
  );
}

// List dump contents
async function listDumpContents() {
  const { stdout } = await execAsync(
    'pg_restore -l backup.dump'
  );
  console.log(stdout);
}

// Selective restore using list file
async function selectiveRestore() {
  // First, create list file
  await execAsync('pg_restore -l backup.dump > restore_list.txt');
  
  // Edit restore_list.txt to comment unwanted items
  // Then restore using list
  await execAsync(
    'pg_restore -U username -d database_name -L restore_list.txt backup.dump'
  );
}

// Restore with environment variables
async function restoreWithEnv() {
  const dbUrl = process.env.DATABASE_URL;
  await execAsync(
    \`pg_restore -d "\${dbUrl}" backup.dump\`
  );
}

// Restore schema only
async function restoreSchema() {
  await execAsync(
    'pg_restore -U username -d database_name --schema-only backup.dump'
  );
}

// Restore data only
async function restoreData() {
  await execAsync(
    'pg_restore -U username -d database_name --data-only backup.dump'
  );
}

// Note: For production restores:
// - Test on staging first
// - Backup current database before restore
// - Use transactions when possible
// - Verify restore success`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Test restores regularly</strong> - verify backups are valid</li>
              <li><strong>Backup before restore</strong> - save current state before restoring</li>
              <li><strong>Use transactions</strong> - --single-transaction for all-or-nothing</li>
              <li><strong>Use parallel restore</strong> - -j option for faster restores</li>
              <li><strong>Verify restore success</strong> - check data integrity after restore</li>
              <li><strong>Use selective restore</strong> - restore only what's needed</li>
              <li><strong>Handle errors properly</strong> - use --exit-on-error for critical restores</li>
              <li><strong>Restore in stages</strong> - schema first, then data</li>
              <li><strong>Document restore procedures</strong> - maintain clear documentation</li>
            </ul>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}


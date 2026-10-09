import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 1: Logical Backups - Module 12 - Most Asked Interview Questions',
  description:
    'Most asked pg_dump interview questions: logical vs physical backups, pg_dump vs pg_dumpall, custom vs plain format, pg_restore, parallel dump and restore, single table dumps, locking behaviour, and production pitfalls.',
};

export default function MaiqBackupLesson01LogicalBackups() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 1: Logical Backups</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          A logical backup exports your objects and rows as something PostgreSQL can load again, rather
          than copying the raw files. <code>pg_dump</code> is the tool, and it is the most asked backup
          topic because nearly every team uses it somewhere.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="What is the difference between logical and physical backups?">
            <p>
              <strong>Logical</strong> backups export objects and data, such as tables and rows, using tools
              like <code>pg_dump</code>. They are portable across versions and machines and let you pick
              individual objects, but they are slow for very large databases.{' '}
              <strong>Physical</strong> backups copy the cluster files, which is a base backup plus WAL.
              They restore much faster for large systems and are required for point-in-time recovery, but
              they are tied to the PostgreSQL version and the filesystem layout.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Logical: move a database to a new major version, copy one schema to staging, or restore a
                single table
              </li>
              <li>
                Physical: recover a multi-terabyte cluster quickly, or rewind to an exact moment in time
              </li>
              <li>
                Logical restore rebuilds indexes from scratch, which is often the slowest part
              </li>
              <li>
                Most production setups use both: physical plus WAL as the primary strategy, logical dumps
                for portability and for grabbing a single table
              </li>
            </ul>
          </InterviewQACard>

          <InterviewQACard level="Junior" question="What does pg_dump do? How is pg_dumpall different?">
            <p>
              <code>pg_dump</code> backs up a <em>single database</em>, its schema and its data.{' '}
              <code>pg_dumpall</code> dumps <em>all databases</em> in the cluster plus the global objects
              that live outside any database, which means roles and tablespaces. Day-to-day application
              backups usually use <code>pg_dump</code>. Moving a whole cluster needs the globals too.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <code>pg_dump</code> does not include roles, passwords, or grants for roles that do not
                exist on the target, which is the classic reason a restore looks broken
              </li>
              <li>
                <code>pg_dumpall</code> can only write plain SQL, so it cannot do parallel or selective
                restore
              </li>
              <li>
                The common pattern is <code>pg_dumpall --globals-only</code> for roles plus one{' '}
                <code>pg_dump</code> per database
              </li>
              <li>
                Always run the version of the tool that matches or is newer than the server you restore into
              </li>
            </ul>
            <CodeBlock
              title="Basic dump commands"
              language="bash"
              code={`# Single database, custom format (recommended)
pg_dump -Fc -f shop.dump shop

# Plain SQL (human-readable, easy to edit; less flexible restore)
pg_dump -Fp -f shop.sql shop

# Globals + all DBs
pg_dumpall -g -f globals.sql
pg_dumpall -f full_cluster.sql

# Practical cluster backup: globals once, then each database
pg_dumpall --globals-only -f globals.sql
for db in shop analytics; do pg_dump -Fc -f "$db.dump" "$db"; done`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="Custom format vs plain SQL format - when do you use each?">
            <p>
              <strong>Plain</strong> (<code>-Fp</code>) produces a <code>.sql</code> script that you restore
              with <code>psql</code>. It is good for small databases and for reading the SQL.{' '}
              <strong>Custom</strong> (<code>-Fc</code>) produces a compressed archive that you restore with{' '}
              <code>pg_restore</code>. It supports parallel restore, restoring selected objects, and
              reordering. Prefer custom, or directory format (<code>-Fd</code>), in production.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Directory</strong> (<code>-Fd</code>) is the only format that supports a parallel{' '}
                <em>dump</em>, because it writes one file per table
              </li>
              <li>
                Plain format cannot be restored in parallel and cannot skip objects
              </li>
              <li>
                Custom and directory formats compress by default, so the dump is much smaller
              </li>
              <li>
                A plain dump is easier to grep when you just need one CREATE TABLE statement
              </li>
            </ul>
            <CodeBlock
              title="Choosing a format"
              language="bash"
              code={`# Small database, want readable SQL
pg_dump -Fp -f shop.sql shop
psql -d shop_restore -f shop.sql

# Production: compressed archive, flexible restore
pg_dump -Fc -Z 6 -f shop.dump shop

# Large database: directory format, parallel dump
pg_dump -Fd -j 8 -f shop_dir shop`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="How do you restore a custom-format dump with pg_restore?">
            <p>
              Create an empty target database, or restore into an existing one carefully, then run{' '}
              <code>pg_restore</code>. Use <code>-j</code> for parallel restore, which works with custom and
              directory formats. Always add <code>--exit-on-error</code> in automation, because by default{' '}
              <code>pg_restore</code> keeps going after failures and leaves you with a half-restored
              database that looks fine.
            </p>
            <CodeBlock
              title="pg_restore examples"
              language="bash"
              code={`createdb shop_restore
pg_restore -d shop_restore -j 4 shop.dump

# List contents / restore one table
pg_restore -l shop.dump
pg_restore -d shop_restore -t orders shop.dump

# Safer in scripts: stop at the first problem
pg_restore -d shop_restore --exit-on-error -j 4 shop.dump

# Generate SQL instead of restoring, to inspect first
pg_restore -f review.sql shop.dump`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="How do you dump only schema or only data? How does that relate to Prisma?">
            <p>
              <code>pg_dump --schema-only</code> and <code>--data-only</code> help you clone a structure or
              move just the rows. Prisma migrations own the <em>intended</em> schema in your repository,
              while a dump captures the <em>actual</em> production state, including any manual hotfix
              somebody applied at 2am. For disaster recovery you need the data and the globals; do not
              assume replaying migrations rebuilds production.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                A data-only restore needs the schema to exist already, and you usually want{' '}
                <code>--disable-triggers</code> so foreign keys do not fail on load order
              </li>
              <li>
                A schema-only dump of production is the fastest way to detect drift from your Prisma schema
              </li>
              <li>
                <code>prisma migrate diff</code> can compare the migration history against a live database
                and show exactly what drifted
              </li>
            </ul>
            <CodeBlock
              title="Selective dumps"
              language="bash"
              code={`pg_dump -Fc --schema-only -f schema.dump shop
pg_dump -Fc --data-only -f data.dump shop
pg_dump -Fc -t orders -t order_items -f orders.dump shop

# Data-only load without fighting foreign keys
pg_restore -d shop_restore --data-only --disable-triggers data.dump`}
            />
            <CodeBlock
              title="Detecting schema drift against Prisma"
              language="bash"
              code={`# What does production have that the migrations do not describe?
npx prisma migrate diff \\
  --from-url "$DATABASE_URL" \\
  --to-schema-datamodel prisma/schema.prisma \\
  --script

# Readable snapshot of the real production structure
pg_dump -Fp --schema-only --no-owner --no-privileges -f prod_schema.sql shop`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How do you dump a single table or a single schema?">
            <p>
              <code>pg_dump</code> can filter by table with <code>-t</code> and by schema with{' '}
              <code>-n</code>, and both have exclude versions, <code>-T</code> and <code>-N</code>. This is
              how you copy one feature area to staging, or archive one huge table before dropping it. The
              important warning is that these filters do not follow relationships.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <code>-t orders</code> dumps the table and its indexes, but not the tables its foreign keys
                point to, so restoring alone can fail or leave orphans
              </li>
              <li>
                Sequences owned by the table are included; sequences shared with other tables are not
              </li>
              <li>
                Patterns are supported, for example <code>-t &apos;audit_*&apos;</code>, and quoting matters
                for mixed-case names, which is exactly what Prisma creates
              </li>
              <li>
                Excluding a huge log table with <code>-T</code> is a quick way to make a dump small enough to
                be useful
              </li>
              <li>
                To restore one table out of a full dump, you do not need a special dump. Use{' '}
                <code>pg_restore -t</code> on the archive you already have
              </li>
            </ul>
            <CodeBlock
              title="Table and schema filters"
              language="bash"
              code={`# One table, with data
pg_dump -Fc -t orders -f orders.dump shop

# Prisma tables are usually quoted mixed case
pg_dump -Fc -t '"Order"' -t '"OrderItem"' -f order_models.dump shop

# One schema only
pg_dump -Fc -n app -f app_schema.dump shop

# Everything except the noisy tables
pg_dump -Fc -T 'audit_*' -T 'event_log' -f shop_lean.dump shop

# Pull one table out of an existing full dump
pg_restore -d shop_restore -t orders --data-only shop.dump`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Does pg_dump block writes?">
            <p>
              No. <code>pg_dump</code> does not block reads or writes, because it runs inside one
              transaction with a consistent snapshot, which is how you get a dump that represents a single
              moment. But it does take an <code>ACCESS SHARE</code> lock on every table it reads, and that
              lock conflicts with statements that need an exclusive lock, such as{' '}
              <code>ALTER TABLE</code>, <code>DROP TABLE</code>, <code>TRUNCATE</code>, and{' '}
              <code>VACUUM FULL</code>. So dumps and migrations fight each other.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                The real danger is a lock queue. A migration waiting for the dump blocks every later query
                on that table, which looks like a total outage even though the dump itself is harmless
              </li>
              <li>
                A long dump holds an old snapshot open, so autovacuum cannot clean up dead tuples during
                that time, and bloat grows
              </li>
              <li>
                It also costs real I/O and cache pressure on the server, which slows other queries
              </li>
              <li>
                Prefer dumping from a read replica or a standby, and schedule dumps away from deploy windows
              </li>
              <li>
                A long <code>pg_dump</code> against a standby can be cancelled by conflicting replay. Enable{' '}
                <code>hot_standby_feedback</code> or raise the max standby delay
              </li>
            </ul>
            <CodeBlock
              title="Check what a running dump is holding"
              language="sql"
              code={`-- The dump session and its age
SELECT pid, usename, state, age(clock_timestamp(), xact_start) AS xact_age,
       left(query, 60) AS query
FROM pg_stat_activity
WHERE application_name LIKE 'pg_dump%';

-- Anything queued behind it
SELECT pid, pg_blocking_pids(pid) AS blocked_by, left(query, 60) AS query
FROM pg_stat_activity
WHERE cardinality(pg_blocking_pids(pid)) > 0;

-- Make migrations give up instead of queueing behind a dump
SET lock_timeout = '3s';
ALTER TABLE orders ADD COLUMN note text;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How does parallel dump and restore with -j work?">
            <p>
              <code>-j</code> sets how many worker processes run at once. On restore it is the single biggest
              speed win, because loading data and building indexes is work that spreads across CPUs well. On
              dump it only works with directory format, since each worker needs its own output file.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Parallel dump: <code>-Fd -j N</code> only. It fails with custom or plain format
              </li>
              <li>
                Parallel restore: <code>-j N</code> with custom or directory format. Plain SQL through{' '}
                <code>psql</code> is always single-threaded
              </li>
              <li>
                Each worker is a separate connection, so <code>-j 16</code> needs 16 free connection slots
                plus enough <code>maintenance_work_mem</code> for each one
              </li>
              <li>
                Start around the number of CPU cores and stop when the disk becomes the limit. More workers
                than cores usually makes it slower
              </li>
              <li>
                A parallel dump takes a synchronized snapshot across all workers, so the result is still
                consistent. That requires a primary or a standby that supports exported snapshots
              </li>
              <li>
                Restore tuning matters more than the worker count: raise{' '}
                <code>maintenance_work_mem</code>, and for a throwaway target you can even turn off{' '}
                <code>fsync</code>
              </li>
            </ul>
            <CodeBlock
              title="Parallel dump and restore"
              language="bash"
              code={`# Parallel dump needs directory format
pg_dump -Fd -j 8 -f shop_dir shop

# This fails: custom format cannot be dumped in parallel
# pg_dump -Fc -j 8 -f shop.dump shop

# Parallel restore from either custom or directory format
pg_restore -d shop_restore -j 8 --exit-on-error shop_dir
pg_restore -d shop_restore -j 8 --exit-on-error shop.dump

# Restore faster by splitting data load and index build
pg_restore -d shop_restore -j 8 --section=pre-data --section=data shop.dump
pg_restore -d shop_restore -j 8 --section=post-data shop.dump`}
            />
            <CodeBlock
              title="Server settings that speed up a restore"
              language="sql"
              code={`-- On the restore target only, never on a live primary
ALTER SYSTEM SET maintenance_work_mem = '2GB';
ALTER SYSTEM SET max_wal_size = '16GB';
ALTER SYSTEM SET autovacuum = off;
SELECT pg_reload_conf();

-- After the restore: put the settings back and refresh statistics
ALTER SYSTEM RESET ALL;
SELECT pg_reload_conf();
ANALYZE;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="What are common pg_dump and pg_restore production pitfalls?">
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Forgetting the globals, which means roles and grants. <code>pg_dump</code> alone is not
                enough to move a cluster
              </li>
              <li>Extension or shared library mismatch on the target server</li>
              <li>Restoring into a non-empty database and hitting object conflicts</li>
              <li>
                Using logical dumps as the only backup for a multi-terabyte cluster, because the restore
                will not meet any realistic recovery time target
              </li>
              <li>
                Not using <code>--no-owner</code> or a role mapping when the target has different role names
              </li>
              <li>
                Assuming parallel <code>-j</code> works with plain SQL format, which it does not
              </li>
              <li>
                Letting <code>pg_restore</code> continue past errors, so the database looks restored but is
                missing objects. Use <code>--exit-on-error</code>
              </li>
              <li>
                Running a dump during a deploy window, so a migration and the dump deadlock the table behind
                a lock queue
              </li>
              <li>
                Forgetting to run <code>ANALYZE</code> after the restore, which leaves the planner blind and
                the restored database mysteriously slow
              </li>
              <li>
                Never testing the restore, so the first real attempt happens during an incident
              </li>
            </ul>
            <CodeBlock
              title="Safer restore flags (example)"
              language="bash"
              code={`pg_restore -d shop_restore \\
  --no-owner --role=migrator \\
  --exit-on-error \\
  -j 8 shop.dump`}
            />
            <CodeBlock
              title="Post-restore verification"
              language="bash"
              code={`# Statistics, or every query plan will be wrong
psql -d shop_restore -c 'ANALYZE;'

# Did every object arrive?
psql -d shop_restore -c "SELECT count(*) AS tables FROM pg_tables WHERE schemaname NOT IN ('pg_catalog','information_schema');"
psql -d shop_restore -c 'SELECT extname, extversion FROM pg_extension ORDER BY 1;'
psql -d shop_restore -c 'SELECT rolname FROM pg_roles ORDER BY 1;'

# Spot check row counts against the source
psql -d shop_restore -c 'SELECT count(*) FROM orders;'`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

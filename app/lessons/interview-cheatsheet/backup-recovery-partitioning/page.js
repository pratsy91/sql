import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';

export const metadata = {
  title: 'Backup, Recovery & Partitioning - Interview Cheatsheet',
  description: 'Backup, recovery, and partitioning strategies for interviews',
};

export default function BackupRecoveryPartitioning() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Backup, Recovery & Partitioning - Interview Cheatsheet</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Backup Strategies</h2>
          
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">pg_dump</h3>
            <p className="text-sm mb-2">Creates SQL script or custom-format dump of single database</p>
            <CodeBlock
              title="pg_dump Examples"
              language="bash"
              code={`# Plain SQL format
pg_dump -U username -d database_name > backup.sql

# Custom format (compressed, allows selective restore)
pg_dump -U username -d database_name -F c -f backup.dump

# Schema only (no data)
pg_dump -U username -d database_name --schema-only > schema.sql

# Data only (no schema)
pg_dump -U username -d database_name --data-only > data.sql

# Specific tables
pg_dump -U username -d database_name -t table1 -t table2 > tables.sql

# Exclude tables
pg_dump -U username -d database_name -T excluded_table > backup.sql`}
            />
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">pg_dumpall</h3>
            <p className="text-sm mb-2">Dumps all databases and roles (entire cluster)</p>
            <CodeBlock
              title="pg_dumpall Example"
              language="bash"
              code={`# Dump everything
pg_dumpall -U username > cluster_backup.sql

# Dump roles only
pg_dumpall -U username --roles-only > roles.sql

# Dump globals only
pg_dumpall -U username --globals-only > globals.sql`}
            />
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Restore from Backup</h3>
            <CodeBlock
              title="Restore Examples"
              language="bash"
              code={`# Restore from SQL file
psql -U username -d database_name < backup.sql

# Restore from custom format (selective restore possible)
pg_restore -U username -d database_name backup.dump

# Restore with options
pg_restore -U username -d database_name --clean --if-exists backup.dump

# List contents of custom format backup
pg_restore --list backup.dump`}
            />
          </div>

          <div className="bg-blue-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Backup Types</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li><strong>Logical Backup:</strong> pg_dump/pg_dumpall - SQL format, portable, selective restore</li>
              <li><strong>Physical Backup:</strong> File system copy - Faster, must match PostgreSQL version</li>
              <li><strong>Continuous Archiving:</strong> WAL archiving for Point-in-Time Recovery (PITR)</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Point-in-Time Recovery (PITR)</h2>
          
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">WAL Archiving Setup</h3>
            <CodeBlock
              title="postgresql.conf Configuration"
              language="ini"
              code={`# Enable WAL archiving
wal_level = replica  # or 'logical' for logical replication
archive_mode = on
archive_command = 'cp %p /path/to/archive/%f'

# Or use a script
archive_command = '/path/to/archive_script.sh %p %f'`}
            />
          </div>

          <CodeBlock
            title="PITR Process"
            language="bash"
            code={`# 1. Take base backup
pg_basebackup -D /backup/base -Ft -z -P

# 2. Configure recovery
# Create recovery.conf (PostgreSQL 12+) or use postgresql.auto.conf
# recovery_target_time = '2024-01-01 12:00:00'
# restore_command = 'cp /archive/%f %p'

# 3. Start PostgreSQL - it will recover to target time
pg_ctl start -D /backup/base`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Table Partitioning</h2>
          
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Range Partitioning</h3>
            <p className="text-sm mb-2">Partition by range of values (dates, numbers)</p>
            <CodeBlock
              title="Range Partitioning Example"
              language="sql"
              code={`-- Create partitioned table
CREATE TABLE sales (
  id SERIAL,
  sale_date DATE NOT NULL,
  amount DECIMAL(10,2),
  region VARCHAR(50)
) PARTITION BY RANGE (sale_date);

-- Create partitions
CREATE TABLE sales_2023_q1 PARTITION OF sales
  FOR VALUES FROM ('2023-01-01') TO ('2023-04-01');

CREATE TABLE sales_2023_q2 PARTITION OF sales
  FOR VALUES FROM ('2023-04-01') TO ('2023-07-01');

CREATE TABLE sales_2023_q3 PARTITION OF sales
  FOR VALUES FROM ('2023-07-01') TO ('2023-10-01');

CREATE TABLE sales_2023_q4 PARTITION OF sales
  FOR VALUES FROM ('2023-10-01') TO ('2024-01-01');

-- Default partition (catch-all)
CREATE TABLE sales_future PARTITION OF sales
  DEFAULT;`}
            />
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">List Partitioning</h3>
            <p className="text-sm mb-2">Partition by list of values</p>
            <CodeBlock
              title="List Partitioning Example"
              language="sql"
              code={`CREATE TABLE users (
  id SERIAL,
  name VARCHAR(100),
  region VARCHAR(50) NOT NULL,
  email VARCHAR(100)
) PARTITION BY LIST (region);

CREATE TABLE users_us PARTITION OF users
  FOR VALUES IN ('US', 'CA', 'MX');

CREATE TABLE users_eu PARTITION OF users
  FOR VALUES IN ('UK', 'FR', 'DE', 'IT');

CREATE TABLE users_asia PARTITION OF users
  FOR VALUES IN ('JP', 'CN', 'IN');`}
            />
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Hash Partitioning</h3>
            <p className="text-sm mb-2">Partition by hash function (distributes evenly)</p>
            <CodeBlock
              title="Hash Partitioning Example"
              language="sql"
              code={`CREATE TABLE orders (
  id SERIAL,
  user_id INT NOT NULL,
  amount DECIMAL(10,2),
  order_date DATE
) PARTITION BY HASH (user_id);

-- Create 4 hash partitions
CREATE TABLE orders_0 PARTITION OF orders
  FOR VALUES WITH (MODULUS 4, REMAINDER 0);

CREATE TABLE orders_1 PARTITION OF orders
  FOR VALUES WITH (MODULUS 4, REMAINDER 1);

CREATE TABLE orders_2 PARTITION OF orders
  FOR VALUES WITH (MODULUS 4, REMAINDER 2);

CREATE TABLE orders_3 PARTITION OF orders
  FOR VALUES WITH (MODULUS 4, REMAINDER 3);`}
            />
          </div>

          <div className="bg-yellow-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Partitioning Benefits</h3>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li><strong>Query Performance:</strong> Partition pruning - only scans relevant partitions</li>
              <li><strong>Maintenance:</strong> VACUUM, REINDEX faster on smaller partitions</li>
              <li><strong>Data Management:</strong> Easy to drop old partitions (DELETE old data)</li>
              <li><strong>Indexing:</strong> Indexes are per-partition, smaller and faster</li>
            </ul>
          </div>

          <CodeBlock
            title="Partition Management"
            language="sql"
            code={`-- Attach existing table as partition
CREATE TABLE sales_2024_q1 (LIKE sales INCLUDING ALL);
-- Populate data...
ALTER TABLE sales ATTACH PARTITION sales_2024_q1
  FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');

-- Detach partition (becomes standalone table)
ALTER TABLE sales DETACH PARTITION sales_2023_q1;

-- List all partitions
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' AND tablename LIKE 'sales_%';`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Common Interview Questions</h2>
          
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Q: What is the difference between pg_dump and pg_dumpall?</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li><strong>pg_dump:</strong> Dumps single database, more flexible, can dump specific tables</li>
              <li><strong>pg_dumpall:</strong> Dumps entire cluster (all databases + roles), less flexible</li>
              <li><strong>Use pg_dump:</strong> For individual database backups</li>
              <li><strong>Use pg_dumpall:</strong> For full cluster backup or role management</li>
            </ul>
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Q: When would you use table partitioning?</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>Large tables (millions/billions of rows)</li>
              <li>Queries often filter by partition key (enables partition pruning)</li>
              <li>Need to remove old data easily (DROP partition vs DELETE)</li>
              <li>Parallel query execution across partitions</li>
              <li>Different retention policies per partition</li>
            </ul>
            <p className="text-sm mt-2 text-red-600 dark:text-red-400">
              <strong>Don't partition:</strong> Small tables, queries don't filter by partition key, frequent cross-partition queries
            </p>
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Q: Explain Point-in-Time Recovery (PITR)</h3>
            <p className="text-sm mb-2">
              PITR allows recovery to any point in time by combining a base backup with archived WAL files. 
              Process:
            </p>
            <ol className="list-decimal pl-6 space-y-1 text-sm">
              <li>Take base backup (pg_basebackup)</li>
              <li>Enable WAL archiving (archive_mode = on)</li>
              <li>Archive WAL files continuously</li>
              <li>To recover: restore base backup + replay WAL files up to target time</li>
            </ol>
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Q: What is partition pruning?</h3>
            <p className="text-sm mb-2">
              Partition pruning is when PostgreSQL eliminates partitions from query execution if they cannot 
              contain matching rows. This dramatically improves performance.
            </p>
            <CodeBlock
              title="Partition Pruning Example"
              language="sql"
              code={`-- With partition pruning, only sales_2023_q4 is scanned
SELECT * FROM sales 
WHERE sale_date BETWEEN '2023-10-01' AND '2023-12-31';

-- Without partition key in WHERE, all partitions scanned (slow!)
SELECT * FROM sales WHERE amount > 1000;`}
            />
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Q: How do you choose partitioning strategy?</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li><strong>Range:</strong> Ordered data (dates, numbers), time-series data</li>
              <li><strong>List:</strong> Discrete categories (regions, status values)</li>
              <li><strong>Hash:</strong> Even distribution needed, no natural ordering</li>
              <li><strong>Consider:</strong> Query patterns, data distribution, maintenance needs</li>
            </ul>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}


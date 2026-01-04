import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Logical Replication - PostgreSQL Learning',
  description: 'Learn about PostgreSQL logical replication including publications and subscriptions',
};

export default function LogicalReplication() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Logical Replication</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">What is Logical Replication?</h2>
          <p className="mb-4">
            Logical replication replicates data changes at the logical level (table rows) rather than 
            at the physical level (WAL records). It allows selective replication of specific tables, 
            cross-version replication, and can be used for data distribution, upgrades, and reporting.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Publication</h2>

          <CodeBlock
            title="SQL: Creating Publications"
            language="sql"
            code={`-- Enable logical replication (on publisher)
-- Set in postgresql.conf:
-- wal_level = logical

-- Check WAL level
SHOW wal_level;

-- Create publication for all tables
CREATE PUBLICATION all_tables FOR ALL TABLES;

-- Create publication for specific tables
CREATE PUBLICATION users_publication FOR TABLE users, profiles;

-- Create publication with WHERE clause (filtered replication)
CREATE PUBLICATION active_users_publication 
FOR TABLE users 
WHERE (status = 'active');

-- Create publication for specific schema
CREATE PUBLICATION schema_publication FOR TABLES IN SCHEMA public;

-- View all publications
SELECT 
  pubname,
  puballtables,
  pubinsert,
  pubupdate,
  pubdelete,
  pubtruncate
FROM pg_publication;

-- View publication details
SELECT 
  p.pubname,
  pt.schemaname,
  pt.tablename
FROM pg_publication p
LEFT JOIN pg_publication_tables pt ON p.pubname = pt.pubname
ORDER BY p.pubname, pt.tablename;

-- Alter publication
ALTER PUBLICATION users_publication ADD TABLE orders;
ALTER PUBLICATION users_publication DROP TABLE profiles;

-- Alter publication options
ALTER PUBLICATION users_publication SET (publish = 'insert,update');
-- Options: insert, update, delete, truncate

-- Drop publication
DROP PUBLICATION users_publication;

-- Check publication tables
SELECT 
  pubname,
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'users_publication';`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Subscription</h2>

          <CodeBlock
            title="SQL: Creating Subscriptions"
            language="sql"
            code={`-- Create subscription (on subscriber)
CREATE SUBSCRIPTION users_subscription
CONNECTION 'host=publisher_host port=5432 user=replication_user password=password dbname=mydb'
PUBLICATION users_publication;

-- Create subscription with slot name
CREATE SUBSCRIPTION users_subscription
CONNECTION 'host=publisher_host port=5432 user=replication_user password=password dbname=mydb'
PUBLICATION users_publication
WITH (slot_name = 'users_slot');

-- Create subscription with copy_data = false (skip initial copy)
CREATE SUBSCRIPTION users_subscription
CONNECTION 'host=publisher_host port=5432 user=replication_user password=password dbname=mydb'
PUBLICATION users_publication
WITH (copy_data = false);

-- Create subscription with create_slot = false (use existing slot)
CREATE SUBSCRIPTION users_subscription
CONNECTION 'host=publisher_host port=5432 user=replication_user password=password dbname=mydb'
PUBLICATION users_publication
WITH (create_slot = false);

-- View all subscriptions
SELECT 
  subname,
  subenabled,
  subconninfo,
  subslotname,
  subsynccommit,
  subpublications
FROM pg_subscription;

-- View subscription details
SELECT 
  s.subname,
  s.subenabled,
  s.subslotname,
  s.subpublications,
  r.relname AS table_name
FROM pg_subscription s
JOIN pg_subscription_rel sr ON s.oid = sr.srsubid
JOIN pg_class r ON sr.srrelid = r.oid;

-- Enable subscription
ALTER SUBSCRIPTION users_subscription ENABLE;

-- Disable subscription
ALTER SUBSCRIPTION users_subscription DISABLE;

-- Alter subscription connection
ALTER SUBSCRIPTION users_subscription
CONNECTION 'host=new_publisher_host port=5432 user=replication_user password=password dbname=mydb';

-- Alter subscription publication
ALTER SUBSCRIPTION users_subscription SET PUBLICATION users_publication, orders_publication;

-- Refresh subscription (re-sync data)
ALTER SUBSCRIPTION users_subscription REFRESH PUBLICATION;

-- Drop subscription
DROP SUBSCRIPTION users_subscription;

-- Drop subscription with slot cleanup
DROP SUBSCRIPTION users_subscription CASCADE;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Monitoring Logical Replication</h2>

          <CodeBlock
            title="SQL: Monitoring Subscriptions"
            language="sql"
            code={`-- View subscription status
SELECT 
  subname,
  subenabled,
  subslotname,
  subpublications
FROM pg_subscription;

-- View subscription statistics
SELECT 
  subname,
  subenabled,
  subslotname,
  subpublications,
  pg_subscription_rel.srsubid,
  pg_subscription_rel.srrelid,
  pg_subscription_rel.srsubstate,
  pg_subscription_rel.srsublsn
FROM pg_subscription
JOIN pg_subscription_rel ON pg_subscription.oid = pg_subscription_rel.srsubid;

-- Check replication lag
SELECT 
  subname,
  subslotname,
  pg_replication_slots.restart_lsn,
  pg_replication_slots.confirmed_flush_lsn,
  pg_wal_lsn_diff(pg_current_wal_lsn(), pg_replication_slots.restart_lsn) AS lag_bytes
FROM pg_subscription
JOIN pg_replication_slots ON pg_subscription.subslotname = pg_replication_slots.slot_name;

-- View worker processes
SELECT 
  pid,
  usename,
  application_name,
  client_addr,
  state,
  sync_state,
  sync_priority
FROM pg_stat_replication
WHERE application_name LIKE 'subscription%';

-- Check for replication errors
SELECT 
  pid,
  usename,
  application_name,
  state,
  sync_state,
  sync_priority
FROM pg_stat_replication
WHERE state != 'streaming';

-- View logical replication slots
SELECT 
  slot_name,
  slot_type,
  database,
  active,
  restart_lsn,
  confirmed_flush_lsn,
  pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) AS lag_size
FROM pg_replication_slots
WHERE slot_type = 'logical';`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Replication Options</h2>

          <CodeBlock
            title="SQL: Subscription Options"
            language="sql"
            code={`-- Subscription options:
-- copy_data: Copy existing data (default: true)
-- create_slot: Create replication slot (default: true)
-- enabled: Enable subscription immediately (default: true)
-- slot_name: Name of replication slot
-- synchronous_commit: Synchronous commit mode

-- Create subscription with options
CREATE SUBSCRIPTION users_subscription
CONNECTION 'host=publisher_host port=5432 user=replication_user password=password dbname=mydb'
PUBLICATION users_publication
WITH (
  copy_data = true,
  create_slot = true,
  enabled = true,
  slot_name = 'users_slot',
  synchronous_commit = 'off'
);

-- Alter subscription options
ALTER SUBSCRIPTION users_subscription SET (synchronous_commit = 'local');

-- Publication options:
-- publish: What operations to publish (insert, update, delete, truncate)

-- Alter publication options
ALTER PUBLICATION users_publication SET (publish = 'insert,update,delete');

-- Filtered replication (WHERE clause)
CREATE PUBLICATION filtered_users
FOR TABLE users
WHERE (status = 'active' AND created_at > '2024-01-01');

-- Note: Filtered replication requires table to have REPLICA IDENTITY

-- Set REPLICA IDENTITY
ALTER TABLE users REPLICA IDENTITY FULL;
-- Options: DEFAULT, USING INDEX index_name, FULL, NOTHING

-- Check REPLICA IDENTITY
SELECT 
  relname,
  relreplident
FROM pg_class
WHERE relname = 'users';`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Prisma: Logical Replication</h2>

          <CodeBlock
            title="Prisma: Logical Replication Management"
            language="prisma"
            code={`// Prisma doesn't have direct replication management
// Use raw SQL for replication operations

// Create publication
await prisma.$executeRaw\`
  CREATE PUBLICATION users_publication FOR TABLE "User"
\`;

// View publications
const publications = await prisma.$queryRaw\`
  SELECT 
    pubname,
    puballtables,
    pubinsert,
    pubupdate,
    pubdelete
  FROM pg_publication
\`;

// Create subscription
await prisma.$executeRaw\`
  CREATE SUBSCRIPTION users_subscription
  CONNECTION $1
  PUBLICATION users_publication
\`, 'host=publisher port=5432 user=repl password=pass dbname=mydb';

// View subscriptions
const subscriptions = await prisma.$queryRaw\`
  SELECT 
    subname,
    subenabled,
    subslotname,
    subpublications
  FROM pg_subscription
\`;

// Check subscription status
const status = await prisma.$queryRaw\`
  SELECT 
    subname,
    subenabled,
    subslotname,
    pg_replication_slots.restart_lsn,
    pg_replication_slots.confirmed_flush_lsn
  FROM pg_subscription
  JOIN pg_replication_slots ON pg_subscription.subslotname = pg_replication_slots.slot_name
\`;

// Enable/disable subscription
await prisma.$executeRaw\`
  ALTER SUBSCRIPTION users_subscription ENABLE
\`;

await prisma.$executeRaw\`
  ALTER SUBSCRIPTION users_subscription DISABLE
\`;

// Refresh subscription
await prisma.$executeRaw\`
  ALTER SUBSCRIPTION users_subscription REFRESH PUBLICATION
\`;

// Drop subscription
await prisma.$executeRaw\`
  DROP SUBSCRIPTION users_subscription
\`;

// Monitor replication lag
const lag = await prisma.$queryRaw\`
  SELECT 
    subname,
    pg_wal_lsn_diff(
      pg_current_wal_lsn(), 
      pg_replication_slots.restart_lsn
    ) AS lag_bytes
  FROM pg_subscription
  JOIN pg_replication_slots ON pg_subscription.subslotname = pg_replication_slots.slot_name
\`;

// Note: Logical replication setup requires:
// 1. wal_level = logical on publisher
// 2. Proper user permissions
// 3. Network connectivity
// 4. Tables must exist on subscriber`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Use replication slots</strong> - prevent WAL deletion</li>
              <li><strong>Monitor replication lag</strong> - ensure subscribers stay current</li>
              <li><strong>Set REPLICA IDENTITY</strong> - required for UPDATE/DELETE replication</li>
              <li><strong>Use filtered replication</strong> - replicate only needed data</li>
              <li><strong>Test failover</strong> - verify replication works correctly</li>
              <li><strong>Monitor disk space</strong> - replication slots prevent WAL cleanup</li>
              <li><strong>Use appropriate options</strong> - copy_data, create_slot, etc.</li>
              <li><strong>Handle conflicts</strong> - logical replication can have conflicts</li>
              <li><strong>Document procedures</strong> - maintain clear replication documentation</li>
            </ul>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}


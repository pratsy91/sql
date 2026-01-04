import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Streaming Replication - PostgreSQL Learning',
  description: 'Learn about PostgreSQL streaming replication including master-slave setup and configuration',
};

export default function StreamingReplication() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Streaming Replication</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">What is Streaming Replication?</h2>
          <p className="mb-4">
            Streaming replication is PostgreSQL's built-in method for creating standby servers that 
            receive WAL (Write-Ahead Log) data from a primary server in real-time. It provides 
            high availability and can be used for read scaling and disaster recovery.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Master-Slave Setup</h2>

          <CodeBlock
            title="SQL: Primary Server Configuration"
            language="sql"
            code={`-- On PRIMARY server, configure postgresql.conf:
-- wal_level = replica
-- max_wal_senders = 3
-- max_replication_slots = 3
-- hot_standby = on (for standby servers)

-- Check current settings
SHOW wal_level;
SHOW max_wal_senders;
SHOW max_replication_slots;

-- View all replication settings
SELECT 
  name,
  setting,
  unit,
  context
FROM pg_settings
WHERE name LIKE '%replication%' OR name LIKE '%wal%'
ORDER BY name;

-- Configure pg_hba.conf on PRIMARY:
-- Allow replication connections
-- host replication replica_user 192.168.1.0/24 md5

-- Create replication user on PRIMARY
CREATE ROLE replica_user WITH REPLICATION LOGIN PASSWORD 'secure_password';

-- Grant necessary privileges
GRANT CONNECT ON DATABASE mydb TO replica_user;

-- Check replication user
SELECT 
  rolname,
  rolreplication,
  rolcanlogin
FROM pg_roles
WHERE rolname = 'replica_user';

-- View replication connections
SELECT 
  pid,
  usename,
  application_name,
  client_addr,
  state,
  sync_state,
  sync_priority
FROM pg_stat_replication;

-- Check WAL sender processes
SELECT 
  pid,
  usename,
  application_name,
  state,
  sent_lsn,
  write_lsn,
  flush_lsn,
  replay_lsn
FROM pg_stat_replication;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Standby Server Setup</h2>

          <CodeBlock
            title="SQL: Standby Server Configuration"
            language="sql"
            code={`-- On STANDBY server, create base backup from PRIMARY:
-- pg_basebackup -h primary_host -D /var/lib/postgresql/data -U replica_user -P -v -R

-- The -R flag creates standby.signal file automatically

-- Or manually create standby.signal:
-- touch /var/lib/postgresql/data/standby.signal

-- Configure recovery settings in postgresql.conf or postgresql.auto.conf:
-- primary_conninfo = 'host=primary_host port=5432 user=replica_user password=secure_password'
-- primary_slot_name = 'standby_slot'  (optional, if using replication slot)

-- Check if server is in recovery mode
SELECT pg_is_in_recovery();

-- View recovery settings
SHOW primary_conninfo;
SHOW primary_slot_name;

-- Check standby status
SELECT 
  pg_is_in_recovery() AS in_recovery,
  pg_last_wal_receive_lsn() AS receive_lsn,
  pg_last_wal_replay_lsn() AS replay_lsn,
  pg_last_wal_replay_lsn() - pg_last_wal_receive_lsn() AS lag_bytes;

-- View replication lag
SELECT 
  EXTRACT(EPOCH FROM (NOW() - pg_last_xact_replay_timestamp())) AS lag_seconds;

-- Check WAL receiver status
SELECT 
  pid,
  status,
  receive_start_lsn,
  received_lsn,
  last_msg_send_time,
  last_msg_receipt_time,
  latest_end_lsn,
  slot_name
FROM pg_stat_wal_receiver;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Replication Configuration</h2>

          <CodeBlock
            title="SQL: Replication Settings"
            language="sql"
            code={`-- PRIMARY server settings (postgresql.conf):
-- wal_level = replica
-- max_wal_senders = 3  (number of concurrent replication connections)
-- max_replication_slots = 3  (number of replication slots)
-- wal_keep_size = 1GB  (WAL files to keep, alternative to replication slots)
-- hot_standby = on  (allows queries on standby)

-- STANDBY server settings (postgresql.conf):
-- hot_standby = on  (required for read queries on standby)
-- max_standby_streaming_delay = 30s  (max delay before canceling queries)
-- max_standby_archive_delay = 300s  (max delay for archive recovery)

-- Synchronous replication (optional, for data consistency):
-- On PRIMARY:
-- synchronous_standby_names = 'standby1,standby2'
-- synchronous_commit = on

-- Check synchronous replication status
SHOW synchronous_standby_names;
SHOW synchronous_commit;

-- View synchronous replication stats
SELECT 
  pid,
  application_name,
  sync_state,
  sync_priority
FROM pg_stat_replication
WHERE sync_state != 'async';

-- Replication modes:
-- async: Asynchronous (default, faster, may lose data)
-- sync: Synchronous (slower, no data loss)

-- Configure replication slot (recommended)
-- On PRIMARY:
SELECT pg_create_physical_replication_slot('standby_slot');

-- View replication slots
SELECT 
  slot_name,
  slot_type,
  active,
  restart_lsn,
  confirmed_flush_lsn
FROM pg_replication_slots;

-- Use slot in standby primary_conninfo:
-- primary_slot_name = 'standby_slot'`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Monitoring Replication</h2>

          <CodeBlock
            title="SQL: Monitoring Replication Status"
            language="sql"
            code={`-- On PRIMARY: View replication status
SELECT 
  pid,
  usename,
  application_name,
  client_addr,
  state,
  sync_state,
  sync_priority,
  sent_lsn,
  write_lsn,
  flush_lsn,
  replay_lsn,
  write_lag,
  flush_lag,
  replay_lag
FROM pg_stat_replication;

-- Check replication lag
SELECT 
  application_name,
  state,
  pg_wal_lsn_diff(pg_current_wal_lsn(), sent_lsn) AS sent_lag_bytes,
  pg_wal_lsn_diff(pg_current_wal_lsn(), write_lsn) AS write_lag_bytes,
  pg_wal_lsn_diff(pg_current_wal_lsn(), flush_lsn) AS flush_lag_bytes,
  pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn) AS replay_lag_bytes,
  write_lag,
  flush_lag,
  replay_lag
FROM pg_stat_replication;

-- On STANDBY: Check replication status
SELECT 
  pg_is_in_recovery() AS in_recovery,
  pg_last_wal_receive_lsn() AS receive_lsn,
  pg_last_wal_replay_lsn() AS replay_lsn,
  pg_last_wal_replay_lsn() - pg_last_wal_receive_lsn() AS lag_bytes;

-- Check WAL receiver
SELECT 
  pid,
  status,
  receive_start_lsn,
  received_lsn,
  last_msg_send_time,
  last_msg_receipt_time,
  latest_end_lsn,
  slot_name
FROM pg_stat_wal_receiver;

-- Check replication slots
SELECT 
  slot_name,
  slot_type,
  database,
  active,
  restart_lsn,
  confirmed_flush_lsn,
  pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) AS lag_size
FROM pg_replication_slots;

-- View replication statistics
SELECT 
  * 
FROM pg_stat_replication
WHERE application_name = 'standby1';`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Promoting Standby</h2>

          <CodeBlock
            title="SQL: Promoting Standby to Primary"
            language="sql"
            code={`-- Promote standby to primary (PostgreSQL 12+)
-- pg_ctl promote -D /var/lib/postgresql/data

-- Or using SQL (PostgreSQL 12+)
SELECT pg_promote();

-- Or create trigger file
-- touch /var/lib/postgresql/data/promote.signal

-- Check if promotion was successful
SELECT pg_is_in_recovery();
-- Returns false after promotion

-- After promotion, update other standbys to point to new primary
-- Edit postgresql.conf on other standbys:
-- primary_conninfo = 'host=new_primary_host port=5432 user=replica_user password=secure_password'

-- Restart standby servers to connect to new primary

-- Verify new primary
SELECT 
  pg_is_in_recovery() AS in_recovery,
  pg_current_wal_lsn() AS current_lsn;

-- Check replication from new primary
SELECT 
  pid,
  application_name,
  state,
  sent_lsn,
  replay_lsn
FROM pg_stat_replication;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Prisma: Streaming Replication</h2>

          <CodeBlock
            title="Prisma: Replication Monitoring"
            language="prisma"
            code={`// Prisma can connect to both primary and standby servers
// Use different connection strings for read/write splitting

// Primary connection (read/write)
const primaryPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.PRIMARY_DATABASE_URL
    }
  }
});

// Standby connection (read-only)
const standbyPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.STANDBY_DATABASE_URL
  }
  }
});

// Check replication status on primary
async function checkReplicationStatus() {
  const status = await primaryPrisma.$queryRaw\`
    SELECT 
      pid,
      application_name,
      state,
      sync_state,
      sent_lsn,
      replay_lsn,
      pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn) AS lag_bytes
    FROM pg_stat_replication
  \`;
  
  return status;
}

// Check if server is in recovery (standby)
async function checkRecoveryStatus() {
  const result = await standbyPrisma.$queryRaw\`
    SELECT pg_is_in_recovery() AS in_recovery
  \`;
  
  return result[0].in_recovery;
}

// Check replication lag
async function checkReplicationLag() {
  const lag = await standbyPrisma.$queryRaw\`
    SELECT 
      pg_last_wal_receive_lsn() AS receive_lsn,
      pg_last_wal_replay_lsn() AS replay_lsn,
      pg_last_wal_replay_lsn() - pg_last_wal_receive_lsn() AS lag_bytes,
      EXTRACT(EPOCH FROM (NOW() - pg_last_xact_replay_timestamp())) AS lag_seconds
  \`;
  
  return lag;
}

// Read from standby (read scaling)
async function readFromStandby() {
  // Use standby connection for read queries
  const users = await standbyPrisma.user.findMany({
    where: { status: 'active' }
  });
  
  return users;
}

// Write to primary
async function writeToPrimary() {
  // Use primary connection for write queries
  const user = await primaryPrisma.user.create({
    data: {
      name: 'John Doe',
      email: 'john@example.com'
    }
  });
  
  return user;
}

// Monitor replication slots
async function monitorReplicationSlots() {
  const slots = await primaryPrisma.$queryRaw\`
    SELECT 
      slot_name,
      slot_type,
      active,
      restart_lsn,
      pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) AS lag_size
    FROM pg_replication_slots
  \`;
  
  return slots;
}

// Note: Replication setup is done at database/server level
// Prisma can only monitor and use replication, not configure it`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Use replication slots</strong> - prevent WAL deletion before replication</li>
              <li><strong>Monitor replication lag</strong> - ensure standbys stay current</li>
              <li><strong>Use synchronous replication</strong> - for critical data consistency</li>
              <li><strong>Test failover procedures</strong> - regularly practice promotion</li>
              <li><strong>Use multiple standbys</strong> - for high availability</li>
              <li><strong>Monitor disk space</strong> - replication slots prevent WAL cleanup</li>
              <li><strong>Use read scaling</strong> - route read queries to standbys</li>
              <li><strong>Document procedures</strong> - maintain clear failover documentation</li>
              <li><strong>Set up alerts</strong> - monitor replication health</li>
            </ul>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}


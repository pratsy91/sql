import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Replication Slots - PostgreSQL Learning',
  description: 'Learn about PostgreSQL replication slots including physical and logical replication slots',
};

export default function ReplicationSlots() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Replication Slots</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">What are Replication Slots?</h2>
          <p className="mb-4">
            Replication slots provide an automatic way to ensure that WAL files are not removed 
            before they are consumed by a standby server or logical replication subscriber. 
            They prevent WAL deletion and provide a safe way to manage replication without 
            manual WAL retention configuration.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Physical Replication Slots</h2>

          <CodeBlock
            title="SQL: Physical Replication Slots"
            language="sql"
            code={`-- Create physical replication slot
SELECT pg_create_physical_replication_slot('standby_slot');

-- Create physical replication slot with immediately_reserve option
SELECT pg_create_physical_replication_slot('standby_slot', true, true);
-- Parameters: slot_name, immediately_reserve, temporary

-- View all replication slots
SELECT 
  slot_name,
  slot_type,
  database,
  active,
  restart_lsn,
  confirmed_flush_lsn
FROM pg_replication_slots;

-- View slot details
SELECT 
  slot_name,
  slot_type,
  active,
  restart_lsn,
  confirmed_flush_lsn,
  pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) AS lag_size
FROM pg_replication_slots
WHERE slot_type = 'physical';

-- Check if slot is active
SELECT 
  slot_name,
  active,
  active_pid
FROM pg_replication_slots
WHERE slot_name = 'standby_slot';

-- Use slot in streaming replication
-- On standby, configure primary_conninfo:
-- primary_slot_name = 'standby_slot'

-- Drop physical replication slot
SELECT pg_drop_replication_slot('standby_slot');

-- View slot statistics
SELECT 
  slot_name,
  slot_type,
  active,
  pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) AS lag_size,
  pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), confirmed_flush_lsn)) AS confirmed_lag_size
FROM pg_replication_slots
WHERE slot_type = 'physical';

-- Monitor slot lag
SELECT 
  slot_name,
  pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn) AS lag_bytes,
  pg_wal_lsn_diff(pg_current_wal_lsn(), confirmed_flush_lsn) AS confirmed_lag_bytes
FROM pg_replication_slots
WHERE slot_type = 'physical'
  AND active = true;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Logical Replication Slots</h2>

          <CodeBlock
            title="SQL: Logical Replication Slots"
            language="sql"
            code={`-- Create logical replication slot
SELECT pg_create_logical_replication_slot('logical_slot', 'pgoutput');
-- 'pgoutput' is the output plugin (built-in)

-- Create logical replication slot with two-phase commit
SELECT pg_create_logical_replication_slot('logical_slot', 'pgoutput', true);
-- Third parameter: two_phase (enables two-phase commit)

-- View logical replication slots
SELECT 
  slot_name,
  slot_type,
  database,
  active,
  restart_lsn,
  confirmed_flush_lsn,
  plugin
FROM pg_replication_slots
WHERE slot_type = 'logical';

-- Logical slots are created automatically with subscriptions
-- CREATE SUBSCRIPTION creates a logical replication slot

-- View slot plugin
SELECT 
  slot_name,
  plugin
FROM pg_replication_slots
WHERE slot_type = 'logical';

-- Available output plugins:
-- pgoutput: Built-in plugin (default)
-- test_decoding: For testing
-- wal2json: External plugin (requires installation)

-- Drop logical replication slot
SELECT pg_drop_replication_slot('logical_slot');

-- View slot lag for logical replication
SELECT 
  slot_name,
  database,
  active,
  pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) AS lag_size,
  pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), confirmed_flush_lsn)) AS confirmed_lag_size
FROM pg_replication_slots
WHERE slot_type = 'logical';`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Slot Management</h2>

          <CodeBlock
            title="SQL: Managing Replication Slots"
            language="sql"
            code={`-- View all slots with details
SELECT 
  slot_name,
  slot_type,
  database,
  active,
  active_pid,
  restart_lsn,
  confirmed_flush_lsn,
  pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) AS lag_size
FROM pg_replication_slots
ORDER BY slot_type, slot_name;

-- Find inactive slots
SELECT 
  slot_name,
  slot_type,
  active,
  pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) AS lag_size
FROM pg_replication_slots
WHERE active = false;

-- Find slots with large lag
SELECT 
  slot_name,
  slot_type,
  active,
  pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn) AS lag_bytes,
  pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) AS lag_size
FROM pg_replication_slots
WHERE pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn) > 1073741824  -- 1GB
ORDER BY lag_bytes DESC;

-- Check slot activity
SELECT 
  slot_name,
  active,
  active_pid,
  pg_stat_activity.state,
  pg_stat_activity.query
FROM pg_replication_slots
LEFT JOIN pg_stat_activity ON pg_replication_slots.active_pid = pg_stat_activity.pid
WHERE slot_name = 'standby_slot';

-- Monitor slot retention
SELECT 
  slot_name,
  slot_type,
  pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) AS retained_wal_size
FROM pg_replication_slots;

-- Calculate total WAL retention
SELECT 
  pg_size_pretty(SUM(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn))) AS total_retained_wal
FROM pg_replication_slots;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Slot Safety</h2>

          <CodeBlock
            title="SQL: Slot Safety and Monitoring"
            language="sql"
            code={`-- IMPORTANT: Inactive slots prevent WAL cleanup
-- Monitor inactive slots and drop them if not needed

-- Find inactive slots preventing WAL cleanup
SELECT 
  slot_name,
  slot_type,
  active,
  pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) AS retained_wal_size
FROM pg_replication_slots
WHERE active = false;

-- Drop inactive slot (if safe to do so)
SELECT pg_drop_replication_slot('inactive_slot');

-- Check max_slot_wal_keep_size setting
SHOW max_slot_wal_keep_size;
-- Limits WAL retention for slots (PostgreSQL 13+)
-- Prevents unlimited WAL growth from inactive slots

-- Set max_slot_wal_keep_size
-- In postgresql.conf:
-- max_slot_wal_keep_size = 10GB
-- WAL older than this can be removed even if slot needs it

-- Monitor WAL disk usage
SELECT 
  pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), '0/0')) AS total_wal_size;

-- Check WAL directory size
-- du -sh /var/lib/postgresql/data/pg_wal/

-- Set up alerts for:
-- 1. Inactive slots
-- 2. Large slot lag
-- 3. High WAL disk usage

-- View slot creation time (if available)
SELECT 
  slot_name,
  slot_type,
  active,
  pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) AS lag_size
FROM pg_replication_slots
ORDER BY slot_name;

-- Check for orphaned slots
-- Slots that are no longer used by any replication
SELECT 
  slot_name,
  slot_type,
  active,
  active_pid
FROM pg_replication_slots
WHERE active = false
  AND slot_name NOT IN (
    SELECT subslotname FROM pg_subscription
    UNION
    SELECT 'standby_slot'  -- Add known active slots
  );`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Prisma: Replication Slots</h2>

          <CodeBlock
            title="Prisma: Slot Management"
            language="prisma"
            code={`// Prisma doesn't have direct slot management
// Use raw SQL for slot operations

// Create physical replication slot
await prisma.$executeRaw\`
  SELECT pg_create_physical_replication_slot($1)
\`, 'standby_slot';

// Create logical replication slot
await prisma.$executeRaw\`
  SELECT pg_create_logical_replication_slot($1, $2)
\`, 'logical_slot', 'pgoutput';

// View all slots
const slots = await prisma.$queryRaw\`
  SELECT 
    slot_name,
    slot_type,
    database,
    active,
    restart_lsn,
    confirmed_flush_lsn
  FROM pg_replication_slots
  ORDER BY slot_type, slot_name
\`;

// Monitor slot lag
const slotLag = await prisma.$queryRaw\`
  SELECT 
    slot_name,
    slot_type,
    active,
    pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn) AS lag_bytes,
    pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) AS lag_size
  FROM pg_replication_slots
\`;

// Find inactive slots
const inactiveSlots = await prisma.$queryRaw\`
  SELECT 
    slot_name,
    slot_type,
    pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) AS retained_wal_size
  FROM pg_replication_slots
  WHERE active = false
\`;

// Drop slot
await prisma.$executeRaw\`
  SELECT pg_drop_replication_slot($1)
\`, 'inactive_slot';

// Check slot activity
const slotActivity = await prisma.$queryRaw\`
  SELECT 
    slot_name,
    active,
    active_pid,
    pg_stat_activity.state
  FROM pg_replication_slots
  LEFT JOIN pg_stat_activity ON pg_replication_slots.active_pid = pg_stat_activity.pid
  WHERE slot_name = $1
\`, 'standby_slot';

// Monitor total WAL retention
const totalRetention = await prisma.$queryRaw\`
  SELECT 
    pg_size_pretty(SUM(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn))) AS total_retained_wal
  FROM pg_replication_slots
\`;

// Check max_slot_wal_keep_size
const maxSlotWalKeepSize = await prisma.$queryRaw\`
  SELECT setting, unit
  FROM pg_settings
  WHERE name = 'max_slot_wal_keep_size'
\`;

// Note: Slots are critical for replication
// Only drop slots if you're certain they're not needed
// Inactive slots prevent WAL cleanup and can fill disk`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Use replication slots</strong> - prevent WAL deletion automatically</li>
              <li><strong>Monitor inactive slots</strong> - they prevent WAL cleanup</li>
              <li><strong>Drop unused slots</strong> - free up WAL space</li>
              <li><strong>Set max_slot_wal_keep_size</strong> - prevent unlimited WAL growth</li>
              <li><strong>Monitor slot lag</strong> - ensure replication is working</li>
              <li><strong>Monitor WAL disk usage</strong> - slots can cause WAL accumulation</li>
              <li><strong>Use descriptive slot names</strong> - identify slot purpose</li>
              <li><strong>Document slot usage</strong> - track which slots are needed</li>
              <li><strong>Set up alerts</strong> - monitor slot health and WAL usage</li>
            </ul>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}


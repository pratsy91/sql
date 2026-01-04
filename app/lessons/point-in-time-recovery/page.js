import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Point-in-Time Recovery (PITR) - PostgreSQL Learning',
  description: 'Learn about PostgreSQL Point-in-Time Recovery including WAL archiving and recovery configuration',
};

export default function PointInTimeRecovery() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Point-in-Time Recovery (PITR)</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">What is Point-in-Time Recovery?</h2>
          <p className="mb-4">
            Point-in-Time Recovery (PITR) allows you to restore a database to any point in time 
            between a base backup and the present. It requires WAL (Write-Ahead Log) archiving 
            to be enabled. PITR is essential for recovering from data corruption or accidental deletions.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">WAL Archiving Setup</h2>

          <CodeBlock
            title="SQL: WAL Archiving Configuration"
            language="sql"
            code={`-- Enable WAL archiving in postgresql.conf
-- wal_level = replica (or logical for logical replication)
-- archive_mode = on
-- archive_command = 'cp %p /path/to/archive/%f'
-- Or for remote storage:
-- archive_command = 'scp %p user@server:/archive/%f'

-- Check WAL archiving status
SELECT 
  name,
  setting,
  unit,
  context
FROM pg_settings
WHERE name LIKE 'archive%'
ORDER BY name;

-- Check if archiving is enabled
SHOW archive_mode;
SHOW archive_command;

-- View archive statistics
SELECT 
  archived_count,
  last_archived_wal,
  last_archived_time,
  failed_count,
  last_failed_wal,
  last_failed_time
FROM pg_stat_archiver;

-- Test archive command
-- Manually trigger archive (as superuser)
SELECT pg_switch_wal();

-- Check archived WAL files
-- ls -l /path/to/archive/

-- Archive command examples:
-- Local filesystem:
-- archive_command = 'test ! -f /archive/%f && cp %p /archive/%f'

-- With compression:
-- archive_command = 'test ! -f /archive/%f && gzip < %p > /archive/%f.gz'

-- With S3:
-- archive_command = 'aws s3 cp %p s3://bucket/archive/%f'

-- With rsync:
-- archive_command = 'rsync %p user@server:/archive/%f'`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Base Backup</h2>

          <CodeBlock
            title="SQL: Creating Base Backups"
            language="sql"
            code={`-- Create base backup using pg_basebackup
-- pg_basebackup -D /backup/base -Ft -z -P

-- Base backup with specific format
-- pg_basebackup -D /backup/base -Fp -z -P
-- -Fp: plain format (default)
-- -Ft: tar format
-- -z: compress
-- -P: show progress

-- Base backup with label
-- pg_basebackup -D /backup/base -l "Backup $(date +%Y%m%d_%H%M%S)"

-- Base backup with checkpoint
-- pg_basebackup -D /backup/base -c fast

-- Base backup with WAL streaming
-- pg_basebackup -D /backup/base -X stream

-- Base backup with specific tablespace
-- pg_basebackup -D /backup/base -T /old/tablespace=/new/tablespace

-- Base backup with verification
-- pg_basebackup -D /backup/base -v

-- Base backup schedule (recommended: daily)
-- 0 2 * * * pg_basebackup -D /backup/base -Ft -z -P

-- Check backup label
-- cat /backup/base/backup_label

-- Backup label contains:
-- - Backup start time
-- - WAL start location
-- - Checkpoint location`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Recovery Configuration</h2>

          <CodeBlock
            title="SQL: Recovery Configuration Files"
            language="sql"
            code={`-- Create recovery.conf (PostgreSQL 12+) or use postgresql.auto.conf
-- For PostgreSQL 12+, use recovery.signal file and postgresql.conf settings

-- Recovery configuration (postgresql.conf or postgresql.auto.conf):
-- restore_command = 'cp /archive/%f %p'
-- recovery_target_time = '2024-01-15 14:30:00'
-- recovery_target_action = 'promote'

-- Recovery target options:
-- recovery_target_time = '2024-01-15 14:30:00'  -- Specific timestamp
-- recovery_target_xid = '12345'  -- Specific transaction ID
-- recovery_target_lsn = '0/12345678'  -- Specific LSN
-- recovery_target_name = 'my_recovery_point'  -- Named recovery point
-- recovery_target = 'immediate'  -- Stop as soon as consistent

-- Recovery action options:
-- recovery_target_action = 'promote'  -- Promote server when target reached
-- recovery_target_action = 'pause'  -- Pause and wait for command
-- recovery_target_action = 'shutdown'  -- Shutdown when target reached

-- Recovery command examples:
-- Local filesystem:
-- restore_command = 'cp /archive/%f %p'

-- With decompression:
-- restore_command = 'gunzip < /archive/%f.gz > %p'

-- With S3:
-- restore_command = 'aws s3 cp s3://bucket/archive/%f %p'

-- With rsync:
-- restore_command = 'rsync user@server:/archive/%f %p'

-- Create recovery.signal file (PostgreSQL 12+)
-- touch /var/lib/postgresql/data/recovery.signal

-- Or use pg_ctl to start in recovery mode
-- pg_ctl start -D /var/lib/postgresql/data -o "-c recovery=on"`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Performing PITR</h2>

          <CodeBlock
            title="SQL: PITR Recovery Process"
            language="sql"
            code={`-- Step 1: Stop PostgreSQL
-- pg_ctl stop -D /var/lib/postgresql/data

-- Step 2: Restore base backup
-- rm -rf /var/lib/postgresql/data/*
-- tar -xzf /backup/base/base.tar.gz -C /var/lib/postgresql/data/
-- Or: cp -r /backup/base/* /var/lib/postgresql/data/

-- Step 3: Configure recovery
-- Edit postgresql.conf or create postgresql.auto.conf:
-- restore_command = 'cp /archive/%f %p'
-- recovery_target_time = '2024-01-15 14:30:00'
-- recovery_target_action = 'promote'

-- Step 4: Create recovery.signal (PostgreSQL 12+)
-- touch /var/lib/postgresql/data/recovery.signal

-- Step 5: Start PostgreSQL
-- pg_ctl start -D /var/lib/postgresql/data

-- PostgreSQL will:
-- 1. Replay WAL files from archive
-- 2. Stop at recovery_target_time
-- 3. Promote server (if recovery_target_action = 'promote')

-- Check recovery progress
-- tail -f /var/lib/postgresql/data/log/postgresql.log

-- Monitor recovery
SELECT 
  pg_is_in_recovery(),
  pg_last_wal_replay_lsn(),
  pg_last_wal_replay_lsn() - pg_current_wal_lsn() AS lag_bytes;

-- Promote server manually (if paused)
SELECT pg_wal_replay_resume();

-- Check if recovery is complete
SELECT pg_is_in_recovery();
-- Returns false when recovery is complete`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Recovery Points</h2>

          <CodeBlock
            title="SQL: Recovery Point Management"
            language="sql"
            code={`-- Create named recovery point
SELECT pg_create_restore_point('before_major_update');

-- List recovery points
SELECT 
  name,
  lsn,
  time
FROM pg_restore_points
ORDER BY time DESC;

-- Use named recovery point
-- recovery_target_name = 'before_major_update'
-- recovery_target_action = 'promote'

-- Recovery to specific transaction
-- recovery_target_xid = '12345'
-- recovery_target_action = 'promote'

-- Recovery to specific LSN
-- recovery_target_lsn = '0/12345678'
-- recovery_target_action = 'promote'

-- Recovery to immediate (as soon as consistent)
-- recovery_target = 'immediate'
-- recovery_target_action = 'promote'

-- Recovery with timeline
-- recovery_target_timeline = 'latest'
-- Or specific timeline: recovery_target_timeline = '2'

-- Check current timeline
SELECT pg_current_wal_lsn();
SELECT pg_wal_lsn_diff(pg_current_wal_lsn(), '0/0');

-- View timeline history
-- cat /archive/timeline_history`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Prisma: Point-in-Time Recovery</h2>

          <CodeBlock
            title="Prisma: PITR Operations"
            language="prisma"
            code={`// Prisma doesn't have direct PITR support
// PITR is performed at database/server level
// Use command-line tools or scripts

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Create base backup
async function createBaseBackup() {
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const backupDir = \`/backup/base_\${timestamp}\`;
  
  await execAsync(
    \`pg_basebackup -D \${backupDir} -Ft -z -P -l "Backup \${timestamp}"\`
  );
  
  return backupDir;
}

// Check WAL archiving status
async function checkArchivingStatus() {
  const result = await prisma.$queryRaw\`
    SELECT 
      archived_count,
      last_archived_wal,
      last_archived_time,
      failed_count,
      last_failed_wal,
      last_failed_time
    FROM pg_stat_archiver
  \`;
  
  return result;
}

// Create restore point
async function createRestorePoint(name) {
  await prisma.$executeRaw\`
    SELECT pg_create_restore_point($1)
  \`, name;
}

// List restore points
async function listRestorePoints() {
  const points = await prisma.$queryRaw\`
    SELECT 
      name,
      lsn,
      time
    FROM pg_restore_points
    ORDER BY time DESC
  \`;
  
  return points;
}

// Check if in recovery
async function checkRecoveryStatus() {
  const result = await prisma.$queryRaw\`
    SELECT pg_is_in_recovery() AS in_recovery
  \`;
  
  return result[0].in_recovery;
}

// Note: Actual PITR recovery requires:
// 1. Stopping PostgreSQL
// 2. Restoring base backup
// 3. Configuring recovery parameters
// 4. Starting PostgreSQL
// These operations are typically done via scripts or manual intervention

// Monitor recovery progress (when in recovery)
async function monitorRecovery() {
  const status = await prisma.$queryRaw\`
    SELECT 
      pg_is_in_recovery() AS in_recovery,
      pg_last_wal_replay_lsn() AS last_replay_lsn
  \`;
  
  return status;
}`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Enable WAL archiving</strong> - required for PITR</li>
              <li><strong>Create regular base backups</strong> - daily or more frequent</li>
              <li><strong>Test PITR regularly</strong> - verify recovery procedures work</li>
              <li><strong>Monitor archive status</strong> - ensure WAL files are being archived</li>
              <li><strong>Store archives off-site</strong> - protect against site failures</li>
              <li><strong>Use named restore points</strong> - before major operations</li>
              <li><strong>Document recovery procedures</strong> - maintain clear documentation</li>
              <li><strong>Monitor archive disk space</strong> - WAL files accumulate</li>
              <li><strong>Use compression</strong> - reduce storage requirements</li>
            </ul>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}


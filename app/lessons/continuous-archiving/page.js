import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Continuous Archiving - PostgreSQL Learning',
  description: 'Learn about PostgreSQL continuous archiving including WAL archiving setup and configuration',
};

export default function ContinuousArchiving() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Continuous Archiving</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">What is Continuous Archiving?</h2>
          <p className="mb-4">
            Continuous archiving is the process of automatically archiving WAL (Write-Ahead Log) 
            files as they are created. This enables Point-in-Time Recovery and ensures that all 
            database changes are preserved. WAL files contain all changes made to the database.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">WAL Archiving Setup</h2>

          <CodeBlock
            title="SQL: Configuring WAL Archiving"
            language="sql"
            code={`-- Enable WAL archiving in postgresql.conf
-- wal_level = replica
-- archive_mode = on
-- archive_command = 'cp %p /archive/%f'

-- Required settings:
-- wal_level: Must be 'replica' or 'logical' (not 'minimal')
-- archive_mode: Must be 'on'
-- archive_command: Command to archive WAL files

-- Check current settings
SHOW wal_level;
SHOW archive_mode;
SHOW archive_command;

-- View all archive settings
SELECT 
  name,
  setting,
  unit,
  context,
  source
FROM pg_settings
WHERE name LIKE 'archive%' OR name = 'wal_level'
ORDER BY name;

-- Archive command variables:
-- %p: Path of WAL file to archive
-- %f: Filename of WAL file (without path)

-- Example archive commands:

-- Local filesystem:
-- archive_command = 'test ! -f /archive/%f && cp %p /archive/%f'

-- With compression:
-- archive_command = 'test ! -f /archive/%f.gz && gzip < %p > /archive/%f.gz'

-- With error handling:
-- archive_command = 'test ! -f /archive/%f && cp %p /archive/%f || exit 1'

-- Remote copy with SSH:
-- archive_command = 'test ! -f /archive/%f && scp %p user@server:/archive/%f'

-- With S3:
-- archive_command = 'aws s3 cp %p s3://bucket/archive/%f'

-- With rsync:
-- archive_command = 'rsync -a %p user@server:/archive/%f'`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Archive Command Best Practices</h2>

          <CodeBlock
            title="SQL: Archive Command Patterns"
            language="sql"
            code={`-- Safe archive command (checks if file exists)
-- archive_command = 'test ! -f /archive/%f && cp %p /archive/%f'

-- Archive command with logging
-- archive_command = 'test ! -f /archive/%f && cp %p /archive/%f && logger "Archived %f"'

-- Archive command with error handling
-- archive_command = 'test ! -f /archive/%f && cp %p /archive/%f || (logger "Archive failed %f" && exit 1)'

-- Archive command with compression
-- archive_command = 'test ! -f /archive/%f.gz && gzip < %p > /archive/%f.gz'

-- Archive command with remote backup
-- archive_command = 'test ! -f /archive/%f && cp %p /archive/%f && scp %p user@backup:/archive/%f'

-- Archive command with S3 (using AWS CLI)
-- archive_command = 'aws s3 cp %p s3://my-bucket/wal-archive/%f --storage-class STANDARD_IA'

-- Archive command with retention
-- archive_command = 'test ! -f /archive/%f && cp %p /archive/%f && find /archive -name "*.gz" -mtime +30 -delete'

-- Archive command script (recommended for complex logic)
-- archive_command = '/usr/local/bin/archive_wal.sh %p %f'

-- Script example (archive_wal.sh):
-- #!/bin/bash
-- WAL_PATH=$1
-- WAL_FILE=$2
-- ARCHIVE_DIR=/archive
-- 
-- if [ ! -f "$ARCHIVE_DIR/$WAL_FILE" ]; then
--   cp "$WAL_PATH" "$ARCHIVE_DIR/$WAL_FILE"
--   gzip "$ARCHIVE_DIR/$WAL_FILE"
--   aws s3 cp "$ARCHIVE_DIR/$WAL_FILE.gz" "s3://bucket/archive/$WAL_FILE.gz"
--   exit 0
-- else
--   exit 1
-- fi`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Monitoring Archiving</h2>

          <CodeBlock
            title="SQL: Monitoring Archive Status"
            language="sql"
            code={`-- View archive statistics
SELECT 
  archived_count,
  last_archived_wal,
  last_archived_time,
  failed_count,
  last_failed_wal,
  last_failed_time,
  stats_reset
FROM pg_stat_archiver;

-- Check if archiving is working
SELECT 
  CASE 
    WHEN last_archived_time IS NULL THEN 'Never archived'
    WHEN last_archived_time > NOW() - INTERVAL '5 minutes' THEN 'Archiving active'
    ELSE 'Archiving may be stuck'
  END AS archive_status,
  last_archived_wal,
  last_archived_time,
  failed_count
FROM pg_stat_archiver;

-- Check for archive failures
SELECT 
  failed_count,
  last_failed_wal,
  last_failed_time
FROM pg_stat_archiver
WHERE failed_count > 0;

-- View current WAL file
SELECT pg_current_wal_lsn();
SELECT pg_current_wal_insert_lsn();

-- Check WAL file size
SELECT 
  pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), '0/0')) AS wal_size;

-- List WAL files in archive directory
-- ls -lh /archive/

-- Check archive directory size
-- du -sh /archive/

-- View PostgreSQL logs for archive messages
-- grep archive /var/lib/postgresql/data/log/postgresql.log

-- Test archive command manually
SELECT pg_switch_wal();
-- This forces a WAL switch and triggers archive_command

-- Check if WAL was archived
SELECT 
  last_archived_wal,
  last_archived_time
FROM pg_stat_archiver;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Archive Retention</h2>

          <CodeBlock
            title="SQL: Managing Archive Retention"
            language="sql"
            code={`-- Archive retention is managed by:
-- 1. Disk space availability
-- 2. Manual cleanup scripts
-- 3. Archive command logic

-- Calculate required archive space
-- Each WAL file is typically 16MB
-- Retention period * WAL files per day * 16MB

-- Example: 30 days retention, 100 WAL files/day
-- 30 * 100 * 16MB = 48GB

-- Cleanup old archives (manual script)
-- find /archive -name "*.gz" -mtime +30 -delete

-- Cleanup script with safety checks
-- #!/bin/bash
-- ARCHIVE_DIR=/archive
-- RETENTION_DAYS=30
-- 
-- # Keep at least last 7 days regardless
-- find "$ARCHIVE_DIR" -name "*.gz" -mtime +$RETENTION_DAYS -delete
-- 
-- # Ensure we have at least one base backup's worth of WALs
-- # (Don't delete WALs needed for oldest base backup)

-- Archive to multiple locations
-- archive_command = 'cp %p /archive1/%f && cp %p /archive2/%f'

-- Archive with compression to save space
-- archive_command = 'gzip < %p > /archive/%f.gz'

-- Archive to cloud storage (S3, GCS, etc.)
-- archive_command = 'aws s3 cp %p s3://bucket/archive/%f'

-- Archive with lifecycle policies (cloud storage)
-- Use S3 lifecycle policies to move to Glacier after 30 days
-- Use S3 lifecycle policies to delete after 90 days

-- Monitor archive disk usage
-- df -h /archive
-- du -sh /archive/*

-- Set up alerts for low disk space
-- Alert when archive directory is > 80% full`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Archive Validation</h2>

          <CodeBlock
            title="SQL: Validating Archives"
            language="sql"
            code={`-- Verify archive integrity
-- Use pg_verifybackup (PostgreSQL 13+) to verify base backups
-- pg_verifybackup /backup/base

-- Check WAL file integrity
-- Use pg_waldump to inspect WAL files
-- pg_waldump /archive/000000010000000000000001

-- Verify archive completeness
-- Check for gaps in WAL sequence
-- ls /archive/ | sort

-- Test restore from archive
-- Periodically test restoring from archives to verify they work

-- Monitor archive command success rate
SELECT 
  archived_count,
  failed_count,
  ROUND(failed_count * 100.0 / NULLIF(archived_count + failed_count, 0), 2) AS failure_rate
FROM pg_stat_archiver;

-- Check archive timing
SELECT 
  last_archived_time,
  NOW() - last_archived_time AS time_since_last_archive
FROM pg_stat_archiver;

-- Verify archive command is executable
-- Test archive command manually:
-- test ! -f /archive/test && cp /path/to/wal /archive/test

-- Check archive permissions
-- ls -la /archive/
-- Ensure PostgreSQL user can write to archive directory

-- Monitor archive disk I/O
-- Use iostat or similar tools to monitor archive disk performance`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Prisma: Continuous Archiving</h2>

          <CodeBlock
            title="Prisma: Archive Management"
            language="prisma"
            code={`// Prisma doesn't have direct archive management
// Use SQL queries and command-line tools

// Check archive status
async function checkArchiveStatus() {
  const status = await prisma.$queryRaw\`
    SELECT 
      archived_count,
      last_archived_wal,
      last_archived_time,
      failed_count,
      last_failed_wal,
      last_failed_time
    FROM pg_stat_archiver
  \`;
  
  return status;
}

// Check archive configuration
async function checkArchiveConfig() {
  const config = await prisma.$queryRaw\`
    SELECT 
      name,
      setting,
      context
    FROM pg_settings
    WHERE name IN ('wal_level', 'archive_mode', 'archive_command')
    ORDER BY name
  \`;
  
  return config;
}

// Force WAL switch (triggers archive)
async function switchWal() {
  await prisma.$executeRaw\`SELECT pg_switch_wal()\`;
}

// Check current WAL location
async function getCurrentWalLsn() {
  const result = await prisma.$queryRaw\`
    SELECT pg_current_wal_lsn() AS current_lsn
  \`;
  
  return result[0].current_lsn;
}

// Monitor archive health
async function monitorArchiveHealth() {
  const health = await prisma.$queryRaw\`
    SELECT 
      archived_count,
      failed_count,
      CASE 
        WHEN last_archived_time IS NULL THEN 'Never archived'
        WHEN last_archived_time > NOW() - INTERVAL '5 minutes' THEN 'Healthy'
        ELSE 'Stale'
      END AS status,
      last_archived_time,
      NOW() - last_archived_time AS time_since_archive
    FROM pg_stat_archiver
  \`;
  
  return health;
}

// Check for archive failures
async function checkArchiveFailures() {
  const failures = await prisma.$queryRaw\`
    SELECT 
      failed_count,
      last_failed_wal,
      last_failed_time
    FROM pg_stat_archiver
    WHERE failed_count > 0
  \`;
  
  return failures;
}

// Note: Archive configuration is done in postgresql.conf
// Prisma can only monitor, not configure archiving

// Use command-line tools for archive management:
// - pg_basebackup for base backups
// - pg_verifybackup for backup verification
// - Custom scripts for archive cleanup`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Enable WAL archiving</strong> - required for PITR</li>
              <li><strong>Test archive command</strong> - verify it works correctly</li>
              <li><strong>Monitor archive status</strong> - check pg_stat_archiver regularly</li>
              <li><strong>Handle archive failures</strong> - set up alerts for failures</li>
              <li><strong>Store archives off-site</strong> - protect against site failures</li>
              <li><strong>Use compression</strong> - reduce storage requirements</li>
              <li><strong>Implement retention policy</strong> - clean up old archives</li>
              <li><strong>Monitor disk space</strong> - archives can grow large</li>
              <li><strong>Test restore procedures</strong> - verify archives are usable</li>
              <li><strong>Use cloud storage</strong> - S3, GCS for reliable archiving</li>
            </ul>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}


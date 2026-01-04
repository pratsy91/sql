import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Logging - PostgreSQL Learning',
  description: 'Learn about PostgreSQL logging configuration and log analysis',
};

export default function Logging() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Logging</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Logging Configuration</h2>

          <CodeBlock
            title="SQL: Logging Configuration (postgresql.conf)"
            language="sql"
            code={`-- Logging configuration in postgresql.conf

-- Basic logging
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_rotation_age = 1d
log_rotation_size = 100MB
log_truncate_on_rotation = on

-- What to log
log_destination = 'stderr'  -- or 'csvlog', 'syslog'
log_min_messages = warning  -- debug5, debug4, debug3, debug2, debug1, info, notice, warning, error, log, fatal, panic

-- Connection logging
log_connections = on
log_disconnections = on
log_duration = on
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '

-- Query logging
log_statement = 'all'  -- 'none', 'ddl', 'mod', 'all'
log_min_duration_statement = 1000  -- Log queries taking more than 1 second (in milliseconds)

-- Error logging
log_error_verbosity = default  -- 'terse', 'default', 'verbose'
log_min_error_statement = error
log_min_error_statement_statement = error

-- Lock logging
log_lock_waits = on
deadlock_timeout = 1s

-- Checkpoint logging
log_checkpoints = on

-- Autovacuum logging
log_autovacuum_min_duration = 0  -- Log all autovacuum operations

-- Slow query logging
log_min_duration_statement = 1000  -- Log queries > 1 second

-- Statement statistics
track_io_timing = on
track_functions = all  -- 'none', 'pl', 'all'
track_activity_query_size = 1024

-- CSV logging (structured logs)
logging_collector = on
log_destination = 'csvlog'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_rotation_age = 1d
log_rotation_size = 100MB

-- Reload configuration
SELECT pg_reload_conf();`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Log Analysis</h2>

          <CodeBlock
            title="SQL: Analyzing Logs"
            language="sql"
            code={`-- PostgreSQL logs can be analyzed using SQL
-- First, load logs into a table (if using CSV logging)

-- Create log table (if using CSV logging)
CREATE TABLE postgres_log (
  log_time timestamp(3) with time zone,
  user_name text,
  database_name text,
  process_id integer,
  connection_from text,
  session_id text,
  session_line_num bigint,
  command_tag text,
  session_start_time timestamp with time zone,
  virtual_transaction_id text,
  transaction_id bigint,
  error_severity text,
  sql_state_code text,
  message text,
  detail text,
  hint text,
  internal_query text,
  internal_query_pos integer,
  context text,
  query text,
  query_pos integer,
  location text,
  application_name text
);

-- Load CSV log into table
COPY postgres_log FROM '/path/to/postgresql-*.csv' WITH CSV;

-- Analyze slow queries
SELECT 
  log_time,
  user_name,
  database_name,
  duration,
  query
FROM postgres_log
WHERE command_tag = 'SELECT'
  AND duration > interval '1 second'
ORDER BY duration DESC
LIMIT 20;

-- Analyze errors
SELECT 
  log_time,
  error_severity,
  sql_state_code,
  message,
  query
FROM postgres_log
WHERE error_severity IN ('ERROR', 'FATAL', 'PANIC')
ORDER BY log_time DESC;

-- Analyze connections
SELECT 
  DATE_TRUNC('hour', log_time) AS hour,
  COUNT(*) AS connection_count
FROM postgres_log
WHERE command_tag = 'CONNECT'
GROUP BY hour
ORDER BY hour;

-- Analyze query patterns
SELECT 
  SUBSTRING(query FROM 1 FOR 100) AS query_pattern,
  COUNT(*) AS execution_count,
  AVG(EXTRACT(EPOCH FROM duration)) AS avg_duration
FROM postgres_log
WHERE command_tag = 'SELECT'
  AND query IS NOT NULL
GROUP BY query_pattern
ORDER BY execution_count DESC
LIMIT 20;

-- Find most frequent errors
SELECT 
  sql_state_code,
  message,
  COUNT(*) AS error_count
FROM postgres_log
WHERE error_severity = 'ERROR'
GROUP BY sql_state_code, message
ORDER BY error_count DESC
LIMIT 10;

-- Analyze deadlocks
SELECT 
  log_time,
  message,
  detail
FROM postgres_log
WHERE message LIKE '%deadlock%'
ORDER BY log_time DESC;

-- Analyze lock waits
SELECT 
  log_time,
  user_name,
  database_name,
  query
FROM postgres_log
WHERE message LIKE '%lock%'
ORDER BY log_time DESC;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Log File Management</h2>

          <CodeBlock
            title="SQL: Log File Management"
            language="sql"
            code={`-- View current log file location
SHOW log_directory;
SHOW log_filename;

-- Check log file size
SELECT 
  pg_size_pretty(pg_stat_file('log/postgresql-2024-01-01.log')) AS log_size;

-- Rotate logs manually (requires superuser)
SELECT pg_rotate_logfile();

-- View log settings
SELECT name, setting, unit
FROM pg_settings
WHERE name LIKE 'log%'
ORDER BY name;

-- Check if logging is enabled
SELECT 
  name,
  setting,
  context
FROM pg_settings
WHERE name = 'logging_collector';

-- View log destination
SELECT 
  name,
  setting
FROM pg_settings
WHERE name = 'log_destination';

-- Check log statement settings
SELECT 
  name,
  setting
FROM pg_settings
WHERE name IN ('log_statement', 'log_min_duration_statement');

-- View log line prefix
SHOW log_line_prefix;

-- Archive old logs (external script)
-- Use logrotate or similar tool
-- Example logrotate config:
-- /var/lib/postgresql/data/log/postgresql-*.log {
--   daily
--   rotate 7
--   compress
--   delaycompress
--   missingok
--   notifempty
--   create 0640 postgres postgres
--   sharedscripts
-- }`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Prisma: Logging</h2>

          <CodeBlock
            title="Prisma: Log Configuration and Analysis"
            language="prisma"
            code={`// Prisma Client logging
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'info' },
    { emit: 'event', level: 'warn' },
  ],
});

// Listen to query events
prisma.$on('query', (e) => {
  console.log('Query: ' + e.query);
  console.log('Duration: ' + e.duration + 'ms');
});

// Listen to error events
prisma.$on('error', (e) => {
  console.error('Error: ' + e.message);
});

// Query PostgreSQL log settings
const logSettings = await prisma.$queryRaw\`
  SELECT name, setting, unit
  FROM pg_settings
  WHERE name LIKE 'log%'
  ORDER BY name
\`;

// Check logging status
const loggingStatus = await prisma.$queryRaw\`
  SELECT 
    name,
    setting,
    context
  FROM pg_settings
  WHERE name IN ('logging_collector', 'log_destination', 'log_statement')
\`;

// Analyze slow queries from logs (if CSV logging enabled)
const slowQueries = await prisma.$queryRaw\`
  SELECT 
    log_time,
    user_name,
    database_name,
    duration,
    query
  FROM postgres_log
  WHERE command_tag = 'SELECT'
    AND duration > interval '1 second'
  ORDER BY duration DESC
  LIMIT 20
\`;

// Analyze errors from logs
const errors = await prisma.$queryRaw\`
  SELECT 
    log_time,
    error_severity,
    sql_state_code,
    message
  FROM postgres_log
  WHERE error_severity IN ('ERROR', 'FATAL', 'PANIC')
  ORDER BY log_time DESC
  LIMIT 20
\`;

// Custom logging middleware
prisma.$use(async (params, next) => {
  const before = Date.now();
  const result = await next(params);
  const after = Date.now();
  
  console.log(\`Query \${params.model}.\${params.action} took \${after - before}ms\`);
  
  return result;
});`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Enable appropriate logging</strong> - balance detail vs performance</li>
              <li><strong>Use CSV logging</strong> - for structured log analysis</li>
              <li><strong>Set log rotation</strong> - prevent disk space issues</li>
              <li><strong>Log slow queries</strong> - identify performance issues</li>
              <li><strong>Monitor log size</strong> - implement log rotation</li>
              <li><strong>Analyze logs regularly</strong> - find patterns and issues</li>
              <li><strong>Archive old logs</strong> - keep for compliance/audit</li>
              <li><strong>Use log aggregation tools</strong> - for production monitoring</li>
            </ul>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}


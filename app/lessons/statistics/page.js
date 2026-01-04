import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Statistics - PostgreSQL Learning',
  description: 'Learn about PostgreSQL statistics including ANALYZE, statistics targets, and how statistics affect query planning',
};

export default function Statistics() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Statistics</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">What are Statistics?</h2>
          <p className="mb-4">
            PostgreSQL collects statistics about data distribution in tables to help the query planner 
            make optimal decisions. Statistics include row counts, distinct value counts, most common values, 
            and data distribution histograms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">ANALYZE</h2>

          <CodeBlock
            title="SQL: ANALYZE Command"
            language="sql"
            code={`-- Analyze a single table
ANALYZE users;

-- Analyze all tables in current database
ANALYZE;

-- Analyze specific columns
ANALYZE users (name, email);

-- Analyze with verbose output
ANALYZE VERBOSE users;

-- Analyze with specific statistics target
ANALYZE users;
-- Uses default_statistics_target setting

-- Check when table was last analyzed
SELECT 
  schemaname,
  tablename,
  last_analyze,
  last_autoanalyze,
  n_live_tup,
  n_dead_tup
FROM pg_stat_user_tables
WHERE tablename = 'users';

-- View statistics
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation,
  most_common_vals,
  most_common_freqs
FROM pg_stats
WHERE tablename = 'users'
ORDER BY attname;

-- Statistics are stored in pg_statistic system catalog
-- Query planner uses these for cost estimation`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Statistics Targets</h2>

          <CodeBlock
            title="SQL: Statistics Targets"
            language="sql"
            code={`-- Check current statistics target
SHOW default_statistics_target;
-- Default is 100

-- Set statistics target for session
SET default_statistics_target = 200;

-- Set statistics target for specific column
ALTER TABLE users ALTER COLUMN email SET STATISTICS 500;
-- Higher target = more detailed statistics
-- Range: -1 (inherit default) to 10000

-- Analyze with new target
ANALYZE users;

-- View column statistics target
SELECT 
  attname,
  attstattarget
FROM pg_attribute
WHERE attrelid = 'users'::regclass
  AND attnum > 0
  AND NOT attisdropped;

-- When to increase statistics target:
-- 1. Queries with complex WHERE clauses
-- 2. Columns with skewed distributions
-- 3. Columns used in joins
-- 4. When planner makes poor choices

-- Example: Increase target for join column
ALTER TABLE orders ALTER COLUMN user_id SET STATISTICS 500;
ANALYZE orders;

-- Check statistics quality
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation,
  CASE 
    WHEN n_distinct < 0 THEN 'All distinct'
    WHEN n_distinct = 0 THEN 'No data'
    ELSE n_distinct::text
  END AS distinct_values
FROM pg_stats
WHERE tablename = 'users';`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Statistics Information</h2>

          <CodeBlock
            title="SQL: Viewing Statistics"
            language="sql"
            code={`-- View all statistics for a table
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,              -- Number of distinct values
  correlation,             -- Correlation with physical order
  most_common_vals,        -- Most common values
  most_common_freqs,       -- Frequencies of most common values
  histogram_bounds,        -- Histogram boundaries
  null_frac                -- Fraction of NULL values
FROM pg_stats
WHERE tablename = 'users'
ORDER BY attname;

-- Check correlation (important for index usage)
-- Correlation near 1 or -1: data is physically ordered
-- Correlation near 0: data is randomly ordered
SELECT 
  attname,
  correlation,
  CASE 
    WHEN abs(correlation) > 0.9 THEN 'Highly correlated'
    WHEN abs(correlation) > 0.5 THEN 'Moderately correlated'
    ELSE 'Low correlation'
  END AS correlation_level
FROM pg_stats
WHERE tablename = 'users';

-- View most common values
SELECT 
  attname,
  most_common_vals,
  most_common_freqs
FROM pg_stats
WHERE tablename = 'users'
  AND most_common_vals IS NOT NULL;

-- Check histogram bounds
SELECT 
  attname,
  histogram_bounds
FROM pg_stats
WHERE tablename = 'users'
  AND histogram_bounds IS NOT NULL;

-- View NULL fraction
SELECT 
  attname,
  null_frac,
  ROUND(null_frac * 100, 2) AS null_percentage
FROM pg_stats
WHERE tablename = 'users'
ORDER BY null_frac DESC;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Extended Statistics</h2>

          <CodeBlock
            title="SQL: Extended Statistics"
            language="sql"
            code={`-- Create extended statistics (PostgreSQL 10+)
-- For correlated columns

-- Multivariate statistics
CREATE STATISTICS user_status_email_stats 
ON status, email 
FROM users;
-- Helps planner understand correlation between columns

-- Analyze to populate extended statistics
ANALYZE users;

-- View extended statistics
SELECT 
  stxname,
  stxkeys,
  stxkind
FROM pg_statistic_ext
WHERE stxrelid = 'users'::regclass;

-- Expression statistics
CREATE STATISTICS user_name_length_stats 
ON (LENGTH(name)) 
FROM users;
-- Statistics on expressions

-- Functional dependency statistics
CREATE STATISTICS user_dependency_stats (dependencies)
ON status, email 
FROM users;
-- Tracks functional dependencies

-- N-distinct statistics
CREATE STATISTICS user_distinct_stats (ndistinct)
ON status, email 
FROM users;
-- Tracks number of distinct combinations

-- MCV (Most Common Values) statistics
CREATE STATISTICS user_mcv_stats (mcv)
ON status, email 
FROM users;
-- Tracks most common value combinations

-- Drop extended statistics
DROP STATISTICS user_status_email_stats;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Auto-ANALYZE</h2>

          <CodeBlock
            title="SQL: Auto-ANALYZE Configuration"
            language="sql"
            code={`-- Check auto-analyze settings
SHOW autovacuum;
SHOW autovacuum_analyze_threshold;
SHOW autovacuum_analyze_scale_factor;

-- Default settings:
-- autovacuum_analyze_threshold = 50
-- autovacuum_analyze_scale_factor = 0.1 (10%)

-- Auto-analyze triggers when:
-- (n_dead_tup + n_live_tup) * scale_factor + threshold
-- rows have changed since last analyze

-- Check last auto-analyze
SELECT 
  schemaname,
  tablename,
  last_analyze,
  last_autoanalyze,
  analyze_count,
  autoanalyze_count,
  n_live_tup,
  n_dead_tup
FROM pg_stat_user_tables
WHERE tablename = 'users';

-- Configure auto-analyze per table
ALTER TABLE users SET (
  autovacuum_analyze_threshold = 100,
  autovacuum_analyze_scale_factor = 0.05
);

-- Disable auto-analyze for a table
ALTER TABLE users SET (autovacuum_analyze_enabled = false);

-- Re-enable auto-analyze
ALTER TABLE users SET (autovacuum_analyze_enabled = true);

-- Check if auto-analyze is working
SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN last_autoanalyze IS NULL THEN 'Never analyzed'
    WHEN last_autoanalyze < NOW() - INTERVAL '7 days' THEN 'Stale statistics'
    ELSE 'Recent statistics'
  END AS stats_status
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY last_autoanalyze NULLS LAST;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Prisma: Statistics</h2>

          <CodeBlock
            title="Prisma: Managing Statistics"
            language="prisma"
            code={`// Prisma doesn't have direct statistics management
// Use raw SQL for statistics operations

// Analyze tables
await prisma.$executeRaw\`ANALYZE "User"\`;

// Analyze all tables
await prisma.$executeRaw\`ANALYZE\`;

// Check statistics
const stats = await prisma.$queryRaw\`
  SELECT 
    schemaname,
    tablename,
    last_analyze,
    last_autoanalyze,
    n_live_tup,
    n_dead_tup
  FROM pg_stat_user_tables
  WHERE schemaname = 'public'
\`;

// View column statistics
const columnStats = await prisma.$queryRaw\`
  SELECT 
    tablename,
    attname,
    n_distinct,
    correlation,
    null_frac
  FROM pg_stats
  WHERE schemaname = 'public'
    AND tablename = 'User'
\`;

// Set statistics target
await prisma.$executeRaw\`
  ALTER TABLE "User" 
  ALTER COLUMN email 
  SET STATISTICS 500
\`;

await prisma.$executeRaw\`ANALYZE "User"\`;

// Create extended statistics
await prisma.$executeRaw\`
  CREATE STATISTICS IF NOT EXISTS user_status_email_stats 
  ON status, email 
  FROM "User"
\`;

await prisma.$executeRaw\`ANALYZE "User"\`;

// Check for stale statistics
const staleStats = await prisma.$queryRaw\`
  SELECT 
    schemaname,
    tablename,
    last_autoanalyze,
    NOW() - last_autoanalyze AS age
  FROM pg_stat_user_tables
  WHERE schemaname = 'public'
    AND (last_autoanalyze IS NULL 
         OR last_autoanalyze < NOW() - INTERVAL '7 days')
\`;

// Monitor statistics updates
const analyzeStats = await prisma.$queryRaw\`
  SELECT 
    schemaname,
    tablename,
    analyze_count,
    autoanalyze_count,
    last_analyze,
    last_autoanalyze
  FROM pg_stat_user_tables
  WHERE schemaname = 'public'
  ORDER BY last_autoanalyze DESC
\`;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Run ANALYZE regularly</strong> - auto-analyze handles this automatically</li>
              <li><strong>Increase statistics target</strong> for columns used in complex queries</li>
              <li><strong>Monitor statistics age</strong> - stale statistics lead to poor plans</li>
              <li><strong>Use extended statistics</strong> for correlated columns</li>
              <li><strong>Check correlation values</strong> - affects index usage decisions</li>
              <li><strong>Review most common values</strong> - helps with selectivity estimates</li>
              <li><strong>Analyze after bulk loads</strong> - large data changes need statistics updates</li>
              <li><strong>Compare estimated vs actual</strong> rows to identify statistics issues</li>
            </ul>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}


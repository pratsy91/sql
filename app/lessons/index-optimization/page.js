import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Index Optimization - PostgreSQL Learning',
  description: 'Learn about PostgreSQL index optimization including index type selection, usage analysis, partial indexes, and expression indexes',
};

export default function IndexOptimization() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Index Optimization</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Index Types Selection</h2>

          <CodeBlock
            title="SQL: Choosing Index Types"
            language="sql"
            code={`-- B-tree index (default, most common)
CREATE INDEX idx_users_email ON users(email);
-- Good for: equality, range queries, sorting
-- Works with: =, <, >, <=, >=, BETWEEN, IN, LIKE (with prefix)

-- Hash index
CREATE INDEX idx_users_email_hash ON users USING hash(email);
-- Good for: equality only
-- Works with: = only
-- Faster for simple equality checks

-- GiST (Generalized Search Tree)
CREATE INDEX idx_points_location ON points USING gist(location);
-- Good for: geometric data, full-text search, arrays
-- Works with: geometric operators, text search

-- GIN (Generalized Inverted Index)
CREATE INDEX idx_documents_content ON documents USING gin(to_tsvector('english', content));
-- Good for: arrays, JSONB, full-text search
-- Works with: array operators, JSONB operators, text search

-- BRIN (Block Range Index)
CREATE INDEX idx_orders_created_at ON orders USING brin(created_at);
-- Good for: large tables with natural ordering
-- Works with: range queries on ordered data
-- Very small index size

-- SP-GiST (Space-Partitioned GiST)
CREATE INDEX idx_points_location_spgist ON points USING spgist(location);
-- Good for: non-balanced data distributions
-- Alternative to GiST for certain data types

-- Choosing the right index:
-- 1. B-tree: Most queries (default choice)
-- 2. Hash: Simple equality checks only
-- 3. GiST: Geometric, full-text, custom types
-- 4. GIN: Arrays, JSONB, full-text search
-- 5. BRIN: Large ordered tables
-- 6. SP-GiST: Specialized use cases`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Index Usage Analysis</h2>

          <CodeBlock
            title="SQL: Analyzing Index Usage"
            language="sql"
            code={`-- Check if index is being used
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM users WHERE email = 'test@example.com';
-- Look for "Index Scan using idx_users_email"

-- View index usage statistics
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,           -- Number of index scans
  idx_tup_read,       -- Tuples read from index
  idx_tup_fetch       -- Tuples fetched from table
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Find unused indexes
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Check index size
SELECT 
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Index bloat analysis
SELECT 
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
  idx_scan
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan < 10  -- Rarely used
ORDER BY pg_relation_size(indexrelid) DESC;

-- Check index efficiency
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM users 
WHERE email = 'test@example.com' 
  AND status = 'active';
-- Check if index is used for both conditions or just one`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Partial Indexes</h2>

          <CodeBlock
            title="SQL: Partial Indexes"
            language="sql"
            code={`-- Partial index (index only part of table)
CREATE INDEX idx_active_users_email 
ON users(email) 
WHERE status = 'active';
-- Only indexes rows where status = 'active'
-- Smaller index, faster queries

-- Partial index for recent data
CREATE INDEX idx_recent_orders_user_id 
ON orders(user_id) 
WHERE created_at > '2024-01-01';
-- Only indexes recent orders

-- Partial index for NULL values
CREATE INDEX idx_users_deleted_at 
ON users(deleted_at) 
WHERE deleted_at IS NOT NULL;
-- Only indexes non-NULL values

-- Partial unique index
CREATE UNIQUE INDEX idx_active_users_email_unique 
ON users(email) 
WHERE status = 'active';
-- Ensures unique emails only for active users

-- Partial index with multiple conditions
CREATE INDEX idx_high_value_orders 
ON orders(user_id, created_at) 
WHERE total > 1000 AND status = 'completed';

-- Check partial index usage
EXPLAIN (ANALYZE)
SELECT * FROM users 
WHERE email = 'test@example.com' 
  AND status = 'active';
-- Should use partial index

-- View partial index definition
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE indexname = 'idx_active_users_email';`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Expression Indexes</h2>

          <CodeBlock
            title="SQL: Expression Indexes"
            language="sql"
            code={`-- Expression index (index on computed value)
CREATE INDEX idx_users_email_lower 
ON users(LOWER(email));
-- Indexes lowercase email for case-insensitive searches

-- Use expression index
SELECT * FROM users WHERE LOWER(email) = 'test@example.com';
-- Can use the index

-- Expression index with function
CREATE INDEX idx_users_name_trigram 
ON users USING gin(name gin_trgm_ops);
-- For trigram similarity searches

-- Expression index with date function
CREATE INDEX idx_orders_created_year 
ON orders(EXTRACT(YEAR FROM created_at));
-- Index on year extraction

-- Expression index with concatenation
CREATE INDEX idx_users_full_name 
ON users((first_name || ' ' || last_name));
-- Index on concatenated name

-- Expression index with JSON
CREATE INDEX idx_users_metadata_status 
ON users((metadata->>'status'));
-- Index on JSON field

-- Expression index with array length
CREATE INDEX idx_users_tags_count 
ON users(array_length(tags, 1));
-- Index on array length

-- Check expression index usage
EXPLAIN (ANALYZE)
SELECT * FROM users 
WHERE LOWER(email) = 'test@example.com';
-- Should use idx_users_email_lower

-- View expression indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE indexdef LIKE '%LOWER%'
   OR indexdef LIKE '%EXTRACT%';`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Composite Indexes</h2>

          <CodeBlock
            title="SQL: Composite Indexes"
            language="sql"
            code={`-- Composite index (multiple columns)
CREATE INDEX idx_users_status_created 
ON users(status, created_at);
-- Order matters! Leftmost columns are most selective

-- Composite index usage
-- Can use for:
SELECT * FROM users WHERE status = 'active';
-- Uses index (leftmost column)

SELECT * FROM users 
WHERE status = 'active' AND created_at > '2024-01-01';
-- Uses index (both columns)

SELECT * FROM users WHERE created_at > '2024-01-01';
-- May NOT use index efficiently (rightmost column only)

-- Optimal column order
-- 1. Most selective first (fewer distinct values)
-- 2. Most frequently used in WHERE clauses
-- 3. Consider sort order

-- Composite index with sort order
CREATE INDEX idx_users_status_created_desc 
ON users(status, created_at DESC);
-- Useful for ORDER BY status, created_at DESC

-- Composite index for covering queries
CREATE INDEX idx_users_covering 
ON users(status, created_at) 
INCLUDE (name, email);
-- Index includes additional columns (PostgreSQL 11+)
-- Can satisfy query without table access

-- Check composite index usage
EXPLAIN (ANALYZE)
SELECT name, email 
FROM users 
WHERE status = 'active' 
ORDER BY created_at DESC;
-- Should use covering index`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Prisma: Index Optimization</h2>

          <CodeBlock
            title="Prisma: Index Management"
            language="prisma"
            code={`// Prisma schema indexes
// schema.prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String
  status    String
  createdAt DateTime @default(now()) @map("created_at")
  
  @@index([status, createdAt])
  @@index([email], name: "idx_users_email_lower", map: "idx_users_email_lower")
}

// After schema change, run migration
// npx prisma migrate dev

// Analyze index usage
const indexStats = await prisma.$queryRaw\`
  SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
  FROM pg_stat_user_indexes
  WHERE schemaname = 'public'
  ORDER BY idx_scan DESC
\`;

// Find unused indexes
const unusedIndexes = await prisma.$queryRaw\`
  SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan
  FROM pg_stat_user_indexes
  WHERE idx_scan = 0
    AND schemaname = 'public'
\`;

// Create partial index (raw SQL)
await prisma.$executeRaw\`
  CREATE INDEX IF NOT EXISTS idx_active_users_email 
  ON "User"(email) 
  WHERE status = 'active'
\`;

// Create expression index (raw SQL)
await prisma.$executeRaw\`
  CREATE INDEX IF NOT EXISTS idx_users_email_lower 
  ON "User"(LOWER(email))
\`;

// Analyze query plan
const plan = await prisma.$queryRaw\`
  EXPLAIN (ANALYZE, BUFFERS)
  SELECT * FROM "User" 
  WHERE status = 'active' 
  ORDER BY "createdAt" DESC
\`;

// Check index size
const indexSizes = await prisma.$queryRaw\`
  SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) AS size
  FROM pg_stat_user_indexes
  WHERE schemaname = 'public'
  ORDER BY pg_relation_size(indexrelid) DESC
\`;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Choose appropriate index type</strong> for your use case</li>
              <li><strong>Monitor index usage</strong> - remove unused indexes</li>
              <li><strong>Use partial indexes</strong> for filtered queries</li>
              <li><strong>Use expression indexes</strong> for computed values</li>
              <li><strong>Order composite indexes</strong> by selectivity and usage</li>
              <li><strong>Consider covering indexes</strong> to avoid table access</li>
              <li><strong>Balance index count</strong> - too many indexes slow writes</li>
              <li><strong>Monitor index bloat</strong> and reindex when needed</li>
              <li><strong>Test index impact</strong> on both reads and writes</li>
            </ul>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}


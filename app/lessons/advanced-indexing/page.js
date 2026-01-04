import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Advanced Indexing - PostgreSQL Learning',
  description: 'Learn about advanced PostgreSQL indexing including partial indexes, expression indexes, and covering indexes',
};

export default function AdvancedIndexing() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Advanced Indexing</h1>
        
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

-- Partial index with function
CREATE INDEX idx_users_lower_email 
ON users(LOWER(email)) 
WHERE status = 'active';

-- Check partial index usage
EXPLAIN SELECT * FROM users 
WHERE email = 'test@example.com' 
  AND status = 'active';
-- Should use partial index

-- View partial index definition
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE indexname = 'idx_active_users_email';

-- Partial index statistics
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
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

-- Expression index with mathematical operations
CREATE INDEX idx_products_price_discounted 
ON products((price * (1 - discount)));
-- Index on calculated price

-- Expression index with CASE
CREATE INDEX idx_orders_status_priority 
ON orders(
  CASE 
    WHEN status = 'urgent' THEN 1
    WHEN status = 'high' THEN 2
    ELSE 3
  END
);

-- Check expression index usage
EXPLAIN SELECT * FROM users 
WHERE LOWER(email) = 'test@example.com';
-- Should use idx_users_email_lower

-- View expression indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE indexdef LIKE '%LOWER%'
   OR indexdef LIKE '%EXTRACT%'
   OR indexdef LIKE '%||%';`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Covering Indexes (INCLUDE)</h2>

          <CodeBlock
            title="SQL: Covering Indexes"
            language="sql"
            code={`-- Covering index (PostgreSQL 11+)
-- Includes additional columns in index
-- Can satisfy query without table access

CREATE INDEX idx_users_status_covering 
ON users(status, created_at) 
INCLUDE (name, email);
-- Index includes name and email columns

-- Query can be satisfied from index only
EXPLAIN SELECT name, email 
FROM users 
WHERE status = 'active' 
ORDER BY created_at DESC;
-- Index Only Scan using idx_users_status_covering

-- Covering index advantages:
-- 1. Faster queries (no table access)
-- 2. Smaller index than full table scan
-- 3. Better for read-heavy workloads

-- Covering index with multiple included columns
CREATE INDEX idx_orders_user_covering 
ON orders(user_id, created_at) 
INCLUDE (total, status, notes);

-- Query using covering index
SELECT total, status, notes
FROM orders
WHERE user_id = 1
ORDER BY created_at DESC;
-- Can use covering index

-- Covering index with expression
CREATE INDEX idx_users_email_covering 
ON users(LOWER(email)) 
INCLUDE (name, created_at);

-- Check if index is covering
EXPLAIN (ANALYZE, BUFFERS)
SELECT name, created_at
FROM users
WHERE LOWER(email) = 'test@example.com';
-- Should show: Index Only Scan

-- View index definition
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE indexname = 'idx_users_status_covering';

-- Compare with regular index
CREATE INDEX idx_users_status_regular 
ON users(status, created_at, name, email);
-- All columns in index key (larger)

-- Covering index is smaller
-- Only key columns are in B-tree
-- Included columns stored separately`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Index Types and Options</h2>

          <CodeBlock
            title="SQL: Advanced Index Options"
            language="sql"
            code={`-- Index with fillfactor (leave space for updates)
CREATE INDEX idx_users_email 
ON users(email) 
WITH (fillfactor = 80);
-- Leaves 20% space for updates

-- Index with fastupdate (GIN indexes)
CREATE INDEX idx_documents_content 
ON documents USING gin(to_tsvector('english', content))
WITH (fastupdate = off);
-- Disables fast update (slower inserts, faster queries)

-- Index with pages_per_range (BRIN indexes)
CREATE INDEX idx_orders_created_brin 
ON orders USING brin(created_at)
WITH (pages_per_range = 32);
-- Adjusts BRIN index granularity

-- Unique index
CREATE UNIQUE INDEX idx_users_email_unique 
ON users(email);

-- Unique index with NULLS NOT DISTINCT (PostgreSQL 15+)
CREATE UNIQUE INDEX idx_users_email_unique_nulls 
ON users(email) NULLS NOT DISTINCT;
-- Treats NULLs as equal (only one NULL allowed)

-- Index with WHERE clause (partial index)
CREATE INDEX idx_active_users 
ON users(email) 
WHERE status = 'active';

-- Index with expression
CREATE INDEX idx_users_name_lower 
ON users(LOWER(name));

-- Index with INCLUDE (covering index)
CREATE INDEX idx_users_covering 
ON users(status) 
INCLUDE (name, email);

-- Concurrent index creation
CREATE INDEX CONCURRENTLY idx_users_email_concurrent 
ON users(email);
-- Doesn't block writes

-- Index on specific tablespace
CREATE INDEX idx_users_email 
ON users(email) 
TABLESPACE fast_disk;
-- Store index on faster disk

-- View index options
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'users';`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Index Maintenance</h2>

          <CodeBlock
            title="SQL: Index Maintenance"
            language="sql"
            code={`-- Reindex index
REINDEX INDEX idx_users_email;

-- Reindex table (all indexes)
REINDEX TABLE users;

-- Reindex concurrently (PostgreSQL 12+)
REINDEX INDEX CONCURRENTLY idx_users_email;
REINDEX TABLE CONCURRENTLY users;

-- View index bloat
SELECT 
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
  idx_scan,
  idx_tup_read
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Find unused indexes
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Find duplicate indexes
SELECT 
  a.schemaname,
  a.tablename,
  a.indexname AS index_a,
  b.indexname AS index_b,
  a.indexdef AS definition_a,
  b.indexdef AS definition_b
FROM pg_indexes a
JOIN pg_indexes b ON a.tablename = b.tablename
WHERE a.indexname < b.indexname
  AND a.indexdef = b.indexdef;

-- Analyze index usage
ANALYZE users;

-- View index statistics
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE tablename = 'users'
ORDER BY idx_scan DESC;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Prisma: Advanced Indexing</h2>

          <CodeBlock
            title="Prisma: Advanced Index Operations"
            language="prisma"
            code={`// Prisma schema supports some index types
// Use raw SQL for advanced indexing

// Create partial index
await prisma.$executeRaw\`
  CREATE INDEX idx_active_users_email 
  ON "User"(email) 
  WHERE status = 'active'
\`;

// Create expression index
await prisma.$executeRaw\`
  CREATE INDEX idx_users_email_lower 
  ON "User"(LOWER(email))
\`;

// Create covering index
await prisma.$executeRaw\`
  CREATE INDEX idx_users_status_covering 
  ON "User"(status, "createdAt") 
  INCLUDE (name, email)
\`;

// View indexes
const indexes = await prisma.$queryRaw\`
  SELECT 
    indexname,
    indexdef
  FROM pg_indexes
  WHERE tablename = 'User'
\`;

// Check index usage
const indexUsage = await prisma.$queryRaw\`
  SELECT 
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
  FROM pg_stat_user_indexes
  WHERE tablename = 'User'
  ORDER BY idx_scan DESC
\`;

// Find unused indexes
const unusedIndexes = await prisma.$queryRaw\`
  SELECT 
    indexname,
    idx_scan,
    pg_size_pretty(pg_relation_size(indexrelid)) AS size
  FROM pg_stat_user_indexes
  WHERE tablename = 'User'
    AND idx_scan = 0
\`;

// Reindex
await prisma.$executeRaw\`REINDEX INDEX CONCURRENTLY idx_users_email\`;

// Analyze query plan
const plan = await prisma.$queryRaw\`
  EXPLAIN (ANALYZE, BUFFERS)
  SELECT name, email
  FROM "User"
  WHERE status = 'active'
  ORDER BY "createdAt" DESC
\`;

// Prisma schema example with indexes
// schema.prisma
// model User {
//   id        Int      @id @default(autoincrement())
//   email     String   @unique
//   name      String
//   status    String
//   createdAt DateTime @default(now())
//   
//   @@index([status, createdAt])
//   @@index([email], name: "idx_users_email_lower", map: "idx_users_email_lower")
// }

// Note: Prisma doesn't support partial or expression indexes in schema
// Create them manually using raw SQL`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Use partial indexes</strong> - for filtered queries on large tables</li>
              <li><strong>Use expression indexes</strong> - for computed values and functions</li>
              <li><strong>Use covering indexes</strong> - to avoid table access for read queries</li>
              <li><strong>Monitor index usage</strong> - remove unused indexes</li>
              <li><strong>Reindex regularly</strong> - maintain index efficiency</li>
              <li><strong>Use CONCURRENTLY</strong> - for indexes on production tables</li>
              <li><strong>Balance index count</strong> - too many indexes slow writes</li>
              <li><strong>Test index impact</strong> - verify performance improvements</li>
            </ul>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}


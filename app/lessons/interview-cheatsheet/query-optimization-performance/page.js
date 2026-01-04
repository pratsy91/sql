import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';

export const metadata = {
  title: 'Query Optimization & Performance - Interview Cheatsheet',
  description: 'Query optimization and performance tuning for interviews',
};

export default function QueryOptimizationPerformance() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Query Optimization & Performance - Interview Cheatsheet</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Query Execution Plan (EXPLAIN)</h2>
          
          <CodeBlock
            title="Understanding EXPLAIN"
            language="sql"
            code={`-- Basic EXPLAIN
EXPLAIN SELECT * FROM users WHERE email = 'test@example.com';

-- EXPLAIN ANALYZE (actually runs query)
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';

-- Verbose output
EXPLAIN (ANALYZE, BUFFERS, VERBOSE) 
SELECT * FROM users WHERE email = 'test@example.com';`}
          />

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Key Terms in EXPLAIN Output</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li><strong>Seq Scan:</strong> Sequential table scan (slow for large tables)</li>
              <li><strong>Index Scan:</strong> Uses index to find rows (fast)</li>
              <li><strong>Index Only Scan:</strong> All data from index, no table access (fastest)</li>
              <li><strong>Bitmap Index Scan:</strong> Multiple index scans combined</li>
              <li><strong>Nested Loop:</strong> For each row in outer, scan inner (good for small datasets)</li>
              <li><strong>Hash Join:</strong> Build hash table from one side, probe with other (good for large datasets)</li>
              <li><strong>Merge Join:</strong> Sort both sides and merge (good when data pre-sorted)</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Index Types</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">B-tree Index (Default)</h3>
              <p className="text-sm mb-2">Most common, good for equality and range queries</p>
              <CodeBlock
                title="B-tree Index"
                language="sql"
                code={`CREATE INDEX idx_email ON users(email);
-- Good for: WHERE email = 'x', WHERE id > 100`}
              />
            </div>

            <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Hash Index</h3>
              <p className="text-sm mb-2">Only for equality (=) operations</p>
              <CodeBlock
                title="Hash Index"
                language="sql"
                code={`CREATE INDEX idx_email_hash ON users USING HASH(email);
-- Good for: WHERE email = 'x'
-- Bad for: WHERE email > 'x', ORDER BY email`}
              />
            </div>

            <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">GIN (Generalized Inverted Index)</h3>
              <p className="text-sm mb-2">For arrays, JSONB, full-text search</p>
              <CodeBlock
                title="GIN Index"
                language="sql"
                code={`CREATE INDEX idx_tags_gin ON products USING GIN(tags);
-- Good for: WHERE tags @> ARRAY['electronics']`}
              />
            </div>

            <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">GiST (Generalized Search Tree)</h3>
              <p className="text-sm mb-2">For geometric data, full-text search, custom operators</p>
              <CodeBlock
                title="GiST Index"
                language="sql"
                code={`CREATE INDEX idx_location_gist ON places USING GIST(location);
-- Good for: WHERE location <@ polygon`}
              />
            </div>

            <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">BRIN (Block Range Index)</h3>
              <p className="text-sm mb-2">Very compact, good for large sorted tables</p>
              <CodeBlock
                title="BRIN Index"
                language="sql"
                code={`CREATE INDEX idx_created_at_brin ON orders USING BRIN(created_at);
-- Good for: Large tables with sequential data`}
              />
            </div>

            <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Partial Index</h3>
              <p className="text-sm mb-2">Index only subset of rows</p>
              <CodeBlock
                title="Partial Index"
                language="sql"
                code={`CREATE INDEX idx_active_users ON users(email) WHERE active = true;
-- Smaller index, faster queries`}
              />
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Query Optimization Techniques</h2>
          
          <div className="bg-yellow-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">1. Use Indexes Properly</h3>
            <CodeBlock
              title="Index Usage Examples"
              language="sql"
              code={`-- Good: Index can be used
SELECT * FROM users WHERE email = 'test@example.com';
CREATE INDEX idx_email ON users(email);

-- Bad: Function on indexed column prevents index usage
SELECT * FROM users WHERE UPPER(email) = 'TEST@EXAMPLE.COM';
-- Fix: Create expression index
CREATE INDEX idx_email_upper ON users(UPPER(email));

-- Good: Composite index for multiple conditions
SELECT * FROM orders WHERE user_id = 1 AND status = 'pending';
CREATE INDEX idx_user_status ON orders(user_id, status);`}
            />
          </div>

          <div className="bg-yellow-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">2. Avoid SELECT *</h3>
            <CodeBlock
              title="Select Only Needed Columns"
              language="sql"
              code={`-- Bad: Fetches all columns
SELECT * FROM users WHERE id = 1;

-- Good: Only needed columns
SELECT id, name, email FROM users WHERE id = 1;

-- Better: Index-only scan possible
CREATE INDEX idx_user_id_name ON users(id, name);
SELECT id, name FROM users WHERE id = 1;  -- Can use index-only scan!`}
            />
          </div>

          <div className="bg-yellow-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">3. Limit Results Early</h3>
            <CodeBlock
              title="Use LIMIT and Appropriate WHERE Clauses"
              language="sql"
              code={`-- Bad: Fetches all rows then limits
SELECT * FROM orders ORDER BY created_at DESC;  -- Then limit in app

-- Good: Limit in query
SELECT * FROM orders ORDER BY created_at DESC LIMIT 10;

-- Better: Use WHERE to filter before sorting
SELECT * FROM orders 
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC 
LIMIT 10;`}
            />
          </div>

          <div className="bg-yellow-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">4. Use EXISTS Instead of COUNT</h3>
            <CodeBlock
              title="EXISTS vs COUNT"
              language="sql"
              code={`-- Bad: COUNT scans all matching rows
SELECT * FROM customers 
WHERE (SELECT COUNT(*) FROM orders WHERE customer_id = customers.id) > 0;

-- Good: EXISTS stops at first match
SELECT * FROM customers 
WHERE EXISTS (SELECT 1 FROM orders WHERE customer_id = customers.id);`}
            />
          </div>

          <div className="bg-yellow-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">5. Optimize JOINs</h3>
            <CodeBlock
              title="JOIN Optimization"
              language="sql"
              code={`-- Ensure JOIN columns are indexed
CREATE INDEX idx_orders_user_id ON orders(user_id);

-- Put most selective table first
SELECT * FROM small_table s
JOIN large_table l ON s.id = l.small_id;

-- Use INNER JOIN when possible (hints optimizer)
SELECT * FROM users u
INNER JOIN orders o ON u.id = o.user_id;  -- Not LEFT JOIN if not needed`}
            />
          </div>

          <div className="bg-yellow-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">6. Avoid Subqueries in SELECT</h3>
            <CodeBlock
              title="Correlated Subquery Problem"
              language="sql"
              code={`-- Bad: Correlated subquery runs for each row
SELECT 
  id,
  name,
  (SELECT COUNT(*) FROM orders WHERE user_id = users.id) AS order_count
FROM users;

-- Good: Use JOIN or CTE
SELECT 
  u.id,
  u.name,
  COUNT(o.id) AS order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id, u.name;`}
            />
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Common Performance Issues</h2>
          
          <div className="bg-red-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">1. N+1 Query Problem</h3>
            <CodeBlock
              title="N+1 Problem Example"
              language="sql"
              code={`-- Bad: 1 query for users, then N queries for orders
SELECT * FROM users;  -- Gets 100 users
-- Then for each user:
SELECT * FROM orders WHERE user_id = 1;
SELECT * FROM orders WHERE user_id = 2;
-- ... 100 more queries!

-- Good: Single query with JOIN
SELECT u.*, o.*
FROM users u
LEFT JOIN orders o ON u.id = o.user_id;`}
            />
          </div>

          <div className="bg-red-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">2. Missing Indexes</h3>
            <CodeBlock
              title="Check for Missing Indexes"
              language="sql"
              code={`-- Check for sequential scans
SELECT schemaname, tablename, attname, n_distinct
FROM pg_stats
WHERE schemaname = 'public';

-- Check slow queries
SELECT query, calls, mean_exec_time, total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;`}
            />
          </div>

          <div className="bg-red-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">3. Table Bloat</h3>
            <CodeBlock
              title="VACUUM and ANALYZE"
              language="sql"
              code={`-- VACUUM: Reclaim storage from dead rows
VACUUM;

-- VACUUM ANALYZE: Reclaim storage and update statistics
VACUUM ANALYZE;

-- VACUUM FULL: Rebuild table (locks table, use carefully)
VACUUM FULL;

-- Auto-vacuum runs automatically, but monitor it
SELECT * FROM pg_stat_progress_vacuum;`}
            />
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">PostgreSQL Configuration Tuning</h2>
          
          <CodeBlock
            title="Key Configuration Parameters"
            language="sql"
            code={`-- Memory settings (in postgresql.conf)

-- Shared buffers: 25% of RAM for dedicated server
shared_buffers = 2GB

-- Effective cache size: 50-75% of RAM
effective_cache_size = 6GB

-- Work memory: for sorting/hashing (per operation)
work_mem = 16MB

-- Maintenance work memory: for VACUUM, CREATE INDEX
maintenance_work_mem = 512MB

-- WAL settings
wal_buffers = 16MB
max_wal_size = 1GB
min_wal_size = 80MB

-- Checkpoint settings
checkpoint_completion_target = 0.9

-- Connection settings
max_connections = 100  -- Lower is better (use connection pooling)`}
          />

          <div className="bg-blue-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Connection Pooling</h3>
            <p className="text-sm mb-2">
              Use connection pooling (pgBouncer, Pgpool-II) to handle many connections efficiently.
              PostgreSQL uses one process per connection, which is expensive.
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Common Interview Questions</h2>
          
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Q: How do you optimize a slow query?</h3>
            <ol className="list-decimal pl-6 space-y-2 text-sm">
              <li>Use EXPLAIN ANALYZE to see execution plan</li>
              <li>Look for sequential scans on large tables</li>
              <li>Check if indexes exist and are being used</li>
              <li>Verify statistics are up to date (ANALYZE)</li>
              <li>Consider rewriting query (JOINs vs subqueries)</li>
              <li>Check for missing WHERE clauses or inefficient filters</li>
              <li>Consider partitioning for very large tables</li>
            </ol>
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Q: When would you use a covering index?</h3>
            <p className="text-sm mb-2">
              A covering index (index-only scan) contains all columns needed by a query. 
              PostgreSQL can answer the query without accessing the table.
            </p>
            <CodeBlock
              title="Covering Index Example"
              language="sql"
              code={`-- Query
SELECT id, email FROM users WHERE email = 'test@example.com';

-- Covering index (includes both id and email)
CREATE INDEX idx_users_email_covering ON users(email, id);
-- Or: CREATE INDEX idx_users_email_covering ON users(email) INCLUDE (id);

-- PostgreSQL can use index-only scan!`}
            />
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Q: Explain the difference between Hash Join and Nested Loop Join</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li><strong>Nested Loop:</strong> For each row in outer table, scan inner table. Good for small datasets or when inner has index.</li>
              <li><strong>Hash Join:</strong> Build hash table from smaller table, probe with larger table. Good for large datasets, requires memory.</li>
              <li><strong>Merge Join:</strong> Sort both sides, merge. Good when data is pre-sorted or can use indexes.</li>
            </ul>
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Q: What is query plan caching?</h3>
            <p className="text-sm mb-2">
              PostgreSQL caches execution plans for prepared statements and parameterized queries. 
              The planner also caches statistics and metadata. This improves performance for repeated queries.
            </p>
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Q: How do you handle slow queries in production?</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>Enable slow query logging (log_min_duration_statement)</li>
              <li>Use pg_stat_statements extension to track query performance</li>
              <li>Set up monitoring and alerting</li>
              <li>Regularly analyze query patterns</li>
              <li>Use EXPLAIN ANALYZE on slow queries</li>
              <li>Create appropriate indexes</li>
              <li>Consider query rewriting or denormalization</li>
            </ul>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}


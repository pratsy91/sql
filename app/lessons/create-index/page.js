import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'CREATE INDEX - PostgreSQL Learning',
  description: 'Learn about creating indexes in PostgreSQL including B-tree, Hash, GiST, GIN, BRIN, SP-GiST, partial, expression, unique, and concurrent indexes',
};

export default function CreateIndex() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">CREATE INDEX</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">B-tree Indexes (Default)</h2>

          <CodeBlock
            title="SQL: B-tree Indexes"
            language="sql"
            code={`-- Create B-tree index (default)
CREATE INDEX idx_users_email ON users(email);

-- Explicitly specify B-tree
CREATE INDEX idx_users_username ON users USING btree(username);

-- B-tree indexes are good for:
-- - Equality and range queries
-- - ORDER BY clauses
-- - Most common use cases

-- Composite B-tree index
CREATE INDEX idx_users_name_email ON users(last_name, first_name, email);

-- Unique B-tree index
CREATE UNIQUE INDEX idx_users_email_unique ON users(email);`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Hash Indexes</h2>

          <CodeBlock
            title="SQL: Hash Indexes"
            language="sql"
            code={`-- Create hash index
CREATE INDEX idx_users_email_hash ON users USING hash(email);

-- Hash indexes are good for:
-- - Equality comparisons only
-- - Not for range queries or ORDER BY
-- - Smaller than B-tree for exact matches

-- Note: Hash indexes don't support unique constraints
-- Use B-tree for unique indexes`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">GiST Indexes</h2>

          <CodeBlock
            title="SQL: GiST Indexes"
            language="sql"
            code={`-- GiST (Generalized Search Tree) indexes
-- Good for geometric data, full-text search, arrays

-- Geometric data
CREATE INDEX idx_locations_point ON locations USING gist(coordinates);

-- Full-text search
CREATE INDEX idx_documents_search ON documents USING gist(search_vector);

-- Array operations
CREATE INDEX idx_products_tags ON products USING gist(tags);`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">GIN Indexes</h2>

          <CodeBlock
            title="SQL: GIN Indexes"
            language="sql"
            code={`-- GIN (Generalized Inverted Index) indexes
-- Good for arrays, JSONB, full-text search

-- Full-text search (recommended)
CREATE INDEX idx_documents_fts ON documents USING gin(search_vector);

-- JSONB data
CREATE INDEX idx_products_attributes ON products USING gin(attributes);

-- Array containment
CREATE INDEX idx_products_tags ON products USING gin(tags);

-- GIN indexes are larger but faster for containment queries`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">BRIN Indexes</h2>

          <CodeBlock
            title="SQL: BRIN Indexes"
            language="sql"
            code={`-- BRIN (Block Range Index) indexes
-- Good for very large tables with sorted data

-- Timestamp columns
CREATE INDEX idx_logs_created ON logs USING brin(created_at);

-- Sequential data
CREATE INDEX idx_events_timestamp ON events USING brin(event_timestamp);

-- BRIN indexes are very small but only effective for:
-- - Sequential/naturally ordered data
-- - Very large tables
-- - Range queries`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">SP-GiST Indexes</h2>

          <CodeBlock
            title="SQL: SP-GiST Indexes"
            language="sql"
            code={`-- SP-GiST (Space-Partitioned GiST) indexes
-- Good for non-balanced data structures

-- Text pattern matching
CREATE INDEX idx_users_name_pattern ON users USING spgist(name text_pattern_ops);

-- Range types
CREATE INDEX idx_reservations_period ON reservations USING spgist(stay_period);`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Partial Indexes</h2>

          <CodeBlock
            title="SQL: Partial Indexes"
            language="sql"
            code={`-- Partial index (index only part of table)
CREATE INDEX idx_active_users ON users(email) WHERE status = 'active';

-- Partial index for recent data
CREATE INDEX idx_recent_orders ON orders(created_at) 
WHERE created_at > '2024-01-01';

-- Partial unique index
CREATE UNIQUE INDEX idx_active_user_email ON users(email) 
WHERE status = 'active';

-- Partial indexes are smaller and faster for filtered queries`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Expression Indexes</h2>

          <CodeBlock
            title="SQL: Expression Indexes"
            language="sql"
            code={`-- Index on expression
CREATE INDEX idx_users_lower_email ON users(LOWER(email));

-- Index on function result
CREATE INDEX idx_products_name_length ON products(LENGTH(name));

-- Index on computed column
CREATE INDEX idx_users_full_name ON users((first_name || ' ' || last_name));

-- Useful for case-insensitive searches, computed values, etc.`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Concurrent Index Creation</h2>

          <CodeBlock
            title="SQL: Concurrent Index Creation"
            language="sql"
            code={`-- Create index without locking table (CONCURRENTLY)
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);

-- CONCURRENTLY allows:
-- - Table to remain available during index creation
-- - Other operations to continue
-- - Takes longer but doesn't block

-- Note: Cannot use CONCURRENTLY in a transaction
-- Cannot combine with UNIQUE in same statement

-- For unique concurrent index:
CREATE UNIQUE INDEX CONCURRENTLY idx_users_email_unique ON users(email);`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Prisma Indexes</h2>

          <CodeBlock
            title="Prisma: Indexes"
            language="prisma"
            code={`// schema.prisma
model User {
  id       Int     @id @default(autoincrement())
  email    String  @unique  // Creates unique index
  username String
  
  @@index([email])  // Single column index
  @@index([username, email])  // Composite index
  @@index([email], map: "idx_users_email")  // Named index
  @@map("users")
}

// Partial index (using raw SQL in migration)
// Or use @@index with where clause (if supported)

// Expression index (using raw SQL)
// Prisma doesn't directly support expression indexes
// Add manually in migration or use raw SQL

// GIN index for JSONB
model Product {
  id         Int      @id @default(autoincrement())
  attributes Json     // JSONB in PostgreSQL
  
  @@index([attributes(ops: JsonbPathOps)], type: Gin)
  @@map("products")
}`}
          />
        </section>
      </div>
    </LessonLayout>
  );
}


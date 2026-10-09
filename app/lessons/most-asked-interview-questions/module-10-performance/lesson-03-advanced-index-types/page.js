import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 3: Advanced Index Types - Module 10 - Most Asked Interview Questions',
  description:
    'Most asked advanced PostgreSQL index interview questions: GIN vs GiST vs B-tree, covering indexes with INCLUDE, partial indexes, expression indexes, BRIN, and finding unused or duplicate indexes.',
};

export default function MaiqPerfLesson03AdvancedIndexes() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 3: Advanced Index Types</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          B-tree is the default index, but PostgreSQL has more. Picking the right type is what makes JSON
          search, text search, and huge time-series tables fast. This lesson also covers how to find the
          indexes you should delete.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="B-tree vs GIN vs GiST - when do you pick each?">
            <p>
              <strong>B-tree</strong>: scalar equality and ranges. <strong>GIN</strong>: composite values,
              which means one column holding many searchable items - arrays, JSONB containment, full-text
              search (<code>tsvector</code>), and trigrams. <strong>GiST</strong>: ranges, geometry and
              PostGIS, some exclusion constraints, and nearest-neighbor searches. Wrong index type means the
              planner cannot use it for your operator.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                GIN is slower to update but very fast to search. Use it for read-heavy search columns
              </li>
              <li>
                GiST is better when values change often, and it is the only choice for exclusion constraints
                on ranges
              </li>
              <li>
                If a JSONB or array query still does a sequential scan, the index type or the operator class
                is usually the reason
              </li>
            </ul>
            <CodeBlock
              title="GIN / GiST examples"
              language="sql"
              code={`CREATE INDEX posts_tags_gin ON posts USING GIN (tags);
CREATE INDEX events_payload_gin ON events USING GIN (payload jsonb_path_ops);
CREATE INDEX reservations_during_gist ON reservations USING GIST (during);

-- Queries these indexes can serve
SELECT * FROM posts WHERE tags @> ARRAY['sql'];
SELECT * FROM events WHERE payload @> '{"type":"signup"}';
SELECT * FROM reservations WHERE during && tstzrange(now(), now() + interval '1 day');`}
            />
            <CodeBlock
              title="Fuzzy text search with trigrams"
              language="sql"
              code={`CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Makes LIKE with a leading wildcard usable
CREATE INDEX users_name_trgm ON users USING GIN (full_name gin_trgm_ops);

SELECT * FROM users WHERE full_name ILIKE '%ande%';`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What are covering indexes and INCLUDE?">
            <p>
              A covering index can satisfy a query without heap fetches, which is called an index-only scan.
              The PostgreSQL <code>INCLUDE</code> clause adds non-key columns stored in the index for
              coverage, without affecting uniqueness or the search order of the key columns.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Key columns are searchable and sortable. <code>INCLUDE</code> columns are payload only
              </li>
              <li>
                Use <code>INCLUDE</code> when you want a unique index on one column but also want to return
                a second column
              </li>
              <li>Every extra column makes the index bigger, so only include what hot queries read</li>
            </ul>
            <CodeBlock
              title="INCLUDE"
              language="sql"
              code={`CREATE INDEX orders_user_covering
ON orders (user_id)
INCLUDE (total_cents, status);

-- Helps: SELECT total_cents, status FROM orders WHERE user_id = $1;

-- Unique on email, but still returns display_name from the index
CREATE UNIQUE INDEX users_email_uq
ON users (email)
INCLUDE (display_name);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What are partial indexes and why are they powerful?">
            <p>
              A partial index indexes only the rows matching a <code>WHERE</code> predicate. It is smaller
              and faster when your queries always include that same filter, for example only open tickets or
              only rows that are not soft deleted.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                The planner uses it only if it can prove your query filter implies the index filter
              </li>
              <li>
                A partial unique index is the standard way to say &quot;email must be unique among active
                users&quot;
              </li>
              <li>
                Great for a status column where 99 percent of rows are <code>done</code> and you only ever
                query the other 1 percent
              </li>
            </ul>
            <CodeBlock
              title="Partial index"
              language="sql"
              code={`CREATE INDEX orders_open_user_idx
ON orders (user_id)
WHERE status IN ('pending', 'paid');

CREATE UNIQUE INDEX users_active_email_uq
ON users (email)
WHERE deleted_at IS NULL;

-- Tiny index on a huge queue table
CREATE INDEX jobs_pending_idx
ON jobs (run_at)
WHERE finished_at IS NULL;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What is an expression index, for example on lower(email)?">
            <p>
              An expression index stores the result of a function instead of the raw column value. You need
              it whenever your <code>WHERE</code> clause wraps the column in a function, because a plain
              index on the column cannot be used then. The expression in the query must match the expression
              in the index.
            </p>
            <CodeBlock
              title="Expression index"
              language="sql"
              code={`-- This query cannot use an index on email
SELECT * FROM users WHERE lower(email) = 'alice@example.com';

-- This index makes it fast
CREATE INDEX users_lower_email_idx ON users (lower(email));

-- Case-insensitive uniqueness
CREATE UNIQUE INDEX users_lower_email_uq ON users (lower(email));

-- Index a value inside JSONB
CREATE INDEX events_type_idx ON events ((payload->>'type'));
SELECT * FROM events WHERE payload->>'type' = 'signup';`}
            />
            <p>
              Note the double parentheses for a JSONB expression, and remember that{' '}
              <code>payload-&gt;&gt;&apos;type&apos;</code> returns text, so compare it to text.
            </p>
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What is a BRIN index, in one sentence?">
            <p>
              BRIN (Block Range Index) stores only the smallest and largest value for each group of table
              blocks, so it is tiny and works well on very large tables where the column values already grow
              in physical order, such as an append-only <code>created_at</code> column.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Huge space saving: a BRIN index can be a few megabytes where a B-tree would be gigabytes
              </li>
              <li>
                It only helps if the data is physically correlated with the column. Random inserts make it
                useless
              </li>
              <li>It is good for wide range scans, not for looking up a single row</li>
            </ul>
            <CodeBlock
              title="BRIN on a time-series table"
              language="sql"
              code={`CREATE INDEX events_created_brin
ON events USING BRIN (created_at) WITH (pages_per_range = 64);

-- Good fit: scan a month out of years of data
SELECT count(*) FROM events
WHERE created_at >= '2026-01-01' AND created_at < '2026-02-01';`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="How do you find unused or duplicate indexes, and how do you remove them safely?">
            <p>
              Unused indexes cost write speed, disk, and backup time while giving nothing back. Duplicate
              indexes are worse, because they double that cost. PostgreSQL tracks index usage, so you can
              answer this with data instead of opinion.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Check <code>pg_stat_user_indexes</code> for <code>idx_scan = 0</code>, but only trust it
                after the stats have been collecting long enough to include monthly reports
              </li>
              <li>
                Never drop a unique or primary key index just because it is unscanned. It enforces a
                constraint
              </li>
              <li>
                A duplicate is an index whose columns are a leading prefix of another index, for example{' '}
                <code>(tenant_id)</code> when <code>(tenant_id, status)</code> already exists
              </li>
              <li>
                Drop with <code>DROP INDEX CONCURRENTLY</code> so you do not block writes, and keep the
                create statement handy to roll back
              </li>
              <li>
                Check every replica too. A reporting replica may be the only user of an index
              </li>
            </ul>
            <CodeBlock
              title="Unused indexes"
              language="sql"
              code={`SELECT
  s.relname AS table_name,
  s.indexrelname AS index_name,
  s.idx_scan,
  pg_size_pretty(pg_relation_size(s.indexrelid)) AS index_size
FROM pg_stat_user_indexes s
JOIN pg_index i ON i.indexrelid = s.indexrelid
WHERE s.idx_scan = 0
  AND NOT i.indisunique
  AND NOT i.indisprimary
ORDER BY pg_relation_size(s.indexrelid) DESC;

-- When the stats were last reset (context for idx_scan = 0)
SELECT stats_reset FROM pg_stat_database WHERE datname = current_database();`}
            />
            <CodeBlock
              title="Duplicate and overlapping indexes"
              language="sql"
              code={`SELECT
  indrelid::regclass AS table_name,
  array_agg(indexrelid::regclass) AS duplicate_indexes
FROM pg_index
GROUP BY indrelid, indkey, indclass, indpred, indexprs IS NULL
HAVING count(*) > 1;

-- Remove without blocking writes (cannot run inside a transaction block)
DROP INDEX CONCURRENTLY IF EXISTS orders_user_id_idx;

-- Rebuild a bloated index without downtime
REINDEX INDEX CONCURRENTLY orders_user_covering;`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

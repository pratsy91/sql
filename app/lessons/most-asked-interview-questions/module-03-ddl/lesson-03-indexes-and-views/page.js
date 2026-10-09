import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 3: Indexes and Views - Module 3 - Most Asked Interview Questions',
  description:
    'Most asked interview questions on PostgreSQL index types, views vs materialized views, updatable views, REFRESH CONCURRENTLY, and unique index vs unique constraint',
};

export default function MaiqM03L03IndexesAndViews() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 3: Indexes and Views</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          The two objects you create most often after tables. Know the index types by name, and know exactly what a view does and does not do.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="When should you use a view?">
            <p>
              A view is a saved query with a name. Use it when several places need the same query, or when you want to show someone a limited slice of a table.
              It stores no data, so it is always up to date and costs whatever its query costs.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Hide complexity:</strong> a five-table join becomes <code>SELECT * FROM order_summary</code>, and everyone gets the same logic</li>
              <li><strong>Security boundary:</strong> grant a reporting role SELECT on a view that leaves out the salary or the password hash, and no access to the base table at all</li>
              <li><strong>Compatibility shim:</strong> after renaming a table or a column, a view with the old name keeps old code working while you migrate it</li>
              <li><strong>A stable contract:</strong> BI tools and other teams read the view, so you can reshape the tables underneath</li>
              <li><strong>When not to:</strong> a view does not make anything faster. Stacking views on views hides cost and produces plans nobody can read. For an expensive aggregate you want a materialized view or a summary table instead</li>
              <li>Views also create a dependency, so you cannot drop or retype a column the view uses without <code>CASCADE</code> and recreating it</li>
            </ul>
            <CodeBlock
              title="A view as a safe, simple interface"
              language="sql"
              code={`CREATE VIEW order_summary AS
SELECT o.id,
       o.created_at,
       u.email,
       sum(oi.quantity * oi.unit_price) AS total
FROM orders o
JOIN users u       ON u.id = o.user_id
JOIN order_items oi ON oi.order_id = o.id
GROUP BY o.id, o.created_at, u.email;

-- Reporting role sees the view, never the base tables
GRANT SELECT ON order_summary TO readonly;

-- Replace the body later without dropping dependents
CREATE OR REPLACE VIEW order_summary AS
SELECT o.id, o.created_at, u.email,
       sum(oi.quantity * oi.unit_price) AS total,
       count(*) AS line_count
FROM orders o
JOIN users u        ON u.id = o.user_id
JOIN order_items oi ON oi.order_id = o.id
GROUP BY o.id, o.created_at, u.email;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="What index types does PostgreSQL provide? (overview)">
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>B-tree:</strong> Default — equality and range (<code>=</code>, <code>&lt;</code>, <code>BETWEEN</code>, <code>ORDER BY</code>)</li>
              <li><strong>Hash:</strong> Equality only — rarely needed vs B-tree</li>
              <li><strong>GIN:</strong> Arrays, JSONB, full-text — inverted indexes</li>
              <li><strong>GiST:</strong> Geometric, range, some full-text and similarity work, and exclusion constraints</li>
              <li><strong>BRIN:</strong> Huge append-only tables with natural order (time-series)</li>
              <li><strong>SP-GiST:</strong> Non-balanced structures (IPs, text, points)</li>
              <li>Beyond the type, the useful variations are multi-column, expression, partial (with a <code>WHERE</code>), covering (<code>INCLUDE</code>), and unique</li>
            </ul>
            <CodeBlock
              title="Create indexes"
              language="sql"
              code={`CREATE INDEX idx_orders_created ON orders (created_at);
CREATE UNIQUE INDEX idx_users_email ON users (lower(email));
CREATE INDEX idx_docs_fts ON documents USING GIN (to_tsvector('english', body));
CREATE INDEX idx_events_brin ON events USING BRIN (occurred_at);`}
            />
            <CodeBlock
              title="Partial and covering indexes"
              language="sql"
              code={`-- Index only the rows you query, so the index stays small
CREATE INDEX idx_orders_open ON orders (user_id, created_at DESC)
  WHERE status = 'open';

-- INCLUDE carries extra columns so the query never touches the table
CREATE INDEX idx_orders_lookup ON orders (user_id) INCLUDE (total, status);

-- Which indexes are never used?
SELECT relname, indexrelname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY relname;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Views vs materialized views — what is the difference?">
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>VIEW:</strong> Stored query; runs against live tables every time — always fresh</li>
              <li><strong>MATERIALIZED VIEW:</strong> Stored result set on disk — fast reads, must <code>REFRESH</code></li>
              <li><code>REFRESH MATERIALIZED VIEW CONCURRENTLY</code> needs a unique index; allows reads during refresh</li>
              <li>Use a materialized view for expensive aggregations that tolerate staleness</li>
              <li>A materialized view takes real disk space and can have its own indexes, which a plain view cannot</li>
              <li>It starts out populated unless you create it <code>WITH NO DATA</code>, in which case querying it errors until the first refresh</li>
            </ul>
            <CodeBlock
              title="View and materialized view"
              language="sql"
              code={`CREATE VIEW active_users AS
SELECT id, email FROM users WHERE is_active;

CREATE MATERIALIZED VIEW daily_revenue AS
SELECT date_trunc('day', created_at) AS day, sum(total) AS revenue
FROM orders
GROUP BY 1;

CREATE UNIQUE INDEX daily_revenue_day_uidx ON daily_revenue (day);
REFRESH MATERIALIZED VIEW CONCURRENTLY daily_revenue;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Can you INSERT or UPDATE through a view?">
            <p>
              Sometimes. Postgres makes a view automatically updatable when it is simple enough. Anything more complex needs either an
              <code> INSTEAD OF</code> trigger or a rule.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Automatically updatable</strong> means exactly one table or view in the FROM clause, and no <code>DISTINCT</code>, <code>GROUP BY</code>, <code>HAVING</code>, <code>LIMIT</code>, <code>OFFSET</code>, window function, aggregate, or set operation such as UNION</li>
              <li>Columns that are expressions are read-only, but you can still update the plain columns next to them</li>
              <li>A join view is not automatically updatable, because Postgres cannot know which table your INSERT belongs to. Write an <code>INSTEAD OF</code> trigger and decide explicitly</li>
              <li><code>WITH CHECK OPTION</code> stops you from writing a row that the view would not show afterwards. Without it, you can insert a row into <code>active_users</code> that is not active and then cannot see it again</li>
              <li><code>LOCAL</code> checks only this view&apos;s condition, while <code>CASCADED</code> also checks the views underneath</li>
              <li>Permissions are checked as the view owner, which is how a view grants narrow write access without exposing the table</li>
            </ul>
            <CodeBlock
              title="Automatically updatable view with a check"
              language="sql"
              code={`CREATE VIEW active_users AS
SELECT id, email, is_active FROM users
WHERE is_active
WITH CHECK OPTION;

UPDATE active_users SET email = 'new@example.com' WHERE id = 1;  -- works

-- Rejected, because the row would disappear from the view
-- UPDATE active_users SET is_active = false WHERE id = 1;

-- Is this view writable? Ask the catalog
SELECT table_name, is_insertable_into, is_updatable
FROM information_schema.views
WHERE table_schema = 'public';`}
            />
            <CodeBlock
              title="Join view needs an INSTEAD OF trigger"
              language="sql"
              code={`CREATE VIEW user_profiles AS
SELECT u.id, u.email, p.display_name
FROM users u
JOIN profiles p ON p.user_id = u.id;

CREATE FUNCTION user_profiles_update() RETURNS trigger AS $fn$
BEGIN
  UPDATE users    SET email = NEW.email             WHERE id = OLD.id;
  UPDATE profiles SET display_name = NEW.display_name WHERE user_id = OLD.id;
  RETURN NEW;
END;
$fn$ LANGUAGE plpgsql;

CREATE TRIGGER user_profiles_update_trg
INSTEAD OF UPDATE ON user_profiles
FOR EACH ROW EXECUTE FUNCTION user_profiles_update();`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="Why does REFRESH MATERIALIZED VIEW CONCURRENTLY require a unique index?">
            <p>
              Because CONCURRENTLY does not replace the data wholesale. It builds the new result in a temporary place, compares it row by row against the old
              copy, and then applies only the differences. To match an old row with a new one it needs a key, and that key is the unique index.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Plain REFRESH:</strong> takes an ACCESS EXCLUSIVE lock, so every reader blocks until it finishes. Fast overall, but it is an outage for that view</li>
              <li><strong>REFRESH CONCURRENTLY:</strong> readers keep querying the old data the whole time. It is slower and does more I/O, because of the diff and the resulting UPDATE and DELETE work</li>
              <li>The unique index must be on the columns, not an expression, and it must cover all rows. A partial index does not qualify</li>
              <li>The index must exist before the refresh, and the view must already contain data. CONCURRENTLY cannot populate an empty materialized view</li>
              <li>Because it writes real changes, CONCURRENTLY creates dead rows, so the view itself needs vacuuming</li>
              <li>Neither form can run inside a transaction with other statements in the CONCURRENTLY case, so migration tools need care</li>
              <li>Common production pattern: a cron or a job queue refreshes concurrently every few minutes, and the view is documented as being a few minutes stale</li>
            </ul>
            <CodeBlock
              title="Set it up so CONCURRENTLY is possible"
              language="sql"
              code={`CREATE MATERIALIZED VIEW daily_revenue AS
SELECT date_trunc('day', created_at) AS day,
       sum(total) AS revenue,
       count(*)   AS order_count
FROM orders
GROUP BY 1;

-- Required: a full, non-partial unique index on plain columns
CREATE UNIQUE INDEX daily_revenue_day_uidx ON daily_revenue (day);

-- Readers are never blocked
REFRESH MATERIALIZED VIEW CONCURRENTLY daily_revenue;

-- Without the unique index you only get the blocking form
REFRESH MATERIALIZED VIEW daily_revenue;

-- How stale is it? Track refreshes yourself
SELECT schemaname, matviewname, ispopulated FROM pg_matviews;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="What is the difference between a unique index and a unique constraint?">
            <p>
              Under the hood they are almost the same thing: a unique constraint is implemented by a unique index. The difference is what the catalog records,
              and therefore what you can do with it.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Unique constraint:</strong> a named entry in <code>pg_constraint</code>. A foreign key can reference it, and <code>ON CONFLICT ON CONSTRAINT name</code> works. It is the declarative, self-documenting form</li>
              <li><strong>Unique index:</strong> only an index. It can do things a constraint cannot: cover an expression such as <code>lower(email)</code>, be partial with a <code>WHERE</code> clause, choose a different operator class, and be built with <code>CONCURRENTLY</code></li>
              <li><strong>The practical rule:</strong> if you can express the rule as a plain column list, use a constraint. If you need an expression or a partial rule, you must use a unique index</li>
              <li><strong>Zero-downtime trick:</strong> build the unique index with <code>CREATE UNIQUE INDEX CONCURRENTLY</code>, then attach it as a constraint with <code>ALTER TABLE ... ADD CONSTRAINT ... UNIQUE USING INDEX</code>. That gets you a real constraint without a long write lock</li>
              <li>Both treat NULLs as distinct by default, so several rows can have NULL in a unique column. Postgres 15 added <code>NULLS NOT DISTINCT</code> if you want the opposite</li>
              <li>You cannot drop the index that backs a constraint directly. Drop the constraint instead</li>
              <li>A unique index is not a substitute for a primary key, since a primary key also implies NOT NULL and is the default target for a foreign key</li>
            </ul>
            <CodeBlock
              title="Constraint, index, and the two things only an index can do"
              language="sql"
              code={`-- Declarative constraint: FKs can point at it
ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);

-- Only an index can be on an expression
CREATE UNIQUE INDEX users_email_lower_uidx ON users (lower(email));

-- Only an index can be partial: one active subscription per user
CREATE UNIQUE INDEX subs_one_active_uidx ON subscriptions (user_id)
  WHERE status = 'active';

-- Treat NULLs as equal (PG 15+)
CREATE UNIQUE INDEX teams_slug_uidx ON teams (org_id, slug) NULLS NOT DISTINCT;`}
            />
            <CodeBlock
              title="Add a unique constraint with no long lock"
              language="sql"
              code={`-- 1. Build the index without blocking writes (cannot be in a transaction)
CREATE UNIQUE INDEX CONCURRENTLY users_email_uidx ON users (email);

-- 2. Promote it to a real constraint instantly
ALTER TABLE users
  ADD CONSTRAINT users_email_key UNIQUE USING INDEX users_email_uidx;

-- Check what you ended up with
SELECT conname, contype, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'users'::regclass;`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

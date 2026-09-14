import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';
import InterviewQACard from '../../../components/InterviewQACard';

export const metadata = {
  title: 'Module 8: PL/pgSQL - Most Asked Interview Questions',
  description:
    'Most asked PL/pgSQL interview questions: functions vs procedures, triggers, EXCEPTION, SECURITY DEFINER, dynamic SQL, and when to use DB logic vs Prisma — Junior to Senior.',
};

export default function Module8Plpgsql() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Module 8: PL/pgSQL</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Most asked interview questions for Phase 8 — Junior → Senior. Includes PostgreSQL (latest) and Prisma where relevant.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="What is PL/pgSQL?">
            <p>
              PL/pgSQL is PostgreSQL&apos;s procedural language for writing functions, procedures, and triggers
              with variables, control flow, loops, and exception handling — beyond single SQL statements.
            </p>
          </InterviewQACard>

          <InterviewQACard level="Junior" question="What is the difference between a FUNCTION and a PROCEDURE?">
            <p>
              Functions return a value (or set) and are typically called from <code>SELECT</code>. Procedures
              (PostgreSQL 11+) are invoked with <code>CALL</code>, can control transactions
              (<code>COMMIT</code>/<code>ROLLBACK</code> inside in some contexts), and focus on side effects.
              Prefer functions for reusable computations; procedures for multi-step workflows.
            </p>
            <CodeBlock
              title="Function vs procedure"
              language="sql"
              code={`CREATE OR REPLACE FUNCTION add_numbers(a int, b int)
RETURNS int
LANGUAGE sql
AS $$ SELECT a + b; $$;

CREATE OR REPLACE PROCEDURE refresh_stats()
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY order_stats;
END;
$$;

SELECT add_numbers(1, 2);
CALL refresh_stats();`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="How do RETURNS and OUT parameters work?">
            <p>
              <code>RETURNS type</code> defines a single return type. <code>RETURNS TABLE (...)</code> or
              <code>SETOF</code> return multiple rows. <code>OUT</code>/<code>INOUT</code> parameters expose
              outputs without a single return expression — useful for multiple result values.
            </p>
            <CodeBlock
              title="RETURNS TABLE and OUT"
              language="sql"
              code={`CREATE OR REPLACE FUNCTION user_order_count(p_user_id int)
RETURNS TABLE (user_id int, order_count bigint)
LANGUAGE sql
AS $$
  SELECT o.user_id, COUNT(*)
  FROM orders o
  WHERE o.user_id = p_user_id
  GROUP BY o.user_id;
$$;

CREATE OR REPLACE FUNCTION split_name(
  full_name text,
  OUT first_name text,
  OUT last_name text
)
LANGUAGE plpgsql
AS $$
BEGIN
  first_name := split_part(full_name, ' ', 1);
  last_name := split_part(full_name, ' ', 2);
END;
$$;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="What control-flow constructs exist in PL/pgSQL?">
            <p>
              <code>IF / ELSIF / ELSE</code>, <code>CASE</code>, <code>LOOP</code>, <code>WHILE</code>,
              <code>FOR</code> (integer or query), <code>EXIT</code>, <code>CONTINUE</code>, and
              <code>RETURN</code> / <code>RETURN NEXT</code> / <code>RETURN QUERY</code>.
            </p>
            <CodeBlock
              title="IF and FOR"
              language="sql"
              code={`CREATE OR REPLACE FUNCTION classify_amount(n int)
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  IF n IS NULL THEN
    RETURN 'unknown';
  ELSIF n >= 1000 THEN
    RETURN 'high';
  ELSE
    RETURN 'normal';
  END IF;
END;
$$;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="Can Prisma call PostgreSQL functions?">
            <p>
              Yes — via <code>$queryRaw</code> / <code>$executeRaw</code>, or by mapping some functions in raw
              SQL views. Prisma does not generate typed client methods for arbitrary PL/pgSQL functions
              automatically.
            </p>
            <CodeBlock
              title="Calling a DB function from Prisma"
              language="typescript"
              code={`const rows = await prisma.$queryRaw<{ classify_amount: string }[]>\`
  SELECT classify_amount(1500) AS classify_amount
\`;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="How do EXCEPTION blocks work in PL/pgSQL?">
            <p>
              A <code>BEGIN ... EXCEPTION WHEN ... THEN ... END</code> block catches errors similarly to try/catch.
              You can handle specific conditions (<code>unique_violation</code>, <code>no_data_found</code>) or
              <code>OTHERS</code>. Use for recovery/logging — not to silently swallow data integrity failures.
            </p>
            <CodeBlock
              title="EXCEPTION"
              language="sql"
              code={`CREATE OR REPLACE FUNCTION safe_insert_user(p_email text)
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO users (email) VALUES (p_email);
  RETURN 'ok';
EXCEPTION
  WHEN unique_violation THEN
    RETURN 'duplicate';
  WHEN OTHERS THEN
    RAISE NOTICE 'unexpected: %', SQLERRM;
    RETURN 'error';
END;
$$;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Explain triggers: BEFORE vs AFTER, and NEW / OLD.">
            <p>
              Triggers fire on <code>INSERT</code>/<code>UPDATE</code>/<code>DELETE</code> (and truncate for
              statement triggers). <code>BEFORE</code> runs prior to the row change — you can modify
              <code>NEW</code> or cancel the operation. <code>AFTER</code> runs once the change is applied —
              good for auditing. <code>NEW</code> is the incoming row (INSERT/UPDATE);
              <code>OLD</code> is the previous row (UPDATE/DELETE).
            </p>
            <CodeBlock
              title="BEFORE UPDATE trigger"
              language="sql"
              code={`CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;  -- BEFORE row triggers must return NEW/OLD
END;
$$;

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What is FOR EACH ROW vs FOR EACH STATEMENT?">
            <p>
              Row-level triggers fire once per affected row and can see <code>NEW</code>/<code>OLD</code>.
              Statement-level triggers fire once per SQL statement and do not get per-row <code>NEW</code>/
              <code>OLD</code> (unless using transition tables). Use statement triggers for bulk-aware logic.
            </p>
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What does SECURITY DEFINER mean, and what are the risks?">
            <p>
              <code>SECURITY DEFINER</code> runs the function with the privileges of the owner, not the caller —
              useful for controlled privileged operations. Risks: privilege escalation if the function trusts
              mutable search_path or unsafe dynamic SQL. Harden with <code>SET search_path</code>, validate
              inputs, and grant <code>EXECUTE</code> narrowly.
            </p>
            <CodeBlock
              title="Hardened SECURITY DEFINER"
              language="sql"
              code={`CREATE OR REPLACE FUNCTION admin_mark_paid(p_order_id bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE orders SET status = 'paid' WHERE id = p_order_id;
END;
$$;

REVOKE ALL ON FUNCTION admin_mark_paid(bigint) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_mark_paid(bigint) TO app_user;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="When should business logic live in the database vs the application (Prisma)?">
            <p>
              Put in the DB: constraints, simple defaults, integrity rules, audit triggers, and performance-critical
              set-based operations close to data. Put in the app: orchestration, external APIs, complex domain
              workflows, and logic that must be tested/deployed with application code. Overusing PL/pgSQL makes
              versioning, testing, and multi-DB strategies harder.
            </p>
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How do you raise errors and notices from PL/pgSQL?">
            <p>
              Use <code>RAISE EXCEPTION</code> to abort, <code>RAISE NOTICE</code>/<code>WARNING</code> for
              diagnostics. You can attach <code>ERRCODE</code> and <code>USING MESSAGE</code> for clearer API errors.
            </p>
            <CodeBlock
              title="RAISE"
              language="sql"
              code={`IF p_amount <= 0 THEN
  RAISE EXCEPTION 'amount must be positive'
    USING ERRCODE = 'check_violation';
END IF;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="What are the risks of dynamic SQL in PL/pgSQL?">
            <p>
              Dynamic SQL (<code>EXECUTE</code> / <code>format()</code>) built from string concatenation is an
              SQL injection vector. Always pass values via <code>USING</code> parameters and identifiers via
              <code>format('%I', ...)</code>. Avoid dynamic SQL unless the statement shape must change at runtime.
            </p>
            <CodeBlock
              title="Safe dynamic SQL"
              language="sql"
              code={`CREATE OR REPLACE FUNCTION count_in_table(p_table text)
RETURNS bigint
LANGUAGE plpgsql
AS $$
DECLARE
  result bigint;
BEGIN
  EXECUTE format('SELECT COUNT(*) FROM %I', p_table)
    INTO result;
  RETURN result;
END;
$$;

-- Values: EXECUTE 'SELECT * FROM users WHERE id = $1' USING p_id;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="How do trigger transition tables work (PostgreSQL 10+)?">
            <p>
              Statement-level <code>AFTER</code> triggers can declare <code>REFERENCING NEW TABLE AS ...</code>
              / <code>OLD TABLE AS ...</code> to query the full set of changed rows in one shot — better than
              per-row triggers for bulk inserts/updates.
            </p>
            <CodeBlock
              title="Transition tables"
              language="sql"
              code={`CREATE OR REPLACE FUNCTION audit_orders_stmt()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO order_audit (order_id, action, at)
  SELECT id, TG_OP, NOW() FROM new_rows;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_orders_audit
AFTER INSERT ON orders
REFERENCING NEW TABLE AS new_rows
FOR EACH STATEMENT
EXECUTE FUNCTION audit_orders_stmt();`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="How do you write a set-returning function efficiently?">
            <p>
              Prefer <code>RETURN QUERY</code> / SQL-language set functions over row-by-row
              <code>RETURN NEXT</code> loops. Let the planner inline SQL functions when possible
              (<code>LANGUAGE sql STABLE/IMMUTABLE</code>).
            </p>
            <CodeBlock
              title="RETURN QUERY"
              language="sql"
              code={`CREATE OR REPLACE FUNCTION recent_orders(p_days int)
RETURNS SETOF orders
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM orders
  WHERE created_at >= NOW() - make_interval(days => p_days);
END;
$$;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="How do triggers interact with Prisma migrations and application updates?">
            <p>
              Prisma Migrate can apply raw SQL migrations for triggers/functions, but the Prisma Client will not
              model trigger side effects. Document hidden DB behavior (auto timestamps, audit tables) so app
              developers do not double-apply logic. Prefer DB constraints + limited triggers over duplicating
              rules in both Prisma middleware and PL/pgSQL.
            </p>
            <CodeBlock
              title="Prisma SQL migration snippet"
              language="sql"
              code={`-- migrations/20260101000000_add_updated_at_trigger/migration.sql
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="What is the difference between IMMUTABLE, STABLE, and VOLATILE function volatility?">
            <p>
              <code>IMMUTABLE</code>: same args → same result forever (index expressions, generated columns).
              <code>STABLE</code>: constant within a statement (can read DB, but not change mid-query).
              <code>VOLATILE</code> (default): can change anytime / has side effects. Wrong labels can cause
              incorrect planner optimizations or illegal index usage.
            </p>
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 3: Triggers - Module 8 - Most Asked Interview Questions',
  description:
    'Most asked PostgreSQL trigger interview questions: BEFORE vs AFTER, NEW and OLD, FOR EACH ROW vs FOR EACH STATEMENT, an updated_at trigger, an audit log trigger, returning NULL from a BEFORE trigger, trigger firing order, and transition tables.',
};

export default function M8L3Triggers() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 3: Triggers</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          A trigger is code the database runs automatically when a row changes. This lesson covers when a trigger
          fires, what it can see and change, the two patterns interviewers always ask you to write, and the
          surprises that come with them.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="Explain triggers: BEFORE vs AFTER, and NEW / OLD.">
            <p>
              Triggers fire on <code>INSERT</code>, <code>UPDATE</code> and <code>DELETE</code>, plus
              <code>TRUNCATE</code> for statement-level triggers. Timing decides what you can do.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <code>BEFORE</code> runs before the row is written. You can change the row on its way in, or
                cancel the operation entirely.
              </li>
              <li>
                <code>AFTER</code> runs once the change is applied. The row already exists, so this is the right
                place for auditing and for anything that references the new row.
              </li>
              <li>
                <code>NEW</code> is the incoming row, available on <code>INSERT</code> and <code>UPDATE</code>.
              </li>
              <li>
                <code>OLD</code> is the previous row, available on <code>UPDATE</code> and <code>DELETE</code>.
              </li>
            </ul>
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
            <p>
              Two variables are always set for you. <code>TG_OP</code> holds the operation as text, so one
              function can serve inserts, updates and deletes. <code>TG_TABLE_NAME</code> holds the table name, so
              one function can serve many tables.
            </p>
            <CodeBlock
              title="One function, three operations"
              language="sql"
              code={`CREATE OR REPLACE FUNCTION describe_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    RAISE NOTICE 'inserted into % id %', TG_TABLE_NAME, NEW.id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    RAISE NOTICE 'changed % from % to %', NEW.id, OLD.status, NEW.status;
    RETURN NEW;
  ELSE
    RAISE NOTICE 'deleted % id %', TG_TABLE_NAME, OLD.id;
    RETURN OLD;
  END IF;
END;
$$;`}
            />
            <p>
              Referring to the wrong variable is a runtime error, not a compile error. Using <code>NEW</code> in a
              <code>DELETE</code> trigger, or <code>OLD</code> in an <code>INSERT</code> trigger, fails only when
              that path actually runs. Always branch on <code>TG_OP</code>.
            </p>
            <p>
              A trigger function is declared <code>RETURNS trigger</code> and takes no arguments. Extra arguments
              can be passed in the <code>CREATE TRIGGER</code> statement and read from
              <code>TG_ARGV</code>, which is how a generic function is configured per table.
            </p>
          </InterviewQACard>

          <InterviewQACard level="Junior" question="How do you write an updated_at trigger?">
            <p>
              This is the single most requested trigger in interviews. You want every <code>UPDATE</code> to stamp
              the current time, without trusting the application to remember.
            </p>
            <p>
              It must be <code>BEFORE UPDATE</code> and <code>FOR EACH ROW</code>. Only a
              <code>BEFORE</code> trigger can change the row that is about to be written. An
              <code>AFTER</code> trigger would have to issue a second <code>UPDATE</code>, which would fire the
              trigger again.
            </p>
            <CodeBlock
              title="The standard version"
              language="sql"
              code={`CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_users_touch
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION touch_updated_at();`}
            />
            <p>
              One improvement worth mentioning. If an <code>UPDATE</code> sets a row to the values it already had,
              the plain version still bumps the timestamp and still writes a new row version. Adding
              <code>WHEN (OLD.* IS DISTINCT FROM NEW.*)</code> skips those no-op updates entirely, which reduces
              write traffic and avoids misleading timestamps.
            </p>
            <CodeBlock
              title="Skip updates that change nothing"
              language="sql"
              code={`CREATE TRIGGER trg_users_touch
BEFORE UPDATE ON users
FOR EACH ROW
WHEN (OLD.* IS DISTINCT FROM NEW.*)
EXECUTE FUNCTION touch_updated_at();`}
            />
            <p>
              <code>IS DISTINCT FROM</code> rather than <code>&lt;&gt;</code> matters here, because it treats two
              NULLs as equal instead of returning NULL. The same idea also lets you fire a trigger only when one
              specific column changes.
            </p>
            <CodeBlock
              title="Fire only when status changes"
              language="sql"
              code={`CREATE TRIGGER trg_orders_status_changed
AFTER UPDATE OF status ON orders
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION log_status_change();`}
            />
            <p>
              <code>UPDATE OF status</code> narrows the trigger to statements that mention that column, and the
              <code>WHEN</code> clause confirms the value really changed. Both together mean the function body
              runs only when it needs to.
            </p>
            <p>
              The reason to do this in the database rather than the ORM: a raw SQL fix, a data migration, or a
              second service writing to the same table all bypass application code. A trigger cannot be bypassed.
              Prisma&apos;s <code>@updatedAt</code> only works for writes that go through Prisma.
            </p>
            <CodeBlock
              title="Prisma schema plus the trigger"
              language="prisma"
              code={`model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  updatedAt DateTime @updatedAt @map("updated_at")
  // The trigger is the real guarantee; @updatedAt keeps
  // Prisma's own writes consistent with it.
}`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="What is FOR EACH ROW vs FOR EACH STATEMENT?">
            <p>
              Row-level triggers fire once per affected row and can see <code>NEW</code> and <code>OLD</code>.
              Statement-level triggers fire once per SQL statement and do not get per-row <code>NEW</code> and
              <code>OLD</code>, unless you use transition tables.
            </p>
            <p>
              The consequence is cost. One <code>UPDATE</code> touching 100,000 rows fires a row trigger 100,000
              times and a statement trigger once. Use statement triggers for bulk-aware logic.
            </p>
            <CodeBlock
              title="Two triggers, two firing counts"
              language="sql"
              code={`-- Fires once per row
CREATE TRIGGER trg_row
AFTER INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION per_row_fn();

-- Fires once per statement, even for a 100k-row insert
CREATE TRIGGER trg_stmt
AFTER INSERT ON orders
FOR EACH STATEMENT
EXECUTE FUNCTION per_statement_fn();`}
            />
            <p>
              A statement trigger fires even when the statement matched no rows, which is occasionally useful and
              occasionally surprising. It is also the only kind that can fire on <code>TRUNCATE</code>, because
              <code>TRUNCATE</code> removes rows without touching them individually. That last point matters for
              audit design: a row-level delete trigger will not record a
              <code>TRUNCATE</code> at all.
            </p>
            <p>
              Statement triggers cannot modify rows, since there is no <code>NEW</code> to change and the
              statement has already been decided. They must return NULL. For validating or summarising a whole
              batch, combine a statement trigger with transition tables, covered at the end of this lesson.
            </p>
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How do you write an audit log trigger?">
            <p>
              An audit log records who changed what and when, in a separate table nobody updates. The standard
              shape is one <code>AFTER</code> row trigger writing a JSONB snapshot, so a single generic function
              serves every table.
            </p>
            <p>
              It must be <code>AFTER</code>, because you want to record what was actually written, including any
              values other <code>BEFORE</code> triggers or defaults filled in.
            </p>
            <CodeBlock
              title="The audit table"
              language="sql"
              code={`CREATE TABLE audit_log (
  id          bigserial PRIMARY KEY,
  table_name  text        NOT NULL,
  row_id      text        NOT NULL,
  action      text        NOT NULL,
  old_data    jsonb,
  new_data    jsonb,
  changed_by  text        NOT NULL DEFAULT current_user,
  changed_at  timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX audit_log_lookup_idx
  ON audit_log (table_name, row_id, changed_at DESC);`}
            />
            <CodeBlock
              title="One generic trigger function"
              language="sql"
              code={`CREATE OR REPLACE FUNCTION write_audit_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (table_name, row_id, action, new_data)
    VALUES (TG_TABLE_NAME, NEW.id::text, TG_OP, to_jsonb(NEW));
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (table_name, row_id, action, old_data, new_data)
    VALUES (TG_TABLE_NAME, NEW.id::text, TG_OP, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;

  ELSE
    INSERT INTO audit_log (table_name, row_id, action, old_data)
    VALUES (TG_TABLE_NAME, OLD.id::text, TG_OP, to_jsonb(OLD));
    RETURN OLD;
  END IF;
END;
$$;`}
            />
            <CodeBlock
              title="Attach it to any table"
              language="sql"
              code={`CREATE TRIGGER trg_users_audit
AFTER INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW
EXECUTE FUNCTION write_audit_log();

CREATE TRIGGER trg_orders_audit
AFTER INSERT OR UPDATE OR DELETE ON orders
FOR EACH ROW
EXECUTE FUNCTION write_audit_log();`}
            />
            <p>
              <code>to_jsonb(NEW)</code> converts the whole row to JSON without naming columns, so the function
              keeps working when you add a column. Store only the changed keys if volume is a concern.
            </p>
            <CodeBlock
              title="Recording only what changed"
              language="sql"
              code={`-- Keys whose values differ between OLD and NEW
SELECT jsonb_object_agg(key, value)
FROM jsonb_each(to_jsonb(NEW))
WHERE to_jsonb(OLD) -> key IS DISTINCT FROM value;`}
            />
            <p>Four points a strong answer raises:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Never log secrets.</strong> Strip sensitive columns with the JSONB minus operator, for
                example <code>to_jsonb(NEW) - &apos;password_hash&apos;</code>.
              </li>
              <li>
                <strong>The audit row is part of the transaction.</strong> If the transaction rolls back, the
                audit entry disappears too. That is usually what you want for a change log, but it means you
                cannot use this to record failed attempts.
              </li>
              <li>
                <strong><code>current_user</code> is the database role, not the person.</strong> With a pooled
                connection every request is the same role. Pass the real actor in through a session setting.
              </li>
              <li>
                <strong>It doubles your write volume.</strong> Every insert becomes two. For very high-throughput
                tables, use a statement trigger with transition tables instead, so one bulk insert writes one
                batch of audit rows.
              </li>
            </ul>
            <CodeBlock
              title="Passing the real user through"
              language="sql"
              code={`-- The application sets this at the start of each transaction
SET LOCAL app.current_user_id = '42';

-- The trigger reads it; the second argument means "do not error if unset"
-- changed_by := COALESCE(current_setting('app.current_user_id', true), current_user);`}
            />
            <CodeBlock
              title="Prisma setting the actor"
              language="typescript"
              code={`await prisma.$transaction(async (tx) => {
  await tx.$executeRawUnsafe('SELECT set_config($1, $2, true)',
    'app.current_user_id', String(userId));

  await tx.order.update({ where: { id }, data: { status: 'paid' } });
  // the audit trigger now records userId, not just the DB role
});`}
            />
            <p>
              <code>set_config</code> with a third argument of true is the function form of
              <code>SET LOCAL</code>, so the value lasts only for that transaction. That is essential with a
              connection pool, where the same connection serves the next request.
            </p>
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What does returning NULL from a BEFORE trigger do?">
            <p>
              It cancels the operation for that row. The row is not inserted, updated or deleted, no
              <code>AFTER</code> trigger fires for it, and no error is raised. The statement reports one fewer
              affected row and carries on.
            </p>
            <p>
              That silence is the whole point of the question. The caller gets a successful response and assumes
              the write happened.
            </p>
            <CodeBlock
              title="Silently dropping a row"
              language="sql"
              code={`CREATE OR REPLACE FUNCTION drop_test_users()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.email LIKE '%@test.invalid' THEN
    RETURN NULL;  -- insert is skipped, no error
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_users_filter
BEFORE INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION drop_test_users();`}
            />
            <p>The return value rules, which are worth memorising:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <code>BEFORE</code> row trigger: return <code>NEW</code> to continue with those values, a modified
                <code>NEW</code> to change the row, or <code>NULL</code> to skip the row.
              </li>
              <li>
                <code>BEFORE DELETE</code> row trigger: return <code>OLD</code> to allow the delete, or
                <code>NULL</code> to block it.
              </li>
              <li>
                <code>AFTER</code> row trigger: the return value is ignored. Return <code>NULL</code> by
                convention.
              </li>
              <li>
                Statement-level trigger: the return value is ignored. Return <code>NULL</code>.
              </li>
            </ul>
            <p>
              Forgetting to return anything is a common bug. A PL/pgSQL function that reaches
              <code>END</code> without a <code>RETURN</code> returns NULL, so a
              <code>BEFORE</code> trigger that you thought only logged something will silently discard every row.
            </p>
            <CodeBlock
              title="The accidental data loss bug"
              language="sql"
              code={`-- BUG: no RETURN, so every insert is silently dropped
CREATE OR REPLACE FUNCTION log_only()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE NOTICE 'inserting %', NEW.id;
END;
$$;`}
            />
            <p>
              Because it fails quietly, returning <code>NULL</code> is a poor way to enforce a rule. If the write
              is invalid, raise an exception so the caller knows. Use <code>RETURN NULL</code> only when skipping
              really is the intended, documented behaviour, such as discarding duplicate sensor readings.
            </p>
            <CodeBlock
              title="Reject loudly instead"
              language="sql"
              code={`IF NEW.email NOT LIKE '%@%' THEN
  RAISE EXCEPTION 'invalid email: %', NEW.email
    USING ERRCODE = 'check_violation';
END IF;
RETURN NEW;`}
            />
            <p>
              This behaviour also breaks ORM assumptions badly. Prisma&apos;s <code>create</code> expects to get
              the created record back, and a trigger that returns NULL makes the
              <code>INSERT ... RETURNING</code> produce no row, which surfaces as a confusing client error rather
              than a clear validation message.
            </p>
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="What order do triggers fire in when a table has several?">
            <p>
              Within the same timing and level, triggers fire in alphabetical order by trigger name. There is no
              priority setting, so the name is the only control you have. That is why many codebases prefix
              trigger names with numbers.
            </p>
            <CodeBlock
              title="Naming to control order"
              language="sql"
              code={`-- Fires first
CREATE TRIGGER t10_validate BEFORE INSERT ON orders
FOR EACH ROW EXECUTE FUNCTION validate_order();

-- Fires second
CREATE TRIGGER t20_set_defaults BEFORE INSERT ON orders
FOR EACH ROW EXECUTE FUNCTION set_order_defaults();`}
            />
            <p>
              The full sequence for a single statement, which is the complete answer to this question:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <code>BEFORE</code> statement triggers, in name order.
              </li>
              <li>
                For each row: <code>BEFORE</code> row triggers in name order. Each one receives the
                <code>NEW</code> returned by the previous one, so they chain. If any returns
                <code>NULL</code>, the rest are skipped and the row is dropped.
              </li>
              <li>
                The row is written, and <code>NOT NULL</code>, <code>CHECK</code> and unique constraints are
                checked. So a <code>BEFORE</code> trigger can fix up a row to satisfy a constraint.
              </li>
              <li>
                <code>AFTER</code> row triggers, in name order. These are queued during the statement and fire at
                the end of it, not immediately after each row.
              </li>
              <li>
                <code>AFTER</code> statement triggers, in name order.
              </li>
            </ul>
            <p>
              The queuing of <code>AFTER</code> row triggers has a practical consequence: an
              <code>AFTER</code> trigger sees the table as it is once the whole statement has finished, not as it
              was mid-statement. Two other ordering facts matter:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Foreign key constraints are implemented as <code>AFTER</code> triggers with reserved names
                starting with <code>RI_ConstraintTrigger</code>. Since they sort separately from user triggers,
                you should not rely on your trigger running before or after a referential check.
              </li>
              <li>
                A <code>CONSTRAINT TRIGGER</code> declared <code>DEFERRABLE INITIALLY DEFERRED</code> fires at
                commit time instead, after every statement in the transaction. That is how you validate a rule
                that is legitimately broken part-way through a multi-step change.
              </li>
            </ul>
            <CodeBlock
              title="A deferred constraint trigger"
              language="sql"
              code={`CREATE CONSTRAINT TRIGGER trg_check_balance
AFTER INSERT OR UPDATE ON accounts
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION assert_balance_non_negative();
-- Runs at COMMIT, so a debit and its matching credit
-- can happen in either order within the transaction.`}
            />
            <p>
              Finally, triggers can cascade: a trigger on <code>orders</code> that writes to
              <code>audit_log</code> fires any trigger on <code>audit_log</code> too. PostgreSQL does not detect
              cycles for you, so a trigger that updates its own table can recurse until it hits the stack depth
              limit. Guard with a <code>WHEN</code> clause, or check
              <code>pg_trigger_depth()</code>.
            </p>
            <CodeBlock
              title="Preventing recursion"
              language="sql"
              code={`CREATE TRIGGER trg_orders_rollup
AFTER UPDATE ON orders
FOR EACH ROW
WHEN (pg_trigger_depth() = 1)
EXECUTE FUNCTION update_order_rollup();`}
            />
            <p>
              Practical advice for interviews: say that you keep triggers few and single-purpose precisely because
              ordering is fragile. If two pieces of logic must run in a guaranteed sequence, put them in one
              trigger function rather than relying on names.
            </p>
          </InterviewQACard>

          <InterviewQACard level="Senior" question="How do trigger transition tables work (PostgreSQL 10+)?">
            <p>
              Statement-level <code>AFTER</code> triggers can declare
              <code>REFERENCING NEW TABLE AS ...</code> or <code>OLD TABLE AS ...</code>. These give you the full
              set of changed rows as if they were a temporary table, so you can query them all in one statement
              instead of firing per row.
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
            <p>
              The performance difference is the reason to use them. Inserting 100,000 orders with a row trigger
              runs 100,000 separate inserts into the audit table. With a transition table it is one set-based
              insert, which is dramatically faster.
            </p>
            <p>
              For an <code>UPDATE</code> you get both tables, and you join them on the primary key to compare
              before and after across the whole batch.
            </p>
            <CodeBlock
              title="Comparing old and new in bulk"
              language="sql"
              code={`CREATE OR REPLACE FUNCTION log_status_changes_stmt()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO status_history (order_id, from_status, to_status, at)
  SELECT n.id, o.status, n.status, NOW()
  FROM new_rows n
  JOIN old_rows o ON o.id = n.id
  WHERE o.status IS DISTINCT FROM n.status;

  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_orders_status_stmt
AFTER UPDATE ON orders
REFERENCING OLD TABLE AS old_rows NEW TABLE AS new_rows
FOR EACH STATEMENT
EXECUTE FUNCTION log_status_changes_stmt();`}
            />
            <p>They are also the right tool for validating an invariant across a whole batch.</p>
            <CodeBlock
              title="Batch validation"
              language="sql"
              code={`CREATE OR REPLACE FUNCTION assert_no_negative_stmt()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  bad int;
BEGIN
  SELECT COUNT(*) INTO bad FROM new_rows WHERE balance < 0;

  IF bad > 0 THEN
    RAISE EXCEPTION '% account(s) would go negative', bad
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NULL;
END;
$$;`}
            />
            <p>The limits, which a senior answer should state:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <code>AFTER</code> only. You cannot use transition tables in a <code>BEFORE</code> trigger,
                because the rows do not exist yet.
              </li>
              <li>
                Read-only. They are a snapshot of the change, not the table, so you cannot update them to alter
                what was written.
              </li>
              <li>
                <code>OLD TABLE</code> needs <code>UPDATE</code> or <code>DELETE</code>;
                <code>NEW TABLE</code> needs <code>INSERT</code> or <code>UPDATE</code>. A single trigger
                declared for all three operations cannot have both, so you normally create separate triggers per
                operation.
              </li>
              <li>
                They are held in memory up to <code>work_mem</code> and spill to disk beyond that, so an enormous
                single statement still costs memory.
              </li>
              <li>
                They are not populated for rows changed by <code>ON CONFLICT DO UPDATE</code> in the way people
                often assume, so test upsert paths explicitly.
              </li>
            </ul>
            <p>
              Rule of thumb: use a row trigger when you must modify the row or react to each row individually, and
              a statement trigger with transition tables when you are recording, summarising or validating a
              batch.
            </p>
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

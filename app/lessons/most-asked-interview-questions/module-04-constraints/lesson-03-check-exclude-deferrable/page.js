import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 3: CHECK, EXCLUDE, and Deferrable Constraints - Module 4 - Most Asked Interview Questions',
  description:
    'Most asked interview questions on CHECK constraints, NOT VALID then VALIDATE, CHECK vs trigger vs app validation, EXCLUDE constraints for overlapping ranges, and deferrable constraints in PostgreSQL.',
};

export default function M4L3CheckExcludeDeferrable() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 3: CHECK, EXCLUDE, and Deferrable Constraints</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          These are the rules for “this value must make sense.” CHECK covers most cases, EXCLUDE handles
          overlaps like double-booked rooms, and deferrable decides when the rule is checked.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="What is a CHECK constraint?">
            <ul className="list-disc pl-6 space-y-1">
              <li>Enforces a boolean expression on each row</li>
              <li>Good for ranges, allowed values, cross-column rules</li>
              <li>Expression must be immutable / deterministic for the row</li>
              <li>A row passes if the expression is true <em>or</em> unknown, so a NULL column quietly passes a CHECK. Add <code>NOT NULL</code> if the value must exist</li>
            </ul>
            <CodeBlock
              title="CHECK examples"
              language="sql"
              code={`CREATE TABLE products (
  id           BIGSERIAL PRIMARY KEY,
  price        NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  stock        INT NOT NULL CHECK (stock >= 0),
  discount_pct NUMERIC(5, 2),
  CONSTRAINT products_discount_chk
    CHECK (discount_pct IS NULL OR discount_pct BETWEEN 0 AND 100)
);

-- Cross-column rule: end must be after start
CREATE TABLE campaigns (
  id         BIGSERIAL PRIMARY KEY,
  starts_at  TIMESTAMPTZ NOT NULL,
  ends_at    TIMESTAMPTZ NOT NULL,
  CONSTRAINT campaigns_range_chk CHECK (ends_at > starts_at)
);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="Can a CHECK constraint reference another table?">
            <p>
              No. A CHECK can only look at the columns of the row being inserted or updated. It cannot run a
              subquery against another table.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>A subquery inside CHECK is rejected outright by PostgreSQL</li>
              <li>The reason: Postgres only re-checks the constraint when that row changes. If the other table changed later, the rule would silently become false and nobody would notice</li>
              <li>Wrapping the subquery in a function to sneak past the parser is a known trap. It “works” until a concurrent transaction or a restore validates rows in a different order, then you have bad data</li>
              <li>Correct tools for cross-table rules: a <strong>foreign key</strong> when it is just “this must exist”, a <strong>trigger</strong> with proper locking for real logic, or an <strong>EXCLUDE</strong> constraint for overlap rules inside one table</li>
            </ul>
            <CodeBlock
              title="What fails and what to use instead"
              language="sql"
              code={`-- Rejected: cannot use a subquery in CHECK
ALTER TABLE orders
  ADD CONSTRAINT orders_user_exists_chk
  CHECK (user_id IN (SELECT id FROM users));

-- Correct: this is exactly what a foreign key is for
ALTER TABLE orders
  ADD CONSTRAINT orders_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users (id);`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="When do you use a CHECK, a trigger, or application validation?">
            <p>
              Use the cheapest tool that cannot be bypassed. A CHECK is enforced by the database for every
              writer, forever. Application code only protects the one code path you remembered.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>CHECK:</strong> simple, row-local, always-true rules. Prices are not negative, a status is one of four words, an end date is after a start date. Fast and impossible to bypass</li>
              <li><strong>Trigger:</strong> rules that need other rows or tables, or that must write something (audit rows, keeping a denormalised total in sync). More power, but hidden logic, extra cost per row, and you must think about locking and ordering</li>
              <li><strong>Application validation:</strong> the friendly layer. Good error messages, format checks, business flows, anything needing an API call. It is for user experience, not for safety, because scripts and other services skip it</li>
              <li>The usual production answer is “both”: validate in the app for a nice message, and keep the database constraint as the real guarantee</li>
              <li>Rules that change often (a fraud threshold, a pricing tier) belong in a config table read by the app, not in a CHECK you would need a migration to change</li>
            </ul>
            <CodeBlock
              title="Row-local rule: use CHECK"
              language="sql"
              code={`ALTER TABLE payments
  ADD CONSTRAINT payments_status_chk
  CHECK (status IN ('pending', 'captured', 'refunded', 'failed'));`}
            />
            <CodeBlock
              title="Cross-row rule: needs a trigger"
              language="sql"
              code={`CREATE FUNCTION enforce_credit_limit() RETURNS trigger AS $fn$
DECLARE
  outstanding NUMERIC;
BEGIN
  -- Lock the customer row so two concurrent orders cannot both pass the check
  PERFORM 1 FROM customers WHERE id = NEW.customer_id FOR UPDATE;

  SELECT COALESCE(SUM(total), 0) INTO outstanding
  FROM orders
  WHERE customer_id = NEW.customer_id AND status = 'unpaid';

  IF outstanding + NEW.total > 10000 THEN
    RAISE EXCEPTION 'credit limit exceeded for customer %', NEW.customer_id;
  END IF;

  RETURN NEW;
END;
$fn$ LANGUAGE plpgsql;

CREATE TRIGGER orders_credit_limit
  BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION enforce_credit_limit();`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What does ADD CONSTRAINT ... NOT VALID then VALIDATE CONSTRAINT do?">
            <p>
              It splits adding a constraint into two steps, so you never hold a heavy lock while scanning a
              huge table.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Step 1, <code>NOT VALID</code>:</strong> the constraint starts applying to new inserts and updates immediately, but existing rows are not scanned. This is quick and needs only a brief lock</li>
              <li><strong>Step 2, <code>VALIDATE CONSTRAINT</code>:</strong> scans the existing rows with a weaker lock that still allows reads and writes. If any old row fails, this step errors and the constraint stays <code>NOT VALID</code></li>
              <li>Clean up the bad rows first, otherwise step 2 keeps failing</li>
              <li>Works for CHECK and FOREIGN KEY constraints. It does not apply to <code>NOT NULL</code> in older versions; the common trick there is a <code>NOT VALID</code> CHECK such as <code>col IS NOT NULL</code>, validated later</li>
              <li>The planner will not use a <code>NOT VALID</code> CHECK for optimisations like partition pruning until you validate it</li>
            </ul>
            <CodeBlock
              title="NOT VALID then VALIDATE"
              language="sql"
              code={`ALTER TABLE orders
  ADD CONSTRAINT orders_total_chk CHECK (total >= 0) NOT VALID;

ALTER TABLE orders VALIDATE CONSTRAINT orders_total_chk;

-- Check the current state
SELECT conname, convalidated
FROM pg_constraint
WHERE conrelid = 'orders'::regclass;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="What are deferrable constraints?">
            <ul className="list-disc pl-6 space-y-1">
              <li>Normally constraints are checked immediately after each statement</li>
              <li><code>DEFERRABLE</code> + <code>INITIALLY DEFERRED</code> checks at transaction commit</li>
              <li>Useful for circular FKs or multi-row swaps that temporarily violate uniqueness</li>
              <li>Only UNIQUE, PRIMARY KEY, EXCLUDE, and FOREIGN KEY can be deferred. CHECK and NOT NULL are always immediate</li>
              <li>You can also declare <code>DEFERRABLE INITIALLY IMMEDIATE</code> and switch on demand with <code>SET CONSTRAINTS ALL DEFERRED</code> inside a transaction</li>
              <li>Cost: Postgres queues the pending checks, so a huge deferred batch uses memory and the error arrives late, at commit</li>
              <li>Overuse hides bugs; prefer redesign when possible</li>
            </ul>
            <CodeBlock
              title="Deferrable UNIQUE"
              language="sql"
              code={`CREATE TABLE seats (
  id        BIGSERIAL PRIMARY KEY,
  room_id   BIGINT NOT NULL,
  seat_no   INT NOT NULL,
  CONSTRAINT seats_room_seat_uidx UNIQUE (room_id, seat_no) DEFERRABLE INITIALLY DEFERRED
);

BEGIN;
UPDATE seats SET seat_no = seat_no + 100 WHERE room_id = 1; -- temporary duplicates OK
UPDATE seats SET seat_no = seat_no - 99 WHERE room_id = 1;
COMMIT; -- checked here`}
            />
            <CodeBlock
              title="Defer only for one transaction"
              language="sql"
              code={`BEGIN;
SET CONSTRAINTS ALL DEFERRED;   -- affects deferrable constraints only
-- reorder rows, swap ids, load two tables that reference each other
COMMIT;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="What is an EXCLUDE constraint and when is it used?">
            <ul className="list-disc pl-6 space-y-1">
              <li><code>EXCLUDE</code> prevents conflicting rows using an index operator class (often GiST)</li>
              <li>Classic use: no overlapping time ranges for the same resource (booking systems)</li>
              <li>More powerful than UNIQUE for non-equality conflicts. UNIQUE can only compare with <code>=</code>; EXCLUDE can use overlap operators</li>
              <li>Requires appropriate extensions/types (e.g. <code>btree_gist</code> for mixing equality + range)</li>
              <li>It also solves the race condition: two people booking the same slot at the same moment cannot both win, which a “SELECT then INSERT” check in application code cannot guarantee</li>
              <li>Add a <code>WHERE</code> clause to ignore rows that should not take part, such as cancelled bookings</li>
            </ul>
            <CodeBlock
              title="EXCLUDE overlapping bookings"
              language="sql"
              code={`CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE bookings (
  id          BIGSERIAL PRIMARY KEY,
  room_id     BIGINT NOT NULL,
  during      TSRANGE NOT NULL,
  EXCLUDE USING gist (room_id WITH =, during WITH &&)
);`}
            />
            <CodeBlock
              title="Ignore cancelled rows"
              language="sql"
              code={`CREATE TABLE reservations (
  id        BIGSERIAL PRIMARY KEY,
  room_id   BIGINT NOT NULL,
  during    TSTZRANGE NOT NULL,
  status    TEXT NOT NULL DEFAULT 'active',
  CONSTRAINT reservations_no_overlap
    EXCLUDE USING gist (room_id WITH =, during WITH &&)
    WHERE (status = 'active')
);

-- Second insert fails with exclusion_violation (SQLSTATE 23P01)
INSERT INTO reservations (room_id, during)
VALUES (1, tstzrange('2026-01-01 10:00Z', '2026-01-01 11:00Z'));

INSERT INTO reservations (room_id, during)
VALUES (1, tstzrange('2026-01-01 10:30Z', '2026-01-01 12:00Z'));`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 4: Security and Application Boundaries - Module 8 - Most Asked Interview Questions',
  description:
    'Most asked questions on SECURITY DEFINER, dynamic SQL risks, building safe dynamic SQL with format %I and %L, set-returning functions, database logic vs application logic, triggers with Prisma migrations, and why triggers surprise an ORM.',
};

export default function M8L4SecurityAndAppBoundaries() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 4: Security and Application Boundaries</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Once code lives in the database, two new questions appear: whose permissions does it run with, and who
          owns the logic. This lesson covers both, plus how database code and an ORM like Prisma live together.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="Can Prisma call PostgreSQL functions?">
            <p>
              Yes, through <code>$queryRaw</code> and <code>$executeRaw</code>, or by mapping a database view into
              the schema. Prisma does not generate a typed client method for a custom PL/pgSQL function, so there
              is no <code>prisma.myFunction()</code>.
            </p>
            <CodeBlock
              title="Calling a DB function from Prisma"
              language="typescript"
              code={`const rows = await prisma.$queryRawUnsafe(
  'SELECT classify_amount($1) AS classify_amount',
  1500,
);
// rows: [{ classify_amount: 'high' }]`}
            />
            <p>
              Use <code>$queryRaw</code> when you want rows back and <code>$executeRaw</code> when you only need
              the statement to run. <code>$executeRaw</code> returns the number of affected rows, not data.
            </p>
            <CodeBlock
              title="Which helper to use"
              language="typescript"
              code={`// Returns rows
const totals = await prisma.$queryRawUnsafe(
  'SELECT * FROM user_order_count($1)',
  userId,
);

// Returns a count, no rows
await prisma.$executeRawUnsafe('CALL refresh_stats()');

// A function with side effects and no useful return
await prisma.$executeRawUnsafe('SELECT log_event($1)', 'signup');`}
            />
            <p>
              Three practical notes. The result of a raw query is a plain object using the database column names,
              so <code>created_at</code> stays snake case rather than becoming <code>createdAt</code>. There is no
              type checking, so declare the shape yourself. And a <code>bigint</code> column comes back as a
              JavaScript BigInt, which <code>JSON.stringify</code> cannot serialise, so convert it first.
            </p>
            <p>
              If you want typed access to database logic, the cleanest route is a view. You write the SQL once,
              map the view as a model in <code>schema.prisma</code>, and then read from it with the normal typed
              client.
            </p>
            <CodeBlock
              title="A view gives you typed reads"
              language="prisma"
              code={`view MonthlyRevenue {
  month        DateTime @id
  paidOrders   Int      @map("paid_orders")
  revenueCents BigInt   @map("revenue_cents")

  @@map("monthly_revenue")
}`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="What does SECURITY DEFINER mean, and what are the risks?">
            <p>
              By default a function runs with the permissions of whoever called it. That is
              <code>SECURITY INVOKER</code>. Marking it <code>SECURITY DEFINER</code> makes it run with the
              permissions of the user who owns the function instead.
            </p>
            <p>
              This is how you give limited users a controlled way to do something privileged. The caller cannot
              update the <code>orders</code> table directly, but they can call a function that does exactly one
              safe update. It is the database version of an API endpoint.
            </p>
            <p>
              The risk is privilege escalation, which means a user gaining powers they should not have. It happens
              when the function trusts something the caller controls, such as the search path or a string used to
              build SQL.
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
            <p>
              The <code>SET search_path</code> line is the most important part, and the one candidates forget. The
              search path is the list of schemas PostgreSQL looks in to resolve an unqualified name. If the caller
              controls it, they can create their own <code>orders</code> table or their own
              <code>NOW()</code> function in a schema that is searched first, and your privileged function will
              use theirs.
            </p>
            <CodeBlock
              title="The search_path attack"
              language="sql"
              code={`-- Attacker prepares a decoy in a schema they own
CREATE SCHEMA evil;
CREATE TABLE evil.orders (id bigint, status text);
SET search_path = evil, public;

-- Without SET search_path on the function, the privileged
-- UPDATE could resolve to evil.orders instead of public.orders.
SELECT admin_mark_paid(1);`}
            />
            <p>
              Listing <code>pg_temp</code> last matters too. Temporary tables are always searched, and if
              <code>pg_temp</code> comes first a caller can shadow a real table with a temporary one of the same
              name. Putting it at the end removes that option.
            </p>
            <p>The full checklist for a <code>SECURITY DEFINER</code> function:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Always add <code>SET search_path = public, pg_temp</code>, or schema-qualify every single object
                name in the body.
              </li>
              <li>
                <code>REVOKE ALL ... FROM PUBLIC</code> then grant <code>EXECUTE</code> to the specific roles that
                need it. New functions are executable by everyone by default.
              </li>
              <li>
                Keep the body as narrow as possible. One statement doing one thing, with the row it may touch
                decided by the function and not by a flag the caller passes.
              </li>
              <li>
                Validate every argument. The caller cannot write the table directly, so your parameter checks are
                the only protection left.
              </li>
              <li>
                Never combine it with dynamic SQL built by string concatenation. That turns a limited endpoint
                into arbitrary code execution as the owner.
              </li>
              <li>
                Do not let it be owned by a superuser unless it genuinely needs superuser rights. Own it with a
                role that has exactly the privileges required.
              </li>
            </ul>
            <p>
              One more interaction worth knowing: row-level security policies are normally evaluated for the
              calling user, but a <code>SECURITY DEFINER</code> function runs as the owner, so it can bypass them.
              That is sometimes the goal and sometimes a serious leak, so be deliberate about it.
            </p>
          </InterviewQACard>

          <InterviewQACard level="Mid" question="When should business logic live in the database vs the application (Prisma)?">
            <p>
              There is no single right answer, and the interviewer is listening for the trade-offs rather than a
              rule. The useful framing is: put in the database whatever must be true no matter which client wrote
              the data.
            </p>
            <p>Good in the database:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Constraints and integrity rules: <code>NOT NULL</code>, <code>UNIQUE</code>,
                <code>CHECK</code>, foreign keys. These cannot be bypassed by a script or a second service.
              </li>
              <li>Defaults and generated values, including audit timestamps.</li>
              <li>Audit triggers, because they must survive a raw SQL fix or a data migration.</li>
              <li>
                Set-based work over large volumes, where moving the data to the application would dominate the
                cost.
              </li>
            </ul>
            <p>Good in the application:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Orchestration, workflows, and anything that talks to an external API.</li>
              <li>Complex domain rules that change often and need readable unit tests.</li>
              <li>
                Anything that must be deployed, versioned and rolled back together with the rest of the product
                code.
              </li>
            </ul>
            <p>
              The honest downsides of heavy PL/pgSQL: it is harder to unit test, code review and debug, it is
              invisible to developers reading the application, it makes local development environments diverge
              from production, and it ties you to PostgreSQL.
            </p>
            <p>
              The downside of putting everything in the application: rules are only enforced while every writer
              goes through that application. In practice a data migration, an admin script or a second service
              eventually writes directly, and then invariants break.
            </p>
            <p>
              A defensible position to state in an interview: enforce invariants in the database with constraints,
              keep behaviour in the application, and use triggers sparingly for cross-cutting concerns like
              auditing. Duplicating the same rule in both Prisma middleware and PL/pgSQL is the worst of both,
              because the two copies drift apart.
            </p>
            <CodeBlock
              title="Invariant in the database, behaviour in the app"
              language="sql"
              code={`-- Cannot be bypassed, even by a manual SQL fix
ALTER TABLE accounts
  ADD CONSTRAINT accounts_balance_non_negative CHECK (balance >= 0);

ALTER TABLE orders
  ADD CONSTRAINT orders_status_valid
  CHECK (status IN ('pending', 'paid', 'refunded', 'cancelled'));`}
            />
            <CodeBlock
              title="The same rules expressed in Prisma"
              language="prisma"
              code={`model Account {
  id      Int @id @default(autoincrement())
  balance Int

  // Prisma has no CHECK syntax, so the constraint lives in a
  // raw SQL migration and is documented here.
  @@map("accounts")
}`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Why can triggers surprise an ORM like Prisma?">
            <p>
              An ORM builds its picture of the world from the schema it knows about. A trigger is invisible to
              that picture, so the database does things the client did not ask for and cannot predict.
            </p>
            <p>Here is what actually goes wrong in practice:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Stale objects in memory.</strong> A <code>BEFORE</code> trigger changes the row as it is
                written. Prisma returns the values from <code>RETURNING</code>, so a simple
                <code>update</code> is fine, but any object you held from an earlier read is now out of date.
              </li>
              <li>
                <strong>Rows that vanish.</strong> A <code>BEFORE</code> trigger returning <code>NULL</code>
                cancels the write silently. <code>create</code> expects a record back and instead gets nothing,
                which surfaces as a confusing client error rather than a validation message.
              </li>
              <li>
                <strong>Wrong counts.</strong> <code>updateMany</code> and <code>deleteMany</code> report a count
                that reflects what the database actually did, so skipped rows make the number disagree with what
                the code expected.
              </li>
              <li>
                <strong>Errors with no obvious source.</strong> A <code>RAISE EXCEPTION</code> inside a trigger
                arrives as a raw database error. The stack trace points at a Prisma call that looks harmless.
              </li>
              <li>
                <strong>Duplicated writes.</strong> If the application also sets <code>updatedAt</code> and a
                trigger sets it too, you get two sources of truth for the same field. Whoever runs last wins.
              </li>
              <li>
                <strong>Hidden cost.</strong> A <code>createMany</code> of 10,000 rows looks like one statement in
                the application, but an audit trigger turns it into 20,000 writes.
              </li>
              <li>
                <strong>Seed and test surprises.</strong> Tests that reset the database and insert fixtures now
                fire every trigger, which can create audit rows and change timestamps that assertions depend on.
              </li>
            </ul>
            <CodeBlock
              title="Reading back what a trigger changed"
              language="typescript"
              code={`// update returns the row after triggers ran, so this is accurate
const updated = await prisma.user.update({
  where: { id },
  data: { email },
});
console.log(updated.updatedAt); // set by the trigger

// But this object is from before the write and is now stale
const before = await prisma.user.findUniqueOrThrow({ where: { id } });
await prisma.$executeRawUnsafe('UPDATE users SET email = $1 WHERE id = $2', email, id);
// before.updatedAt no longer matches the database`}
            />
            <p>
              Prisma also has no concept of a trigger in <code>prisma db pull</code>. Introspecting a database
              that has triggers produces a schema with no mention of them, so a teammate regenerating the schema
              sees nothing. Keeping triggers in versioned SQL migrations is what stops them being lost.
            </p>
            <p>How to keep this manageable:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Write down every trigger and what it does, in a file developers actually read, next to the schema.
              </li>
              <li>
                Prefer generated columns and constraints over triggers when they can express the same rule, since
                Prisma can at least model a column.
              </li>
              <li>
                Make triggers idempotent and side-effect-light, so running a statement twice is safe.
              </li>
              <li>
                Raise clear errors with your own <code>ERRCODE</code> so the application can translate them into
                user-facing messages instead of leaking database text.
              </li>
              <li>
                Test against a database that has the triggers installed. A test suite running on a schema built by
                <code>prisma db push</code> without the SQL migrations will not have them.
              </li>
            </ul>
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="What are the risks of dynamic SQL in PL/pgSQL?">
            <p>
              Dynamic SQL means building a statement as text at runtime and executing it with
              <code>EXECUTE</code>. It is necessary when the shape of the statement changes, for example when the
              table name is a parameter. It is also the main SQL injection vector inside the database.
            </p>
            <p>
              Injection means a caller supplies text that ends the value you intended and adds statements of their
              own. Inside a <code>SECURITY DEFINER</code> function that runs as a privileged owner, this is not a
              data leak, it is remote code execution.
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
            <p>
              The two rules are simple. Pass values with <code>USING</code> so they become real bound parameters.
              Pass identifiers such as table and column names through <code>format()</code> with
              <code>%I</code>, which quotes them safely. Never concatenate caller input into the statement text.
            </p>
            <CodeBlock
              title="The injectable version"
              language="sql"
              code={`-- NEVER do this
EXECUTE 'SELECT * FROM users WHERE email = ''' || p_email || '''';

-- p_email = "x'' OR 1=1; DROP TABLE users; --"
-- becomes a second statement that runs with the function's privileges.`}
            />
            <p>
              Beyond injection, dynamic SQL has real costs that argue for avoiding it unless the statement shape
              genuinely must vary:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                No plan caching. A static statement in PL/pgSQL is prepared once per session; a dynamic one is
                parsed and planned every call.
              </li>
              <li>
                No dependency tracking. PostgreSQL does not know the function references a table, so you can drop
                a column and only find out at runtime.
              </li>
              <li>
                Errors appear at call time, not creation time, and the message refers to generated text nobody
                wrote.
              </li>
              <li>
                It defeats code search. Nobody grepping for a table name will find the reference.
              </li>
            </ul>
            <p>
              Often the dynamic version is not needed at all. A statement whose values vary should be static with
              parameters. Only a statement whose identifiers or clauses vary needs
              <code>EXECUTE</code>, and even then a <code>CASE</code> over a small fixed set of static statements
              is usually safer and faster.
            </p>
          </InterviewQACard>

          <InterviewQACard level="Senior" question="How do you use format with %I and %L to build safe dynamic SQL?">
            <p>
              <code>format()</code> works like a printf for SQL. It fills placeholders in a template, and each
              placeholder type applies the right kind of quoting.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <code>%I</code> is an identifier: a table, column or schema name. It adds double quotes when
                needed and doubles any embedded double quote. Use it wherever a name goes.
              </li>
              <li>
                <code>%L</code> is a literal value. It adds single quotes, escapes embedded quotes, and renders a
                NULL as the keyword <code>NULL</code> rather than an empty string.
              </li>
              <li>
                <code>%s</code> is plain text substitution with no quoting at all. It is the dangerous one. Use it
                only for fragments you wrote yourself, never for caller input.
              </li>
            </ul>
            <CodeBlock
              title="What each placeholder produces"
              language="sql"
              code={`SELECT format('SELECT * FROM %I WHERE %I = %L', 'my table', 'name', E'O\\'Brien');
-- SELECT * FROM "my table" WHERE name = 'O''Brien'

SELECT format('value = %L', NULL);
-- value = NULL     (the keyword, not an empty string)

SELECT format('value = %s', NULL);
-- value =          (broken SQL)`}
            />
            <p>
              Notice that <code>%I</code> handled a space in the table name, and <code>%L</code> handled an
              apostrophe inside the value. Doing either by hand is where injection bugs come from.
            </p>
            <CodeBlock
              title="A safe generic function"
              language="sql"
              code={`CREATE OR REPLACE FUNCTION rows_matching(
  p_table  text,
  p_column text,
  p_value  text
)
RETURNS bigint
LANGUAGE plpgsql
AS $$
DECLARE
  result bigint;
BEGIN
  EXECUTE format('SELECT COUNT(*) FROM %I WHERE %I = $1', p_table, p_column)
  INTO result
  USING p_value;

  RETURN result;
END;
$$;`}
            />
            <p>
              That example shows the preferred combination: <code>%I</code> for the names, and
              <code>USING</code> with <code>$1</code> for the value. Prefer <code>USING</code> over
              <code>%L</code> whenever you can, because a bound parameter keeps its real type and lets the plan be
              reused. Reach for <code>%L</code> only when the value must appear in a place a parameter cannot go,
              such as inside a <code>DEFAULT</code> clause in generated DDL.
            </p>
            <p>
              For a qualified name, <code>%I</code> twice is correct and
              <code>&apos;schema.table&apos;</code> as one <code>%I</code> is not, because it would be quoted as a
              single odd name. When you already hold a table as a <code>regclass</code>, use
              <code>%s</code> with it, since <code>regclass</code> renders itself correctly quoted.
            </p>
            <CodeBlock
              title="Qualified names"
              language="sql"
              code={`-- Correct: two identifiers
EXECUTE format('SELECT COUNT(*) FROM %I.%I', p_schema, p_table);

-- Wrong: quoted as one name, "public.users"
EXECUTE format('SELECT COUNT(*) FROM %I', p_schema || '.' || p_table);

-- Also correct: regclass renders itself safely
EXECUTE format('SELECT COUNT(*) FROM %s', p_table::regclass);`}
            />
            <p>
              Numbered placeholders such as <code>%1$I</code> let you reuse the same argument more than once,
              which keeps longer templates readable. And the lower-level functions
              <code>quote_ident</code>, <code>quote_literal</code> and <code>quote_nullable</code> do the same
              jobs individually if you prefer them.
            </p>
            <CodeBlock
              title="Reusing an argument"
              language="sql"
              code={`EXECUTE format(
  'CREATE INDEX %1$I_created_idx ON %1$I (created_at)',
  p_table
);`}
            />
            <p>
              The last safety layer is validation. Even with <code>%I</code>, a caller who can name any table can
              read any table. If the set of allowed names is known, check the argument against a list or against
              the catalog before you use it.
            </p>
            <CodeBlock
              title="Validate the identifier as well"
              language="sql"
              code={`IF NOT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = p_table
) THEN
  RAISE EXCEPTION 'unknown table: %', p_table
    USING ERRCODE = 'check_violation';
END IF;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="How do you write a set-returning function efficiently?">
            <p>
              A set-returning function returns many rows instead of one value. The efficient way is to hand the
              whole query to the planner in one piece, rather than building the result row by row.
            </p>
            <p>
              Prefer <code>RETURN QUERY</code> or a plain <code>LANGUAGE sql</code> function over a loop with
              <code>RETURN NEXT</code>. A loop materialises every row through the PL/pgSQL layer, which is far
              slower and uses memory proportional to the result size.
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
            <CodeBlock
              title="The slow version to avoid"
              language="sql"
              code={`-- Every row passes through PL/pgSQL one at a time
FOR r IN SELECT * FROM orders WHERE created_at >= cutoff LOOP
  RETURN NEXT r;
END LOOP;`}
            />
            <p>
              If the body is a single query, drop PL/pgSQL entirely. A <code>LANGUAGE sql</code> function marked
              <code>STABLE</code> can be inlined into the calling query, which means the caller&apos;s
              <code>WHERE</code> clause and <code>LIMIT</code> are pushed down into it and indexes are used.
            </p>
            <CodeBlock
              title="Inlinable version"
              language="sql"
              code={`CREATE OR REPLACE FUNCTION recent_orders_sql(p_days int)
RETURNS SETOF orders
LANGUAGE sql
STABLE
AS $$
  SELECT *
  FROM orders
  WHERE created_at >= NOW() - make_interval(days => p_days);
$$;

-- The outer filter can now be combined with the inner query
SELECT * FROM recent_orders_sql(30) WHERE status = 'paid' LIMIT 10;`}
            />
            <p>
              That push-down is the biggest single win available here. With the PL/pgSQL version, the function
              produces every recent order and the outer query then discards most of them.
            </p>
            <p>
              Two further tools for the hard cases. <code>ROWS</code> tells the planner roughly how many rows to
              expect, since the default guess of 1000 can produce a bad join plan.
              <code>LATERAL</code> at the call site lets a set-returning function run once per row of another
              table with the correct arguments.
            </p>
            <CodeBlock
              title="Row estimates and LATERAL"
              language="sql"
              code={`CREATE OR REPLACE FUNCTION top_items(p_order_id bigint, p_limit int)
RETURNS SETOF order_items
LANGUAGE sql
STABLE
ROWS 5
AS $$
  SELECT * FROM order_items
  WHERE order_id = p_order_id
  ORDER BY unit_price_cents DESC
  LIMIT p_limit;
$$;

SELECT o.id, i.sku
FROM orders o
CROSS JOIN LATERAL top_items(o.id, 3) AS i;`}
            />
            <p>
              Finally, a note on where set-returning functions belong. If the result never depends on a parameter,
              a view is simpler and fully optimisable. If it is expensive and can be slightly stale, a
              materialised view refreshed on a schedule beats recomputing it per request. Reach for a function
              when the query genuinely needs arguments.
            </p>
            <CodeBlock
              title="Prisma consuming a set-returning function"
              language="typescript"
              code={`const rows = await prisma.$queryRawUnsafe(
  'SELECT * FROM recent_orders_sql($1) WHERE status = $2 LIMIT $3',
  30,
  'paid',
  10,
);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="How do triggers interact with Prisma migrations and application updates?">
            <p>
              Prisma Migrate can apply raw SQL for triggers and functions, but the Prisma Client will never model
              their side effects. So the migration story is solvable; the communication story is the part teams
              get wrong.
            </p>
            <p>
              The mechanics: create an empty migration, write the SQL into it, and commit it. Now the trigger is
              versioned alongside the schema and every environment gets it in the same order.
            </p>
            <CodeBlock
              title="Creating an empty migration to hold SQL"
              language="typescript"
              code={`// npx prisma migrate dev --create-only --name add_updated_at_trigger
// then edit the generated migration.sql and run migrate dev again`}
            />
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
            <p>
              Write these migrations to be safely re-runnable. <code>CREATE OR REPLACE FUNCTION</code> is already
              idempotent; <code>CREATE TRIGGER</code> is not, so drop it first or use
              <code>CREATE OR REPLACE TRIGGER</code> on PostgreSQL 14 and later.
            </p>
            <CodeBlock
              title="Idempotent trigger creation"
              language="sql"
              code={`DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- PostgreSQL 14+
CREATE OR REPLACE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();`}
            />
            <p>The failure modes to call out:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong><code>prisma db push</code> skips migrations.</strong> It syncs the schema directly, so a
                developer or CI job using it gets a database with no triggers. That is a common cause of
                &quot;works locally, fails in staging&quot;.
              </li>
              <li>
                <strong>Introspection loses them.</strong> <code>prisma db pull</code> writes no record of a
                trigger, so regenerating the schema from a database makes them invisible in review.
              </li>
              <li>
                <strong>Drift detection can flag them.</strong> Objects Prisma does not manage may show up as
                unexpected differences, and the reset that fixes drift will drop anything not in a migration.
              </li>
              <li>
                <strong>A table rename breaks the function silently.</strong> A trigger function body is parsed at
                runtime, so renaming a table it references compiles fine and fails on the next write.
              </li>
              <li>
                <strong>Double-applied logic.</strong> If the app sets a field and a trigger also sets it, the
                behaviour depends on ordering. Pick one owner per field.
              </li>
            </ul>
            <p>
              Also think about locks during deployment. <code>CREATE TRIGGER</code> takes a strong lock on the
              table, so it waits for existing transactions and blocks new ones while it waits. On a busy table,
              set a short <code>lock_timeout</code> so a migration fails fast instead of queueing behind a long
              query and stalling the application.
            </p>
            <CodeBlock
              title="Failing fast instead of blocking writes"
              language="sql"
              code={`SET lock_timeout = '3s';

DROP TRIGGER IF EXISTS trg_orders_audit ON orders;
CREATE TRIGGER trg_orders_audit
AFTER INSERT OR UPDATE OR DELETE ON orders
FOR EACH ROW EXECUTE FUNCTION write_audit_log();`}
            />
            <p>
              The practice that ties it together: document hidden database behaviour where application developers
              will see it, prefer constraints and generated columns over triggers when either will do, and keep
              triggers few enough that the whole list fits in one short file.
            </p>
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

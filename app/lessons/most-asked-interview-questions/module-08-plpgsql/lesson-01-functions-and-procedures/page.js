import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 1: Functions and Procedures - Module 8 - Most Asked Interview Questions',
  description:
    'Most asked PL/pgSQL interview questions on functions and procedures: CREATE OR REPLACE FUNCTION, LANGUAGE sql vs plpgsql, dollar quoting, RETURNS and OUT parameters, calling a function, and IMMUTABLE vs STABLE vs VOLATILE.',
};

export default function M8L1FunctionsAndProcedures() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 1: Functions and Procedures</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          PostgreSQL lets you store code in the database and call it from SQL. This lesson covers how to write
          that code, the difference between a function and a procedure, the two languages you can use, and how to
          label a function so the planner can optimise it.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="What is PL/pgSQL?">
            <p>
              PL/pgSQL is PostgreSQL&apos;s own programming language for writing functions and triggers. It gives
              you variables, if and else, loops, and error handling, which plain SQL does not have.
            </p>
            <p>
              Plain SQL is one statement. PL/pgSQL can run many steps in order, remember values between them, and
              recover from errors. The name stands for Procedural Language / PostgreSQL.
            </p>
            <CodeBlock
              title="A first PL/pgSQL function"
              language="sql"
              code={`CREATE OR REPLACE FUNCTION greet(p_name text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  message text;
BEGIN
  message := 'Hello, ' || p_name;
  RETURN message;
END;
$$;

SELECT greet('Ada');  -- Hello, Ada`}
            />
            <p>
              Notice the three parts: <code>DECLARE</code> lists the variables,
              <code>BEGIN ... END</code> holds the steps, and <code>:=</code> assigns a value. It is installed by
              default, so there is nothing to enable.
            </p>
          </InterviewQACard>

          <InterviewQACard level="Junior" question="How do you write CREATE OR REPLACE FUNCTION, and what does dollar quoting do?">
            <p>
              <code>CREATE FUNCTION</code> fails if a function with that name and those argument types already
              exists. <code>CREATE OR REPLACE FUNCTION</code> overwrites it instead, which is what you want in a
              migration you may run more than once.
            </p>
            <p>The parts of the statement, in order:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>The name and the parameter list, with a type for each parameter.</li>
              <li>
                <code>RETURNS</code> and the type sent back to the caller.
              </li>
              <li>
                <code>LANGUAGE</code>, usually <code>sql</code> or <code>plpgsql</code>.
              </li>
              <li>
                Optional labels such as <code>STABLE</code>, <code>STRICT</code> or
                <code>SECURITY DEFINER</code>.
              </li>
              <li>
                <code>AS</code> followed by the body, written as a string.
              </li>
            </ul>
            <p>
              The body is a string, and SQL bodies are full of single quotes. Escaping every one of them would be
              painful, so PostgreSQL offers dollar quoting: <code>$$</code> opens and closes a string, and
              anything between them is taken literally.
            </p>
            <CodeBlock
              title="Why dollar quoting exists"
              language="sql"
              code={`-- Painful: every quote inside must be doubled
CREATE FUNCTION f1() RETURNS text LANGUAGE sql
AS 'SELECT ''hello''';

-- Clear: dollar quoting needs no escaping
CREATE OR REPLACE FUNCTION f2() RETURNS text LANGUAGE sql
AS $$ SELECT 'hello' $$;`}
            />
            <p>
              You can also put a tag between the dollar signs, such as <code>$body$</code> or
              <code>$fn$</code>. You need that when the body itself contains <code>$$</code>, for example when a
              function creates another function.
            </p>
            <CodeBlock
              title="Tagged dollar quoting"
              language="sql"
              code={`CREATE OR REPLACE FUNCTION make_helper()
RETURNS void
LANGUAGE plpgsql
AS $outer$
BEGIN
  EXECUTE $inner$
    CREATE OR REPLACE FUNCTION helper() RETURNS int
    LANGUAGE sql AS $$ SELECT 1 $$;
  $inner$;
END;
$outer$;`}
            />
            <p>
              Two things <code>OR REPLACE</code> will not do. It cannot change the return type, and it cannot
              rename parameters that other objects depend on. For either of those you must
              <code>DROP FUNCTION</code> first. It also will not replace a function whose argument types differ,
              because that is a different function: PostgreSQL allows overloading by argument type.
            </p>
            <CodeBlock
              title="Dropping and overloading"
              language="sql"
              code={`-- The argument types are part of the identity
DROP FUNCTION IF EXISTS greet(text);

-- Two functions, same name, different arguments
CREATE OR REPLACE FUNCTION area(r numeric) RETURNS numeric
LANGUAGE sql IMMUTABLE AS $$ SELECT pi() * r * r $$;

CREATE OR REPLACE FUNCTION area(w numeric, h numeric) RETURNS numeric
LANGUAGE sql IMMUTABLE AS $$ SELECT w * h $$;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="What is the difference between a FUNCTION and a PROCEDURE?">
            <p>
              A function returns a value and you call it inside a <code>SELECT</code>. A procedure, added in
              PostgreSQL 11, is started with <code>CALL</code> and is meant for a series of steps.
            </p>
            <p>
              The real difference is transaction control. A function always runs inside the caller&apos;s
              transaction and cannot commit. A procedure can issue its own <code>COMMIT</code> and
              <code>ROLLBACK</code>, which makes it suitable for batch jobs that process data in chunks.
            </p>
            <p>Use a function for a calculation. Use a procedure for a workflow.</p>
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
            <CodeBlock
              title="A procedure committing in batches"
              language="sql"
              code={`CREATE OR REPLACE PROCEDURE purge_old_events()
LANGUAGE plpgsql
AS $$
DECLARE
  deleted int;
BEGIN
  LOOP
    DELETE FROM events
    WHERE id IN (
      SELECT id FROM events
      WHERE created_at < NOW() - INTERVAL '1 year'
      LIMIT 10000
    );

    GET DIAGNOSTICS deleted = ROW_COUNT;
    EXIT WHEN deleted = 0;

    COMMIT;  -- only a procedure may do this
  END LOOP;
END;
$$;`}
            />
            <p>
              <code>GET DIAGNOSTICS deleted = ROW_COUNT;</code> reads how many rows the previous statement
              touched. The important part is the <code>COMMIT</code> inside the loop, which keeps each batch short
              so the job does not hold locks for hours.
            </p>
            <p>
              One catch: a procedure can only commit when it was called from a plain <code>CALL</code>, not from
              inside another transaction that the client already opened. That also means Prisma cannot usefully
              call a committing procedure inside <code>$transaction</code>.
            </p>
          </InterviewQACard>

          <InterviewQACard level="Junior" question="How do you call a function in PostgreSQL?">
            <p>
              How you call it depends on what it returns. A function returning one value goes in the
              <code>SELECT</code> list. A function returning rows goes in the <code>FROM</code> clause, like a
              table.
            </p>
            <CodeBlock
              title="Four ways to call"
              language="sql"
              code={`-- Single value
SELECT add_numbers(1, 2);

-- Per row of a table
SELECT id, greet(first_name) FROM users;

-- Returns a set of rows: use it like a table
SELECT * FROM user_order_count(1);

-- A procedure
CALL refresh_stats();`}
            />
            <p>
              You can pass arguments by name instead of position using <code>=&gt;</code>. That is much easier to
              read when a function has several parameters, and it lets you skip ones that have defaults.
            </p>
            <CodeBlock
              title="Named arguments and defaults"
              language="sql"
              code={`CREATE OR REPLACE FUNCTION discounted(
  price numeric,
  percent numeric DEFAULT 10
)
RETURNS numeric
LANGUAGE sql IMMUTABLE
AS $$ SELECT ROUND(price * (100 - percent) / 100, 2) $$;

SELECT discounted(200);                        -- uses the default
SELECT discounted(price => 200, percent => 25); -- named arguments`}
            />
            <p>
              Functions that return no value are declared <code>RETURNS void</code>. You still call them with
              <code>SELECT</code>, which looks odd the first time.
            </p>
            <CodeBlock
              title="Calling from Prisma"
              language="typescript"
              code={`// A scalar function
const rows = await prisma.$queryRawUnsafe(
  'SELECT add_numbers($1, $2) AS result',
  1,
  2,
);

// A set-returning function used as a table
const orders = await prisma.$queryRawUnsafe(
  'SELECT * FROM user_order_count($1)',
  1,
);

// A procedure, or a function that only has side effects
await prisma.$executeRawUnsafe('CALL refresh_stats()');`}
            />
            <p>
              Prisma has no typed client method for a custom database function, so these always go through the raw
              query helpers. Use <code>$queryRaw</code> when you want rows back and
              <code>$executeRaw</code> when you only care that it ran.
            </p>
          </InterviewQACard>

          <InterviewQACard level="Junior" question="How do RETURNS and OUT parameters work?">
            <p>
              <code>RETURNS type</code> defines a single return value. <code>RETURNS TABLE (...)</code> or
              <code>RETURNS SETOF</code> return many rows. <code>OUT</code> and <code>INOUT</code> parameters send
              values back without a single return expression, which is how you return several separate values.
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
            <p>
              A function with several <code>OUT</code> parameters returns one composite row. Wrapping the call in
              parentheses lets you pick one field out of it.
            </p>
            <CodeBlock
              title="Reading the result"
              language="sql"
              code={`SELECT * FROM split_name('Ada Lovelace');
-- first_name | last_name

SELECT (split_name('Ada Lovelace')).last_name;`}
            />
            <p>
              A naming clash is the classic bug here. If a parameter is called <code>user_id</code> and the table
              also has a <code>user_id</code> column, PL/pgSQL cannot tell which one you mean and raises an
              ambiguity error. The usual convention is to prefix parameters with <code>p_</code>, exactly as the
              examples do, and to qualify column references with the table alias.
            </p>
            <CodeBlock
              title="The ambiguity trap"
              language="sql"
              code={`-- Raises: column reference "user_id" is ambiguous
CREATE OR REPLACE FUNCTION bad_count(user_id int)
RETURNS bigint LANGUAGE plpgsql AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM orders WHERE user_id = user_id);
END;
$$;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="When should you use LANGUAGE sql instead of LANGUAGE plpgsql?">
            <p>
              A <code>LANGUAGE sql</code> function body is just one or more SQL statements with no variables and
              no control flow. A <code>LANGUAGE plpgsql</code> body is a program.
            </p>
            <p>
              The reason this matters is inlining. The planner can often paste a simple SQL function straight into
              the calling query, then optimise the whole thing together, including using indexes on the inner
              tables. A PL/pgSQL function is a black box: it is executed separately for every row and the planner
              cannot see inside it.
            </p>
            <CodeBlock
              title="Same logic, two languages"
              language="sql"
              code={`-- Can be inlined into the calling query
CREATE OR REPLACE FUNCTION order_total(p_order_id bigint)
RETURNS bigint
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(SUM(unit_price_cents * quantity), 0)
  FROM order_items
  WHERE order_id = p_order_id;
$$;

-- Cannot be inlined: runs as a separate program per row
CREATE OR REPLACE FUNCTION order_total_slow(p_order_id bigint)
RETURNS bigint
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  total bigint;
BEGIN
  SELECT COALESCE(SUM(unit_price_cents * quantity), 0)
  INTO total
  FROM order_items
  WHERE order_id = p_order_id;
  RETURN total;
END;
$$;`}
            />
            <p>So the guidance is:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Use <code>LANGUAGE sql</code> whenever the body is expressible as a single query. It is faster,
                shorter, and inlinable.
              </li>
              <li>
                Use <code>LANGUAGE plpgsql</code> when you need variables, loops, conditionals, exception
                handling, dynamic SQL, or a trigger function. A trigger function must be
                <code>plpgsql</code>.
              </li>
            </ul>
            <p>
              For inlining to happen the function generally needs to be a single <code>SELECT</code>, and it needs
              to be <code>STABLE</code> or <code>IMMUTABLE</code> rather than the default
              <code>VOLATILE</code>. That is why the fast version above is labelled.
            </p>
            <p>
              PostgreSQL 14 added standard SQL-style bodies written with <code>BEGIN ATOMIC</code> instead of a
              quoted string. These are parsed at creation time, so a typo or a missing table is caught
              immediately, and dependencies are tracked so you cannot silently drop a table the function uses.
            </p>
            <CodeBlock
              title="SQL-standard function body (PostgreSQL 14+)"
              language="sql"
              code={`CREATE OR REPLACE FUNCTION order_total_v2(p_order_id bigint)
RETURNS bigint
LANGUAGE sql
STABLE
BEGIN ATOMIC
  SELECT COALESCE(SUM(unit_price_cents * quantity), 0)
  FROM order_items
  WHERE order_id = p_order_id;
END;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="What is the difference between IMMUTABLE, STABLE, and VOLATILE function volatility?">
            <p>
              Volatility is a promise you make to the planner about how much the function&apos;s result can change.
              Get it right and PostgreSQL can cache, reorder and index around the call. Get it wrong and you can
              get wrong answers.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <code>IMMUTABLE</code>: the same arguments always give the same result, forever. It cannot read
                the database at all. Required for expression indexes and generated columns. Example:
                <code>LOWER(text)</code>.
              </li>
              <li>
                <code>STABLE</code>: the result cannot change within a single statement, but may differ between
                statements. It may read tables. Example: anything that looks up a row, or
                <code>NOW()</code>.
              </li>
              <li>
                <code>VOLATILE</code>: the result can change at any time, or the function has side effects such as
                writing rows. This is the default, and it is the safe but slow choice.
              </li>
            </ul>
            <CodeBlock
              title="Choosing a label"
              language="sql"
              code={`-- Pure maths on its arguments: IMMUTABLE
CREATE OR REPLACE FUNCTION cents_to_dollars(c bigint)
RETURNS numeric LANGUAGE sql IMMUTABLE
AS $$ SELECT ROUND(c / 100.0, 2) $$;

-- Reads a table: STABLE is the strongest honest label
CREATE OR REPLACE FUNCTION current_tax_rate(p_region text)
RETURNS numeric LANGUAGE sql STABLE
AS $$ SELECT rate FROM tax_rates WHERE region = p_region $$;

-- Writes rows: must stay VOLATILE
CREATE OR REPLACE FUNCTION log_event(p_kind text)
RETURNS void LANGUAGE sql VOLATILE
AS $$ INSERT INTO events (kind) VALUES (p_kind) $$;`}
            />
            <p>What actually changes in behaviour:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                A <code>VOLATILE</code> function in a <code>WHERE</code> clause is re-evaluated for every row and
                cannot be optimised away. Marking a lookup function <code>STABLE</code> often turns a slow query
                fast for that reason alone.
              </li>
              <li>
                Only <code>IMMUTABLE</code> functions can appear in an index definition. That is why you cannot
                index <code>NOW()</code>.
              </li>
              <li>
                <code>STABLE</code> and <code>IMMUTABLE</code> functions can be inlined and constant-folded, and
                can be used by parallel query plans.
              </li>
            </ul>
            <p>
              The danger is lying to the planner. If you mark a function <code>IMMUTABLE</code> but it reads a
              table, PostgreSQL may compute the value once and reuse it, or store it in an index that then never
              updates when the underlying row changes. The index becomes silently wrong, and no error is raised.
            </p>
            <CodeBlock
              title="A lie that corrupts an index"
              language="sql"
              code={`-- WRONG: reads a table but claims IMMUTABLE
CREATE OR REPLACE FUNCTION bad_rate(p_region text)
RETURNS numeric LANGUAGE sql IMMUTABLE
AS $$ SELECT rate FROM tax_rates WHERE region = p_region $$;

-- Index rows are computed once and never refreshed when tax_rates changes
CREATE INDEX orders_bad_idx ON orders ((bad_rate(region)));`}
            />
            <p>
              Two related labels often asked in the same breath. <code>STRICT</code> (also written
              <code>RETURNS NULL ON NULL INPUT</code>) makes the function return NULL immediately if any argument
              is NULL, without running the body. <code>PARALLEL SAFE</code> tells PostgreSQL the function can run
              in a parallel worker.
            </p>
            <CodeBlock
              title="STRICT and PARALLEL SAFE"
              language="sql"
              code={`CREATE OR REPLACE FUNCTION safe_upper(t text)
RETURNS text
LANGUAGE sql
IMMUTABLE
STRICT
PARALLEL SAFE
AS $$ SELECT UPPER(t) $$;`}
            />
            <p>
              <code>STRICT</code> has one important interaction: a <code>STRICT</code> function cannot be inlined
              when the argument might be NULL, because the NULL shortcut has to be preserved. So do not add it
              reflexively to a function you want inlined.
            </p>
            <p>
              Practical rule for interviews: use the strictest label that is honestly true, and default to
              <code>STABLE</code> for anything that reads data. Remember that <code>VOLATILE</code> is the default
              when you write nothing, which is why so many hand-written functions are slower than they need to be.
            </p>
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

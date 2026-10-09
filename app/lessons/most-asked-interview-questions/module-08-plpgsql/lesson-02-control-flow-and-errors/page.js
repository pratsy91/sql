import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 2: Control Flow and Errors - Module 8 - Most Asked Interview Questions',
  description:
    'Most asked PL/pgSQL interview questions on control flow and error handling: IF ELSIF ELSE, looping over query results with FOR, EXCEPTION blocks, RAISE, SQLSTATE codes such as unique_violation, and why swallowing WHEN OTHERS is dangerous.',
};

export default function M8L2ControlFlowAndErrors() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 2: Control Flow and Errors</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          This lesson covers the parts of PL/pgSQL that make it a real programming language: branching, loops,
          and catching errors. It also covers the mistakes that turn error handling into hidden data loss.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="What control-flow constructs exist in PL/pgSQL?">
            <p>Control flow means deciding what runs next. PL/pgSQL gives you the usual set:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <code>IF / ELSIF / ELSE</code> and <code>CASE</code> for branching.
              </li>
              <li>
                <code>LOOP</code>, <code>WHILE</code>, and <code>FOR</code> (over numbers or over query results)
                for repeating.
              </li>
              <li>
                <code>EXIT</code> to leave a loop and <code>CONTINUE</code> to skip to the next pass.
              </li>
              <li>
                <code>RETURN</code>, <code>RETURN NEXT</code>, and <code>RETURN QUERY</code> for sending results
                back.
              </li>
            </ul>
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

          <InterviewQACard level="Junior" question="How does IF / ELSIF / ELSE work, and what are the syntax traps?">
            <p>
              <code>IF</code> runs a block when a condition is true. <code>ELSIF</code> adds another condition to
              test if the earlier ones failed. <code>ELSE</code> catches everything remaining. Only the first
              matching branch runs.
            </p>
            <p>Three syntax details catch people out every time:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                It is spelled <code>ELSIF</code> (or <code>ELSEIF</code>), not <code>ELSE IF</code>.
              </li>
              <li>
                Every <code>IF</code> must be closed with <code>END IF;</code>.
              </li>
              <li>
                There is no <code>THEN</code> after <code>ELSE</code>.
              </li>
            </ul>
            <CodeBlock
              title="Full shape"
              language="sql"
              code={`CREATE OR REPLACE FUNCTION shipping_band(p_weight_g int)
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_weight_g IS NULL OR p_weight_g <= 0 THEN
    RAISE EXCEPTION 'weight must be positive';
  ELSIF p_weight_g <= 500 THEN
    RETURN 'letter';
  ELSIF p_weight_g <= 2000 THEN
    RETURN 'parcel';
  ELSE
    RETURN 'freight';
  END IF;
END;
$$;`}
            />
            <p>
              The most important behavioural trap is NULL. A condition that is NULL is not true, so the branch
              does not run, and it is not false either. That is why the NULL test comes first above. Never assume
              <code>ELSE</code> means &quot;the opposite of the IF&quot; when NULL is possible.
            </p>
            <CodeBlock
              title="NULL is not false"
              language="sql"
              code={`-- If p_qty is NULL, neither branch body describes reality
IF p_qty > 0 THEN
  RAISE NOTICE 'positive';
ELSE
  RAISE NOTICE 'not positive';  -- runs for NULL too
END IF;

-- Be explicit
IF p_qty IS NULL THEN
  RAISE NOTICE 'missing';
ELSIF p_qty > 0 THEN
  RAISE NOTICE 'positive';
ELSE
  RAISE NOTICE 'zero or negative';
END IF;`}
            />
            <p>
              For a plain value comparison, the <code>CASE</code> statement reads better than a chain of
              <code>ELSIF</code>. Note this is the PL/pgSQL <code>CASE</code> statement, which runs code, not the
              SQL <code>CASE</code> expression that returns a value.
            </p>
            <CodeBlock
              title="CASE statement"
              language="sql"
              code={`CASE p_status
  WHEN 'paid'     THEN RAISE NOTICE 'done';
  WHEN 'pending'  THEN RAISE NOTICE 'waiting';
  ELSE                 RAISE NOTICE 'other';
END CASE;`}
            />
            <p>
              A <code>CASE</code> statement with no matching branch and no <code>ELSE</code> raises
              <code>case_not_found</code>. That differs from the SQL <code>CASE</code> expression, which quietly
              returns NULL.
            </p>
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="How do you loop over the results of a query with FOR?">
            <p>
              <code>FOR row IN SELECT ... LOOP ... END LOOP;</code> runs the body once per returned row. The loop
              variable is declared for you if you use <code>record</code>, which is a row whose shape is decided
              at runtime.
            </p>
            <CodeBlock
              title="Looping over rows"
              language="sql"
              code={`CREATE OR REPLACE FUNCTION notify_big_orders(p_min_cents bigint)
RETURNS int
LANGUAGE plpgsql
AS $$
DECLARE
  r record;
  sent int := 0;
BEGIN
  FOR r IN
    SELECT id, user_id, total_cents
    FROM orders
    WHERE total_cents >= p_min_cents
    ORDER BY id
  LOOP
    INSERT INTO notifications (user_id, body)
    VALUES (r.user_id, 'Large order ' || r.id);

    sent := sent + 1;
  END LOOP;

  RETURN sent;
END;
$$;`}
            />
            <p>The other loop forms, for completeness:</p>
            <CodeBlock
              title="Numeric, WHILE, and infinite loops"
              language="sql"
              code={`FOR i IN 1..10 LOOP
  RAISE NOTICE 'i = %', i;
END LOOP;

FOR i IN REVERSE 10..1 BY 2 LOOP
  RAISE NOTICE 'i = %', i;
END LOOP;

WHILE remaining > 0 LOOP
  remaining := remaining - 1;
END LOOP;

LOOP
  EXIT WHEN done;   -- must exit yourself
END LOOP;`}
            />
            <p>
              You can also loop over a query built at runtime with
              <code>FOR r IN EXECUTE format(...)</code>, and use <code>CONTINUE WHEN</code> to skip rows without
              nesting an <code>IF</code>.
            </p>
            <CodeBlock
              title="Skipping rows"
              language="sql"
              code={`FOR r IN SELECT * FROM orders LOOP
  CONTINUE WHEN r.total_cents IS NULL;
  -- process the row
END LOOP;`}
            />
            <p>
              Now the answer that separates levels: most row loops should not exist. A loop processes one row at a
              time, each statement paying its own planning and execution cost. A single set-based statement does
              the same work in one pass and is usually orders of magnitude faster.
            </p>
            <CodeBlock
              title="The same job without a loop"
              language="sql"
              code={`INSERT INTO notifications (user_id, body)
SELECT user_id, 'Large order ' || id
FROM orders
WHERE total_cents >= p_min_cents;

GET DIAGNOSTICS sent = ROW_COUNT;`}
            />
            <p>
              Reach for a loop only when each row genuinely needs different handling, when you need per-row error
              recovery, or when you are deliberately batching a huge job so each chunk commits quickly. Otherwise
              write one statement.
            </p>
            <p>
              For a large result set, <code>FOR ... IN SELECT</code> uses a cursor internally, so it does not load
              every row into memory at once. That is one real advantage over fetching everything into an
              application and looping there.
            </p>
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How do EXCEPTION blocks work in PL/pgSQL?">
            <p>
              A <code>BEGIN ... EXCEPTION WHEN ... THEN ... END</code> block works like try and catch. If any
              statement inside raises an error, control jumps to the matching handler instead of aborting the
              whole function.
            </p>
            <p>
              You can handle named conditions such as <code>unique_violation</code> or
              <code>no_data_found</code>, or catch everything with <code>OTHERS</code>. Use it for recovery and
              logging, not for hiding data integrity failures.
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
            <p>
              The key mechanic to understand: entering a block that has an <code>EXCEPTION</code> clause creates
              an implicit savepoint. When a handler fires, every database change made inside that block is rolled
              back first, then the handler runs. So you never see half-applied work from the failed block.
            </p>
            <CodeBlock
              title="Changes inside the block are undone"
              language="sql"
              code={`BEGIN
  INSERT INTO audit_log (msg) VALUES ('starting');
  INSERT INTO users (email) VALUES (p_email);  -- fails
  RETURN 'ok';
EXCEPTION
  WHEN unique_violation THEN
    -- the audit_log row is gone too: same block, same savepoint
    RETURN 'duplicate';
END;`}
            />
            <p>
              That savepoint has a cost. A block with an exception handler is meaningfully slower than one without,
              so do not wrap a tight loop body in a handler unless you need per-row recovery.
            </p>
            <p>
              Two variables are available inside a handler: <code>SQLSTATE</code> holds the five-character error
              code, and <code>SQLERRM</code> holds the message text. For full detail, use
              <code>GET STACKED DIAGNOSTICS</code>.
            </p>
            <CodeBlock
              title="Reading error details"
              language="sql"
              code={`EXCEPTION
  WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS
      v_state   = RETURNED_SQLSTATE,
      v_msg     = MESSAGE_TEXT,
      v_detail  = PG_EXCEPTION_DETAIL,
      v_context = PG_EXCEPTION_CONTEXT;

    INSERT INTO error_log (state, msg, detail, context)
    VALUES (v_state, v_msg, v_detail, v_context);

    RAISE;  -- re-raise the original error, unchanged
END;`}
            />
            <p>
              A bare <code>RAISE</code> with no arguments re-raises the error you just caught. That is the right
              way to log and still fail.
            </p>
            <p>
              Finally, note that for the common case of a duplicate key you usually do not need an exception
              handler at all. <code>ON CONFLICT</code> handles it in one statement, with no savepoint overhead.
            </p>
            <CodeBlock
              title="Prefer ON CONFLICT"
              language="sql"
              code={`INSERT INTO users (email) VALUES (p_email)
ON CONFLICT (email) DO NOTHING;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How do you raise errors and notices from PL/pgSQL?">
            <p>
              <code>RAISE EXCEPTION</code> aborts with an error. <code>RAISE NOTICE</code> and
              <code>RAISE WARNING</code> print a diagnostic message and carry on. You can attach an
              <code>ERRCODE</code> so callers can react to a specific condition programmatically.
            </p>
            <CodeBlock
              title="RAISE"
              language="sql"
              code={`IF p_amount <= 0 THEN
  RAISE EXCEPTION 'amount must be positive'
    USING ERRCODE = 'check_violation';
END IF;`}
            />
            <p>
              The <code>%</code> placeholder substitutes the next argument into the message. To print a literal
              percent sign, write <code>%%</code>.
            </p>
            <CodeBlock
              title="Message formatting and extra fields"
              language="sql"
              code={`RAISE NOTICE 'processing order % for user %', p_order_id, p_user_id;

RAISE EXCEPTION 'insufficient funds in account %', p_account_id
  USING ERRCODE = 'P0001',
        DETAIL  = 'Balance is below the requested amount',
        HINT    = 'Top up the account and retry';`}
            />
            <p>
              The levels, from quietest to loudest, are <code>DEBUG</code>, <code>LOG</code>,
              <code>INFO</code>, <code>NOTICE</code>, <code>WARNING</code>, and <code>EXCEPTION</code>. Only
              <code>EXCEPTION</code> stops execution. Whether the others reach the client depends on the
              <code>client_min_messages</code> setting, which is why a <code>NOTICE</code> you added for debugging
              may never appear in application logs.
            </p>
            <p>
              Use codes in the <code>P0001</code> to <code>P9999</code> range, or your own five-character codes,
              for business rule errors. Then the application can branch on the code rather than matching on
              message text, which breaks the moment someone edits the wording.
            </p>
            <CodeBlock
              title="Handling a custom code in Prisma"
              language="typescript"
              code={`try {
  await prisma.$executeRawUnsafe('SELECT withdraw($1, $2)', accountId, amount);
} catch (e) {
  // Prisma surfaces the PostgreSQL error code, not just the message
  if (e.meta?.code === 'P0001') {
    throw new Error('Insufficient funds');
  }
  throw e;
}`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="Which SQLSTATE codes should you know, and how do you use them?">
            <p>
              Every PostgreSQL error carries a five-character <code>SQLSTATE</code> code. The first two characters
              are the class, so you can match a whole family. Most codes also have a readable condition name you
              can use directly in a <code>WHEN</code> clause, which is far better than memorising digits.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <code>23505 unique_violation</code>: a duplicate value hit a unique index. Very common on signup
                and on upserts.
              </li>
              <li>
                <code>23503 foreign_key_violation</code>: the referenced parent row does not exist, or you tried
                to delete a parent that still has children.
              </li>
              <li>
                <code>23502 not_null_violation</code>: a required column was left empty.
              </li>
              <li>
                <code>23514 check_violation</code>: a <code>CHECK</code> constraint rejected the row. This is also
                the natural code to reuse for your own business rules.
              </li>
              <li>
                <code>40001 serialization_failure</code>: a concurrent transaction conflicted. The correct
                response is to retry, not to report an error.
              </li>
              <li>
                <code>40P01 deadlock_detected</code>: two transactions waited on each other and PostgreSQL killed
                one. Also retryable.
              </li>
              <li>
                <code>22P02 invalid_text_representation</code>: a cast failed, for example text that is not a
                number.
              </li>
              <li>
                <code>P0002 no_data_found</code> and <code>P0003 too_many_rows</code>: raised by
                <code>SELECT ... INTO STRICT</code> when it gets zero rows or more than one.
              </li>
            </ul>
            <CodeBlock
              title="Handling specific conditions"
              language="sql"
              code={`CREATE OR REPLACE FUNCTION link_order(p_order_id bigint, p_user_id int)
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO order_owners (order_id, user_id)
  VALUES (p_order_id, p_user_id);
  RETURN 'linked';
EXCEPTION
  WHEN unique_violation THEN
    RETURN 'already linked';
  WHEN foreign_key_violation THEN
    RAISE EXCEPTION 'order % or user % does not exist', p_order_id, p_user_id
      USING ERRCODE = 'P0001';
END;
$$;`}
            />
            <p>
              You can match a whole class with <code>SQLSTATE</code> string comparison when there is no single
              condition name that covers what you want.
            </p>
            <CodeBlock
              title="Matching by code and by class"
              language="sql"
              code={`EXCEPTION
  WHEN SQLSTATE '23505' THEN
    RETURN 'duplicate';
  WHEN SQLSTATE '40001' OR SQLSTATE '40P01' THEN
    RAISE;  -- let the caller retry these
END;`}
            />
            <p>
              The same codes surface in application code, and reacting to them properly is what makes a service
              resilient. In Prisma, <code>P2002</code> is the client-level wrapper for a unique violation and
              <code>P2003</code> for a foreign key violation.
            </p>
            <CodeBlock
              title="Prisma error codes"
              language="typescript"
              code={`import { Prisma } from '@prisma/client';

try {
  await prisma.user.create({ data: { email } });
} catch (e) {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === 'P2002') return { error: 'Email already registered' };
    if (e.code === 'P2003') return { error: 'Related record missing' };
  }
  throw e;
}`}
            />
            <p>
              The senior-level point: sort errors into three buckets. Retryable ones such as
              <code>40001</code> and <code>40P01</code> should be retried automatically with a small backoff.
              Expected business conditions such as <code>23505</code> should become a clean message for the user.
              Everything else should be logged with full context and allowed to fail loudly.
            </p>
          </InterviewQACard>

          <InterviewQACard level="Senior" question="Why is catching WHEN OTHERS and ignoring it dangerous?">
            <p>
              <code>WHEN OTHERS THEN NULL;</code> is the PL/pgSQL equivalent of an empty catch block. It compiles,
              the function stops failing, and the bug is now invisible. Interviewers ask this to see whether you
              understand what gets lost.
            </p>
            <CodeBlock
              title="The anti-pattern"
              language="sql"
              code={`-- Never ship this
BEGIN
  UPDATE accounts SET balance = balance - p_amount WHERE id = p_from;
  UPDATE accounts SET balance = balance + p_amount WHERE id = p_to;
EXCEPTION
  WHEN OTHERS THEN
    NULL;  -- money silently vanishes, caller is told nothing
END;`}
            />
            <p>Concretely, here is what goes wrong:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Silent data loss.</strong> The caller sees success. The rows were never written. Nobody
                finds out until a reconciliation report disagrees weeks later.
              </li>
              <li>
                <strong>Retryable errors stop being retried.</strong> <code>40001</code> and
                <code>40P01</code> are meant to bubble up so the transaction runs again. Swallowing them converts
                a recoverable conflict into permanently lost work.
              </li>
              <li>
                <strong>Real bugs get hidden.</strong> A typo in a column name, an out-of-memory error, or a
                cancelled query all come through <code>OTHERS</code>. You have suppressed your own crash reports.
              </li>
              <li>
                <strong>Broken invariants.</strong> Because the handler rolls the block back, a partially
                completed multi-step operation leaves the data in a state your business rules say is impossible,
                while the surrounding transaction commits anyway.
              </li>
              <li>
                <strong>Query cancellation is caught too.</strong> A statement timeout or a user pressing cancel
                raises <code>query_canceled</code>, which <code>OTHERS</code> happily absorbs. Your function keeps
                going when it should have stopped.
              </li>
            </ul>
            <p>
              If you do catch <code>OTHERS</code>, the rule is: handle a specific thing, record everything, and
              re-raise. Catch the narrow condition you actually expect, and leave the rest alone.
            </p>
            <CodeBlock
              title="Log and re-raise"
              language="sql"
              code={`DECLARE
  v_state text;
  v_msg   text;
  v_ctx   text;
BEGIN
  PERFORM do_the_work(p_id);
EXCEPTION
  WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS
      v_state = RETURNED_SQLSTATE,
      v_msg   = MESSAGE_TEXT,
      v_ctx   = PG_EXCEPTION_CONTEXT;

    RAISE WARNING 'do_the_work failed: % % | %', v_state, v_msg, v_ctx;
    RAISE;  -- the caller still learns it failed
END;`}
            />
            <p>
              Note a subtlety about logging from inside a handler. If you insert an error row and then re-raise,
              that insert is rolled back along with everything else, so the log entry disappears. To keep an audit
              trail through a failure you need something that survives the rollback: write to the server log with
              <code>RAISE WARNING</code>, or emit the record from a separate autonomous mechanism rather than the
              failing transaction.
            </p>
            <p>
              A short answer that lands well in an interview: catch the condition you can actually do something
              about, always include <code>SQLSTATE</code> and context when you log, and never let
              <code>40001</code> or <code>40P01</code> die inside a handler.
            </p>
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 2: Numeric and Conditional Functions - Module 7 - Most Asked Interview Questions',
  description:
    'Most asked PostgreSQL numeric and conditional interview questions: ROUND, CEIL, FLOOR, ABS, MOD, the integer division trap, COALESCE vs NULLIF vs CASE, GREATEST, LEAST, safe casting, and money rounding.',
};

export default function M7L2NumericAndConditional() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 2: Numeric and Conditional Functions</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Numbers and NULL cause more production bugs than almost anything else. This lesson covers rounding,
          division traps, choosing between <code>COALESCE</code>, <code>NULLIF</code> and <code>CASE</code>, and
          how to cast text to numbers without crashing the query.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="Explain ROUND and COALESCE.">
            <p>
              <code>ROUND</code> rounds a number to the number of decimal places you ask for.
              <code>COALESCE</code> returns the first argument that is not NULL. NULL means &quot;no value
              stored&quot;, which is different from 0 or an empty string.
            </p>
            <p>
              <code>COALESCE</code> is how you show a sensible default instead of a blank. It takes as many
              arguments as you like and stops at the first one with a value.
            </p>
            <CodeBlock
              title="ROUND and COALESCE"
              language="sql"
              code={`SELECT
  ROUND(price::numeric, 2) AS price_2dp,
  COALESCE(nickname, first_name, 'Anonymous') AS display_name
FROM users
JOIN products ON true
LIMIT 5;`}
            />
            <p>
              One gotcha: two-argument <code>ROUND(value, places)</code> only exists for
              <code>numeric</code>. If your column is <code>double precision</code> you must cast it first, which
              is why the example writes <code>price::numeric</code>.
            </p>
            <CodeBlock
              title="Why the cast is needed"
              language="sql"
              code={`SELECT ROUND(1.2345::numeric, 2);          -- 1.23
SELECT ROUND(1.2345::double precision);    -- 1  (no places allowed)
SELECT ROUND(1.2345::double precision, 2); -- error without a cast`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="What do CEIL, FLOOR, ABS, and MOD do?">
            <p>These four show up constantly in small calculations.</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <code>CEIL</code> (or <code>CEILING</code>) rounds up to the next whole number.
              </li>
              <li>
                <code>FLOOR</code> rounds down to the previous whole number.
              </li>
              <li>
                <code>ABS</code> gives the absolute value, meaning it drops the minus sign.
              </li>
              <li>
                <code>MOD(a, b)</code> gives the remainder after dividing. The <code>%</code> operator does the
                same thing.
              </li>
            </ul>
            <CodeBlock
              title="CEIL, FLOOR, ABS, MOD"
              language="sql"
              code={`SELECT
  CEIL(4.1)      AS rounded_up,    -- 5
  FLOOR(4.9)     AS rounded_down,  -- 4
  ABS(-42)       AS positive,      -- 42
  MOD(17, 5)     AS remainder,     -- 2
  17 % 5         AS same_remainder;-- 2`}
            />
            <p>
              A very common interview use of <code>CEIL</code> is paging: how many pages do I need for N rows at
              20 rows per page? A common use of <code>MOD</code> is picking every nth row or splitting work
              between workers.
            </p>
            <CodeBlock
              title="Practical uses"
              language="sql"
              code={`-- Total pages, 20 rows per page
SELECT CEIL(COUNT(*) / 20.0) AS page_count FROM orders;

-- Shard rows across 4 workers
SELECT * FROM jobs WHERE MOD(id, 4) = 0;`}
            />
            <p>
              Notice <code>20.0</code> rather than <code>20</code> in the paging query. The next question explains
              why that detail matters.
            </p>
          </InterviewQACard>

          <InterviewQACard level="Junior" question="Why does 1 / 2 return 0 in PostgreSQL?">
            <p>
              This is the integer division trap, and it is asked in almost every SQL interview. When both sides of
              <code>/</code> are integers, PostgreSQL does integer division: it divides and then throws away the
              fractional part. It does not round. So <code>1 / 2</code> is <code>0</code> and
              <code>7 / 2</code> is <code>3</code>.
            </p>
            <p>
              The fix is to make at least one side a decimal type. You can cast a column, or just write the
              literal with a decimal point.
            </p>
            <CodeBlock
              title="The trap and the fixes"
              language="sql"
              code={`SELECT 1 / 2           AS trap;        -- 0
SELECT 1.0 / 2         AS decimal_div; -- 0.5
SELECT 1::numeric / 2  AS cast_left;   -- 0.5
SELECT 1 / 2.0         AS cast_right;  -- 0.5`}
            />
            <p>
              Where this really bites is percentages. Counting rows returns <code>bigint</code>, so a naive
              percentage is always 0 or 100.
            </p>
            <CodeBlock
              title="Percentage done correctly"
              language="sql"
              code={`-- Wrong: integer division, always 0 or 1
SELECT COUNT(*) FILTER (WHERE status = 'paid') / COUNT(*) AS bad_ratio
FROM orders;

-- Right: cast to numeric, guard against divide by zero, then round
SELECT ROUND(
         100.0 * COUNT(*) FILTER (WHERE status = 'paid')
         / NULLIF(COUNT(*), 0),
         2
       ) AS paid_percent
FROM orders;`}
            />
            <p>
              Dividing by zero raises an error and kills the statement. <code>NULLIF(COUNT(*), 0)</code> turns a
              zero divisor into NULL, and dividing by NULL simply gives NULL.
            </p>
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="When do NULLIF, GREATEST, and LEAST matter?">
            <p>
              <code>NULLIF(a, b)</code> returns NULL when the two values are equal, otherwise it returns
              <code>a</code>. The classic use is guarding against divide by zero, as shown above.
            </p>
            <p>
              <code>GREATEST</code> and <code>LEAST</code> pick the largest or smallest value from a list of
              arguments. They work across columns in the same row, which is different from <code>MAX</code> and
              <code>MIN</code> that work down a column across rows.
            </p>
            <CodeBlock
              title="NULLIF, GREATEST, LEAST"
              language="sql"
              code={`-- Guard a divisor
SELECT total_cents::numeric / NULLIF(quantity, 0) AS unit_price
FROM order_items;

-- Compare values in the same row
SELECT
  id,
  GREATEST(created_at, updated_at) AS last_touched,
  LEAST(price, sale_price)         AS best_price
FROM products;

-- Clamp a value between 0 and 100
SELECT LEAST(GREATEST(score, 0), 100) AS clamped FROM results;`}
            />
            <p>
              <code>NULLIF</code> also turns placeholder junk into real NULL, which is useful when cleaning
              imported data where blanks arrived as empty strings.
            </p>
            <CodeBlock
              title="Cleaning empty strings"
              language="sql"
              code={`UPDATE imports
SET phone = NULLIF(TRIM(phone), '');`}
            />
            <p>
              One version detail worth knowing: <code>GREATEST</code> and <code>LEAST</code> historically ignore
              NULL arguments in PostgreSQL and only return NULL when every argument is NULL. Newer versions added
              explicit control over this, so if the answer must be exact, confirm the behaviour for the version
              you run.
            </p>
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What is the difference between COALESCE, NULLIF, and CASE?">
            <p>
              All three handle conditions, but each has a job it does best. Interviewers ask this to see whether
              you reach for the simplest tool.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <code>COALESCE(a, b, c)</code> replaces NULL with a fallback. Use it when the only condition you
                care about is &quot;is this missing?&quot;.
              </li>
              <li>
                <code>NULLIF(a, b)</code> creates a NULL. It is the opposite direction: it turns a specific value
                into nothing.
              </li>
              <li>
                <code>CASE</code> is the general tool. Use it when the condition is anything other than a plain
                NULL or equality check, such as ranges or multiple branches.
              </li>
            </ul>
            <CodeBlock
              title="Same intent, three tools"
              language="sql"
              code={`SELECT
  -- Missing value gets a default
  COALESCE(nickname, 'Anonymous')                  AS display_name,

  -- Sentinel value becomes NULL
  NULLIF(status, 'unknown')                        AS clean_status,

  -- Multiple branches need CASE
  CASE
    WHEN total_cents >= 100000 THEN 'large'
    WHEN total_cents >= 10000  THEN 'medium'
    ELSE 'small'
  END                                              AS order_size
FROM orders;`}
            />
            <p>
              Two details that come up as follow-up questions. First, <code>COALESCE</code> short-circuits: it
              stops evaluating once it finds a value, so an expensive subquery in a later argument may never run.
              Second, a <code>CASE</code> with no matching branch and no <code>ELSE</code> returns NULL rather
              than raising an error.
            </p>
            <CodeBlock
              title="CASE without ELSE returns NULL"
              language="sql"
              code={`SELECT CASE WHEN 1 = 2 THEN 'never' END AS result; -- NULL`}
            />
            <p>
              In Prisma you usually do simple fallbacks in JavaScript, and drop to raw SQL when you need real
              <code>CASE</code> logic inside the database.
            </p>
            <CodeBlock
              title="Prisma"
              language="typescript"
              code={`// Simple fallback in app code
const user = await prisma.user.findUniqueOrThrow({ where: { id } });
const displayName = user.nickname ?? user.firstName ?? 'Anonymous';

// Bucketing is better done in SQL
const buckets = await prisma.$queryRawUnsafe(
  "SELECT CASE WHEN total_cents >= 10000 THEN 'big' ELSE 'small' END AS bucket, COUNT(*) FROM orders GROUP BY 1",
);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How do you round money correctly?">
            <p>
              The first answer interviewers want is: do not store money in a floating point type.
              <code>real</code> and <code>double precision</code> store approximations, so
              <code>0.1 + 0.2</code> is not exactly <code>0.3</code> and totals drift over time.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Best option: store whole cents in an <code>integer</code> or <code>bigint</code> column, then
                divide by 100 only when displaying.
              </li>
              <li>
                Also fine: <code>numeric(12, 2)</code>, which stores exact decimal digits.
              </li>
              <li>
                Avoid: <code>float</code>, <code>real</code>, <code>double precision</code>.
              </li>
            </ul>
            <CodeBlock
              title="Float is not exact"
              language="sql"
              code={`SELECT 0.1::double precision + 0.2::double precision = 0.3::double precision;
-- false

SELECT 0.1::numeric + 0.2::numeric = 0.3::numeric;
-- true`}
            />
            <p>
              Another detail: <code>ROUND</code> on <code>numeric</code> rounds half away from zero, so
              <code>0.5</code> becomes <code>1</code>. <code>ROUND</code> on <code>double precision</code> uses
              banker&apos;s rounding, where half goes to the nearest even number. Same input, different answer.
            </p>
            <CodeBlock
              title="Two different rounding rules"
              language="sql"
              code={`SELECT ROUND(0.5::numeric)          AS numeric_half; -- 1
SELECT ROUND(0.5::double precision) AS float_half;   -- 0
SELECT ROUND(1.5::double precision) AS float_one_five; -- 2`}
            />
            <p>
              Finally, round once at the end, not at every intermediate step. Rounding each line of an invoice and
              then summing gives a different total from summing and then rounding.
            </p>
            <CodeBlock
              title="Round at the end"
              language="sql"
              code={`-- Cents stored as integers; format only for display
SELECT
  order_id,
  SUM(unit_price_cents * quantity)                        AS total_cents,
  ROUND(SUM(unit_price_cents * quantity) / 100.0, 2)      AS total_dollars,
  TO_CHAR(SUM(unit_price_cents * quantity) / 100.0, 'FM999,999.00') AS pretty
FROM order_items
GROUP BY order_id;`}
            />
            <p>
              Prisma maps <code>numeric</code> to a Decimal type rather than a JavaScript number, which keeps the
              precision. If you store cents as integers, keep the conversion to currency in one helper so it never
              drifts.
            </p>
            <CodeBlock
              title="Prisma schema for money"
              language="prisma"
              code={`model Order {
  id         Int     @id @default(autoincrement())
  totalCents Int     // exact, safe integer arithmetic
  taxRate    Decimal @db.Decimal(5, 4) // exact decimal, not a float
}`}
            />
            <CodeBlock
              title="One helper for display"
              language="typescript"
              code={`// Keep the conversion in a single place so it never drifts
const toMoney = (cents: number) => (cents / 100).toFixed(2);

const order = await prisma.order.findUniqueOrThrow({ where: { id } });
console.log(toMoney(order.totalCents));

// taxRate comes back as a Prisma Decimal, not a JS number
const tax = order.taxRate.mul(order.totalCents).toFixed(0);`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="How do you safely cast and handle type conversion errors in expressions?">
            <p>
              Casting means converting a value from one type to another. Prefer explicit casts such as
              <code>::numeric</code> or <code>CAST(... AS numeric)</code> so the intent is visible in the query.
            </p>
            <p>
              The risk with untrusted text is that a single bad row aborts the whole statement. There is no
              per-row &quot;skip errors&quot; flag in a plain <code>SELECT</code>, so you validate before you
              cast.
            </p>
            <CodeBlock
              title="Safe-ish casting pattern"
              language="sql"
              code={`SELECT
  CASE
    WHEN amount_text ~ '^[0-9]+(\\.[0-9]+)?$'
      THEN amount_text::numeric
    ELSE NULL
  END AS amount
FROM imports;`}
            />
            <p>
              The <code>~</code> operator means &quot;matches this regular expression&quot;. The pattern above
              says the whole string must be digits, optionally followed by a dot and more digits. Anything else
              becomes NULL instead of an error.
            </p>
            <p>
              Be aware that PostgreSQL may evaluate parts of an expression in an order you did not expect, so a
              <code>WHERE</code> filter does not always protect a cast in the <code>SELECT</code> list. Putting
              the guard inside the same <code>CASE</code> as the cast is the reliable form.
            </p>
            <CodeBlock
              title="Guarding in WHERE is not always enough"
              language="sql"
              code={`-- Can still fail: the planner may cast before filtering
SELECT amount_text::numeric
FROM imports
WHERE amount_text ~ '^[0-9]+$';

-- Reliable: the guard and the cast are in one expression
SELECT CASE WHEN amount_text ~ '^[0-9]+$' THEN amount_text::numeric END
FROM imports;`}
            />
            <p>
              For repeated use, wrap it in an <code>IMMUTABLE</code> function with an exception handler. That
              catches any conversion error, not just the ones your pattern anticipated. Module 8 covers exception
              blocks in detail.
            </p>
            <CodeBlock
              title="A reusable safe cast function"
              language="sql"
              code={`CREATE OR REPLACE FUNCTION safe_numeric(p_text text)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN p_text::numeric;
EXCEPTION
  WHEN invalid_text_representation THEN
    RETURN NULL;
END;
$$;

SELECT safe_numeric('12.5'), safe_numeric('oops');
-- 12.5, NULL`}
            />
            <p>
              For bulk loads, the better answer is usually structural: load everything into a staging table where
              every column is <code>text</code>, validate there, report the bad rows back to whoever sent the
              file, and only then move the clean rows into the typed table.
            </p>
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

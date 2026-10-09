import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 3: Date and Time Functions - Module 7 - Most Asked Interview Questions',
  description:
    'Most asked PostgreSQL datetime interview questions: NOW, date_trunc for monthly grouping, AGE and interval maths, EXTRACT vs TO_CHAR, adding days, and the difference between two timestamps.',
};

export default function M7L3DatetimeFunctions() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 3: Date and Time Functions</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Almost every reporting question in an interview is a date question. This lesson covers reading the
          current time, grouping rows by month, pulling one part out of a date, and doing maths with dates.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="Which datetime functions are most commonly asked?">
            <p>Three cover most questions:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <code>NOW()</code> or <code>CURRENT_TIMESTAMP</code> gives the current date and time.
              </li>
              <li>
                <code>AGE</code> gives the gap between two timestamps as a readable interval, such as
                &quot;2 years 3 mons 4 days&quot;.
              </li>
              <li>
                <code>date_trunc</code> chops a timestamp down to a unit such as day, month or hour. Chopping
                like this is called bucketing.
              </li>
            </ul>
            <CodeBlock
              title="Datetime"
              language="sql"
              code={`SELECT
  NOW() AS now_ts,
  AGE(NOW(), created_at) AS account_age,
  date_trunc('month', created_at) AS month_bucket
FROM users;`}
            />
            <p>
              One detail interviewers probe: <code>NOW()</code> returns the time the transaction started, so it
              stays the same for every row and every statement in that transaction. If you truly want the clock to
              move, use <code>clock_timestamp()</code>.
            </p>
            <CodeBlock
              title="Transaction time vs wall-clock time"
              language="sql"
              code={`BEGIN;
SELECT NOW(), clock_timestamp();
SELECT NOW(), clock_timestamp(); -- NOW() unchanged, clock_timestamp() moved
COMMIT;`}
            />
            <p>
              Also prefer <code>timestamptz</code> (timestamp with time zone) over plain
              <code>timestamp</code> for anything that records a real-world event. It stores an exact point in
              time, so the value still means the same thing when read from another time zone.
            </p>
          </InterviewQACard>

          <InterviewQACard level="Junior" question="How do you add days or months to a date?">
            <p>
              You add an <code>INTERVAL</code>. An interval is a span of time, written in plain words such as
              <code>&apos;7 days&apos;</code> or <code>&apos;1 month&apos;</code>. Adding or subtracting an
              interval from a timestamp gives another timestamp.
            </p>
            <CodeBlock
              title="Interval arithmetic"
              language="sql"
              code={`SELECT
  NOW() + INTERVAL '7 days'      AS next_week,
  NOW() - INTERVAL '1 month'     AS last_month,
  NOW() + INTERVAL '2 hours 30 minutes' AS soon,
  created_at + INTERVAL '30 days' AS trial_ends
FROM users;`}
            />
            <p>
              When the number of days comes from a column or a parameter, you cannot glue it into the literal
              string easily. Use <code>make_interval</code> or multiply a one-unit interval by a number.
            </p>
            <CodeBlock
              title="Interval from a variable amount"
              language="sql"
              code={`SELECT
  created_at + make_interval(days => trial_days) AS ends_a,
  created_at + (trial_days * INTERVAL '1 day')   AS ends_b
FROM subscriptions;`}
            />
            <p>
              Month maths is not fixed-width, and that is a good follow-up answer. Adding one month to 31 January
              lands on 28 or 29 February, because PostgreSQL clamps to the last valid day rather than overflowing
              into March.
            </p>
            <CodeBlock
              title="Months clamp to the last valid day"
              language="sql"
              code={`SELECT DATE '2026-01-31' + INTERVAL '1 month' AS result;
-- 2026-02-28`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="How do you find the difference between two timestamps?">
            <p>
              Subtracting one timestamp from another gives an <code>interval</code>. Subtracting one
              <code>date</code> from another gives a plain integer number of days. That difference in return type
              surprises people.
            </p>
            <CodeBlock
              title="Subtraction results"
              language="sql"
              code={`SELECT
  NOW() - created_at                      AS as_interval,
  DATE '2026-03-01' - DATE '2026-01-01'   AS as_days; -- 59`}
            />
            <p>
              An interval is awkward to compare or sort. For reports you usually want a single number, so convert
              it with <code>EXTRACT(EPOCH FROM ...)</code>. Epoch means the total number of seconds, so you divide
              to get minutes, hours or days.
            </p>
            <CodeBlock
              title="Interval to a number"
              language="sql"
              code={`SELECT
  EXTRACT(EPOCH FROM (shipped_at - created_at))            AS seconds_to_ship,
  EXTRACT(EPOCH FROM (shipped_at - created_at)) / 3600.0   AS hours_to_ship,
  ROUND(
    (EXTRACT(EPOCH FROM (shipped_at - created_at)) / 86400.0)::numeric,
    1
  ) AS days_to_ship
FROM orders
WHERE shipped_at IS NOT NULL;`}
            />
            <p>
              A frequent trap: <code>EXTRACT(DAY FROM interval)</code> returns only the days component, not the
              total. An interval of &quot;1 month 5 days&quot; reports 5, not 35. When you want a total, always go
              through epoch seconds.
            </p>
            <CodeBlock
              title="Average shipping time"
              language="sql"
              code={`SELECT
  date_trunc('week', created_at) AS week,
  ROUND(AVG(EXTRACT(EPOCH FROM (shipped_at - created_at)) / 3600.0)::numeric, 1)
    AS avg_hours_to_ship
FROM orders
WHERE shipped_at IS NOT NULL
GROUP BY 1
ORDER BY 1;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="How do you format or extract parts of dates for reporting?">
            <p>
              Use <code>EXTRACT</code>, <code>TO_CHAR</code>, and <code>date_trunc</code>. Interviewers very often
              ask for monthly revenue grouping, so this exact query is worth memorising.
            </p>
            <CodeBlock
              title="Date bucketing"
              language="sql"
              code={`SELECT
  date_trunc('month', created_at) AS month,
  TO_CHAR(created_at, 'YYYY-MM') AS month_label,
  SUM(total_cents) AS revenue
FROM orders
WHERE created_at >= NOW() - INTERVAL '1 year'
GROUP BY 1, 2
ORDER BY 1;`}
            />
            <p>
              Note the <code>WHERE</code> clause compares the bare column against a computed value. That shape can
              still use an index on <code>created_at</code>. Wrapping the column in a function instead, such as
              <code>date_trunc(...) &gt;= ...</code>, would stop the index being used. Lesson 6 explains why.
            </p>
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How does date_trunc group rows by month, and why not use TO_CHAR for grouping?">
            <p>
              <code>date_trunc(unit, timestamp)</code> keeps everything down to the unit you name and zeroes the
              rest. Truncating to <code>&apos;month&apos;</code> turns every timestamp in March into
              <code>2026-03-01 00:00:00</code>, so all of March collapses into one group.
            </p>
            <CodeBlock
              title="What truncation actually returns"
              language="sql"
              code={`SELECT
  date_trunc('day',   TIMESTAMP '2026-03-17 14:35:22') AS by_day,
  date_trunc('month', TIMESTAMP '2026-03-17 14:35:22') AS by_month,
  date_trunc('year',  TIMESTAMP '2026-03-17 14:35:22') AS by_year,
  date_trunc('hour',  TIMESTAMP '2026-03-17 14:35:22') AS by_hour;`}
            />
            <p>
              You can group by <code>TO_CHAR(created_at, &apos;YYYY-MM&apos;)</code> and it looks similar, but
              <code>date_trunc</code> is the better grouping key for three reasons:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                It stays a timestamp, so it sorts chronologically. Text sorts alphabetically, which breaks as soon
                as your label is something like <code>&apos;Mar 2026&apos;</code>.
              </li>
              <li>
                It compares and joins cleanly against other date values without parsing text back into a date.
              </li>
              <li>
                It is cheaper, and it can be indexed as an expression if the report runs often.
              </li>
            </ul>
            <p>
              The usual pattern is to group by <code>date_trunc</code> and use <code>TO_CHAR</code> only to build
              the human-readable label, exactly as the previous query does.
            </p>
            <CodeBlock
              title="Monthly report with no gaps"
              language="sql"
              code={`-- generate_series fills in months that had zero orders
SELECT
  m.month,
  COALESCE(SUM(o.total_cents), 0) AS revenue
FROM generate_series(
       date_trunc('month', NOW()) - INTERVAL '11 months',
       date_trunc('month', NOW()),
       INTERVAL '1 month'
     ) AS m(month)
LEFT JOIN orders o
  ON date_trunc('month', o.created_at) = m.month
GROUP BY m.month
ORDER BY m.month;`}
            />
            <p>
              Time zones matter for daily reports. <code>date_trunc</code> on a <code>timestamptz</code> uses the
              session time zone, so a &quot;day&quot; can shift. Convert explicitly with <code>AT TIME ZONE</code>
              so the result does not depend on who runs the query.
            </p>
            <CodeBlock
              title="Truncating in a specific time zone"
              language="sql"
              code={`SELECT date_trunc('day', created_at AT TIME ZONE 'Asia/Kolkata') AS local_day,
       COUNT(*) AS signups
FROM users
GROUP BY 1
ORDER BY 1;`}
            />
            <p>
              Prisma has no <code>date_trunc</code> in its query API, so grouping by month is a raw query. Grouping
              by an exact timestamp column with <code>groupBy</code> is not the same thing, because every distinct
              second becomes its own group.
            </p>
            <CodeBlock
              title="Prisma monthly grouping"
              language="typescript"
              code={`const monthly = await prisma.$queryRawUnsafe(
  "SELECT date_trunc('month', created_at) AS month, SUM(total_cents)::bigint AS revenue FROM orders GROUP BY 1 ORDER BY 1",
);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What is the difference between EXTRACT and TO_CHAR?">
            <p>
              <code>EXTRACT</code> returns a number. <code>TO_CHAR</code> returns text. Choose based on what you
              will do with the value next.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Use <code>EXTRACT</code> when you need to compare, filter or do maths. For example
                &quot;orders placed on a weekend&quot;.
              </li>
              <li>
                Use <code>TO_CHAR</code> when you need a label for a human, such as
                <code>&apos;March 2026&apos;</code> or <code>&apos;Tue&apos;</code>.
              </li>
            </ul>
            <CodeBlock
              title="Numbers vs labels"
              language="sql"
              code={`SELECT
  EXTRACT(YEAR  FROM created_at) AS yr,     -- 2026
  EXTRACT(MONTH FROM created_at) AS mo,     -- 3
  EXTRACT(DOW   FROM created_at) AS weekday,-- 0 = Sunday
  TO_CHAR(created_at, 'YYYY-MM-DD')  AS iso_date,
  TO_CHAR(created_at, 'FMMonth YYYY') AS label,   -- March 2026
  TO_CHAR(created_at, 'Dy')          AS short_day -- Tue
FROM orders;`}
            />
            <p>
              <code>DOW</code> means day of week and counts Sunday as 0. <code>ISODOW</code> counts Monday as 1,
              which usually matches business reporting better. The <code>FM</code> prefix in a
              <code>TO_CHAR</code> pattern removes the padding spaces that PostgreSQL otherwise adds.
            </p>
            <CodeBlock
              title="Weekend orders"
              language="sql"
              code={`SELECT COUNT(*) AS weekend_orders
FROM orders
WHERE EXTRACT(ISODOW FROM created_at) IN (6, 7);`}
            />
            <p>
              There is a third option worth naming: <code>date_part(&apos;month&apos;, ts)</code> is the function
              form of <code>EXTRACT</code> and returns the same number. Use whichever reads better; they are
              equivalent.
            </p>
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="How does AGE differ from plain subtraction, and when should you avoid it?">
            <p>
              <code>AGE(a, b)</code> returns a calendar-aware interval broken into years, months and days.
              Plain subtraction returns a flat interval of days, hours, minutes and seconds. For the same two
              timestamps you get two different-looking answers that are both correct.
            </p>
            <CodeBlock
              title="Same gap, two representations"
              language="sql"
              code={`SELECT
  AGE(TIMESTAMP '2026-03-01', TIMESTAMP '2026-01-15')   AS age_result,
  TIMESTAMP '2026-03-01' - TIMESTAMP '2026-01-15'       AS subtraction;
-- age_result: 1 mon 14 days
-- subtraction: 45 days`}
            />
            <p>
              <code>AGE</code> called with one argument compares against midnight today, which is handy for
              calculating someone&apos;s age from a date of birth.
            </p>
            <CodeBlock
              title="Years old"
              language="sql"
              code={`SELECT
  id,
  EXTRACT(YEAR FROM AGE(date_of_birth)) AS years_old
FROM people;`}
            />
            <p>Two reasons to avoid <code>AGE</code> in analytics:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Its month component depends on which months the range covers, so two rows with the same real
                duration can produce different intervals. That makes averaging and sorting misleading.
              </li>
              <li>
                Filtering with it hides the column inside a function, so an index on the timestamp column is not
                used.
              </li>
            </ul>
            <CodeBlock
              title="Filter on the column, not on AGE"
              language="sql"
              code={`-- Cannot use an index on created_at
SELECT * FROM users WHERE AGE(NOW(), created_at) > INTERVAL '1 year';

-- Same result, index friendly: the column stands alone
SELECT * FROM users WHERE created_at < NOW() - INTERVAL '1 year';`}
            />
            <p>
              The rule that generalises: keep the indexed column on one side of the comparison by itself, and put
              all the arithmetic on the constant side. Use <code>AGE</code> for display, and epoch seconds for
              measurement.
            </p>
            <CodeBlock
              title="Duration as a sortable number"
              language="sql"
              code={`SELECT
  id,
  AGE(NOW(), created_at)                                    AS human_readable,
  FLOOR(EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400)   AS days_old
FROM users
ORDER BY days_old DESC;`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

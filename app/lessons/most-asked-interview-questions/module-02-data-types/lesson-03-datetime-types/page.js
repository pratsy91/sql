import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 3: Date and Time Types - Module 2 - Most Asked Interview Questions',
  description:
    'Most asked interview questions on PostgreSQL date and time types — TIMESTAMP vs TIMESTAMPTZ, DATE, TIME, INTERVAL, storing UTC, now() variants, date_trunc, and AGE',
};

export default function MaiqM02L03DatetimeTypes() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 3: Date and Time Types</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Time zones cause more production bugs than any other data type. These questions come up in almost every interview above junior level.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="What is the difference between TIMESTAMP and TIMESTAMPTZ?">
            <p>Both store a date and time. The difference is whether Postgres knows the time zone.</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>TIMESTAMP:</strong> a clock time with no zone. &quot;3pm&quot; can mean different moments in different countries</li>
              <li><strong>TIMESTAMPTZ:</strong> saved as UTC, then shown in the session&apos;s time zone</li>
              <li>Use <code>TIMESTAMPTZ</code> for &quot;when did this happen?&quot; (created at, paid at)</li>
              <li>Use <code>TIMESTAMP</code> or <code>DATE</code> for a local appointment that should not shift when you change time zones</li>
            </ul>
            <CodeBlock
              title="Timestamps"
              language="sql"
              code={`SHOW TIME ZONE;
SELECT now();                              -- timestamptz
SELECT now() AT TIME ZONE 'Asia/Kolkata'; -- timestamp in that zone

CREATE TABLE events (
  id         BIGSERIAL PRIMARY KEY,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);`}
            />
            <p>
              A detail that catches people out: <code>TIMESTAMPTZ</code> does not store the zone you sent. It converts to UTC and forgets the original zone.
              If you need to know &quot;the user was in Berlin&quot;, store that zone name in its own column.
            </p>
          </InterviewQACard>

          <InterviewQACard level="Junior" question="What is the difference between DATE, TIME, and INTERVAL?">
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>DATE:</strong> a calendar day only, such as 2026-03-15. 4 bytes, no time, no zone</li>
              <li><strong>TIME:</strong> a clock time only, such as 09:30:00. Good for opening hours or a daily schedule</li>
              <li><strong>TIMETZ:</strong> time with a zone offset. Almost useless, because an offset without a date cannot handle daylight saving. Avoid it</li>
              <li><strong>INTERVAL:</strong> a length of time, such as 2 days or 90 minutes. It is the result of subtracting two timestamps, and you can add it back to one</li>
              <li>An INTERVAL keeps months, days, and seconds separately, because &quot;1 month&quot; is not a fixed number of days</li>
            </ul>
            <CodeBlock
              title="Dates, times, and intervals"
              language="sql"
              code={`SELECT current_date;                       -- 2026-03-15
SELECT current_time;                       -- 09:30:12.123+05:30
SELECT '2026-03-31'::date + INTERVAL '1 month';  -- 2026-04-30, clamped

CREATE TABLE store_hours (
  id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  weekday   SMALLINT NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  opens_at  TIME NOT NULL,
  closes_at TIME NOT NULL
);

CREATE TABLE subscriptions (
  id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  starts_on DATE NOT NULL,
  term      INTERVAL NOT NULL DEFAULT INTERVAL '1 year'
);

SELECT starts_on + term AS renews_on FROM subscriptions;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="Why should you store timestamps in UTC?">
            <p>
              UTC is one fixed timeline with no daylight saving. If every stored moment is UTC, then sorting, subtracting, and comparing timestamps always
              works, and you convert to a local zone only when you show the value to a person.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Local times are ambiguous twice a year. When a clock goes back, 1:30am happens twice. When it goes forward, 2:30am never happens at all</li>
              <li>Two users in different zones can both say &quot;9am&quot; and mean different moments. UTC removes the argument</li>
              <li>Governments change time zone rules. A stored UTC instant never changes meaning; a stored local time does</li>
              <li>In Postgres the practical rule is simple: use <code>TIMESTAMPTZ</code> and let the server store UTC for you</li>
              <li>Set your servers and jobs to UTC so logs and database rows line up</li>
            </ul>
            <CodeBlock
              title="Store UTC, display local"
              language="sql"
              code={`-- Server-wide default
-- postgresql.conf: timezone = 'UTC'

SET TIME ZONE 'UTC';
INSERT INTO events (occurred_at) VALUES (now());

-- Show the same instant to an Indian user
SELECT occurred_at AT TIME ZONE 'Asia/Kolkata' AS local_time FROM events;

-- Group by the user's local day, not UTC day
SELECT date_trunc('day', occurred_at AT TIME ZONE 'Asia/Kolkata') AS local_day,
       count(*)
FROM events
GROUP BY 1
ORDER BY 1;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="What is the difference between now(), current_timestamp, and clock_timestamp()?">
            <p>
              <code>now()</code> and <code>current_timestamp</code> are the same function and both return the time the current transaction started.
              <code> clock_timestamp()</code> reads the real clock every time you call it.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>now() / current_timestamp:</strong> frozen for the whole transaction. Two rows inserted in one transaction get identical timestamps, which is usually what you want for consistency</li>
              <li><strong>statement_timestamp():</strong> the time the current statement began. Changes between statements inside one transaction</li>
              <li><strong>clock_timestamp():</strong> the actual wall clock right now. Use it to measure how long something took inside a function</li>
              <li><strong>transaction_timestamp():</strong> an explicit alias for <code>now()</code></li>
              <li>Interview trap: <code>now()</code> is stable, so it cannot be used to time a loop. Also, because it is stable, it is safe in an index predicate discussion only as a constant, never as a moving target</li>
              <li><code>current_timestamp(0)</code> lets you drop the fractional seconds</li>
            </ul>
            <CodeBlock
              title="Frozen vs live clock"
              language="sql"
              code={`BEGIN;
SELECT now(), clock_timestamp();
SELECT pg_sleep(1);
SELECT now(), clock_timestamp();  -- now() unchanged, clock_timestamp() moved
COMMIT;

-- Timing inside PL/pgSQL
-- t0 := clock_timestamp(); ... ; RAISE NOTICE '%', clock_timestamp() - t0;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How do date_trunc and AGE work?">
            <p>
              <code>date_trunc</code> rounds a timestamp down to the start of a unit, such as the start of the hour or the start of the month.
              <code> age</code> subtracts two timestamps and returns a human-readable interval in years, months, and days.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><code>date_trunc(&apos;month&apos;, ts)</code> is how almost every monthly report is grouped</li>
              <li>With TIMESTAMPTZ, always truncate after converting to the zone you care about, or your daily buckets are UTC days</li>
              <li>Postgres 14+ has <code>date_trunc(unit, ts, timezone)</code>, which does both steps in one call</li>
              <li><code>age(a, b)</code> gives a calendar-aware difference. <code>age(ts)</code> with one argument means age from today</li>
              <li>Plain subtraction (<code>a - b</code>) gives days, hours, minutes instead, which is better for precise durations</li>
              <li>Use <code>extract</code> or <code>date_part</code> to pull a single field out, such as the year or the ISO week</li>
            </ul>
            <CodeBlock
              title="date_trunc, age, extract"
              language="sql"
              code={`SELECT date_trunc('month', '2026-03-15 14:22:05+05:30'::timestamptz);
SELECT date_trunc('day', occurred_at, 'Asia/Kolkata') FROM events; -- PG 14+

SELECT age('2026-03-15'::date, '1994-07-02'::date);  -- 31 years 8 mons 13 days
SELECT '2026-03-15'::timestamp - '2026-03-01'::timestamp; -- 14 days

SELECT extract(year FROM occurred_at)  AS yr,
       extract(dow  FROM occurred_at)  AS day_of_week,
       date_part('epoch', now() - occurred_at) AS seconds_ago
FROM events;

-- Monthly revenue report
SELECT date_trunc('month', created_at) AS month, sum(total) AS revenue
FROM orders
GROUP BY 1
ORDER BY 1;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Would you store a birthday and an event time the same way? Why not?">
            <p>
              No. A birthday is a calendar fact. An event time is a moment on the global timeline. They need different types, and mixing them up is a
              classic production bug.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Birthday:</strong> use <code>DATE</code>. Someone born on 2 July is born on 2 July everywhere. Storing it as TIMESTAMPTZ makes it shift a day depending on the reader&apos;s zone</li>
              <li><strong>Something that happened:</strong> use <code>TIMESTAMPTZ</code>. Created at, paid at, logged in at. You want the exact instant</li>
              <li><strong>A future local appointment:</strong> store the local <code>TIMESTAMP</code> plus the zone name, for example &quot;2027-03-29 09:00&quot; and &quot;Europe/Berlin&quot;. If you store UTC instead and the government changes the daylight saving rules, the meeting moves</li>
              <li><strong>A recurring alarm:</strong> store a <code>TIME</code> plus a zone, and compute the next instant at read time</li>
              <li>Good one-line summary for an interview: store the instant for the past, store the local intent for the future</li>
            </ul>
            <CodeBlock
              title="Different facts, different types"
              language="sql"
              code={`CREATE TABLE people (
  id       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name     TEXT NOT NULL,
  birthday DATE NOT NULL                   -- calendar fact
);

CREATE TABLE logins (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  person_id    BIGINT NOT NULL REFERENCES people (id),
  logged_in_at TIMESTAMPTZ NOT NULL DEFAULT now()  -- an instant
);

CREATE TABLE meetings (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  local_start TIMESTAMP NOT NULL,          -- local intent
  tz          TEXT NOT NULL                -- e.g. 'Europe/Berlin'
);

-- Resolve the meeting to a real instant when you need it
SELECT local_start AT TIME ZONE tz AS starts_at_utc FROM meetings;

-- Birthdays this month, no timezone maths needed
SELECT name FROM people
WHERE extract(month FROM birthday) = extract(month FROM current_date);`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="How does daylight saving time affect TIMESTAMP vs TIMESTAMPTZ?">
            <p>
              <code>TIMESTAMPTZ</code> stores an instant in UTC. When the zone rules change, the displayed local time changes, but the instant stays the same.
              Naive <code>TIMESTAMP</code> has no zone, so DST makes &quot;2:30am&quot; ambiguous or missing.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Never do time-zone maths in the application by adding hours. Use <code>AT TIME ZONE</code></li>
              <li>Keep the IANA zone name (Asia/Kolkata) as text if you must show a future local appointment</li>
              <li><code>extract(epoch FROM timestamptz)</code> is the safe way to get Unix seconds</li>
              <li>Prisma: always set <code>@db.Timestamptz(6)</code>. The default <code>DateTime</code> mapping is timestamp without time zone</li>
            </ul>
            <CodeBlock
              title="DST-safe conversions"
              language="sql"
              code={`SELECT now() AT TIME ZONE 'Asia/Kolkata' AS local_clock;
SELECT extract(epoch FROM now()) AS unix_seconds;

-- Ambiguous local time during a DST fallback cannot be stored as TIMESTAMPTZ
-- without picking a zone. Store UTC instants for the past.`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

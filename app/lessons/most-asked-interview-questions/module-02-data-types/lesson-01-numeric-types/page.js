import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 1: Numeric Types - Module 2 - Most Asked Interview Questions',
  description:
    'Most asked interview questions on PostgreSQL numeric types — INT vs BIGINT vs NUMERIC, why FLOAT is wrong for money, SMALLINT ranges, precision and scale, and integer overflow',
};

export default function MaiqM02L01NumericTypes() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 1: Numeric Types</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Picking the right number type. This lesson is mostly about two things interviewers care about: running out of range, and money that must be exact.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="When do you use INT vs BIGINT vs NUMERIC/DECIMAL?">
            <p>Pick the number type from how big the number is and whether it must be exact.</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>INT:</strong> whole numbers up to about 2 billion. Fine for most counts</li>
              <li><strong>BIGINT:</strong> much larger whole numbers. Use for ids that might grow past 2 billion</li>
              <li><strong>NUMERIC / DECIMAL:</strong> exact decimals. Use for money. Never use a float for money</li>
              <li><strong>REAL / DOUBLE PRECISION:</strong> approximate decimals. OK for ratings or science, not prices</li>
            </ul>
            <CodeBlock
              title="Numeric choices"
              language="sql"
              code={`CREATE TABLE products (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  stock      INT NOT NULL DEFAULT 0,
  price      NUMERIC(12, 2) NOT NULL,  -- exact money
  rating_avg DOUBLE PRECISION          -- approximate OK
);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="Why should you never use FLOAT or DOUBLE PRECISION for money?">
            <p>
              Float types store numbers in binary. Many everyday decimal values, such as 0.1, cannot be written exactly in binary, so the stored value is
              slightly off. Add up thousands of slightly-off values and your totals stop matching the invoices.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><code>NUMERIC</code> stores digits exactly, so 0.1 plus 0.2 really equals 0.3</li>
              <li>Float comparisons also fail in surprising ways, so <code>WHERE total = 9.99</code> can miss rows</li>
              <li>The two safe choices for money are <code>NUMERIC(12, 2)</code>, or a <code>BIGINT</code> holding the amount in the smallest unit (paise or cents)</li>
              <li>NUMERIC is slower than float because it is software maths, but money tables are small compared to the cost of being wrong</li>
              <li>In Prisma use <code>Decimal</code> with <code>@db.Decimal(12, 2)</code>, never <code>Float</code></li>
            </ul>
            <CodeBlock
              title="Float rounding vs NUMERIC"
              language="sql"
              code={`SELECT 0.1::float8 + 0.2::float8 = 0.3::float8 AS float_match;   -- false
SELECT 0.1::numeric + 0.2::numeric = 0.3::numeric AS numeric_match; -- true

SELECT sum(x::float8) AS float_total, sum(x::numeric) AS exact_total
FROM (VALUES ('0.01'), ('0.02'), ('0.03')) AS t(x);`}
            />
            <CodeBlock
              title="Money in Prisma"
              language="typescript"
              code={`model Invoice {
  id     Int     @id @default(autoincrement())
  amount Decimal @db.Decimal(12, 2)
  // amountCents BigInt  // the integer-cents alternative
}`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="What is SMALLINT, and what are the ranges of the integer types?">
            <p>
              Postgres has three fixed-size integer types. Knowing the ranges is a very common quick-fire question.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>SMALLINT (int2), 2 bytes:</strong> about -32,768 to 32,767</li>
              <li><strong>INTEGER (int4), 4 bytes:</strong> about -2.1 billion to 2.1 billion</li>
              <li><strong>BIGINT (int8), 8 bytes:</strong> about -9.2 quintillion to 9.2 quintillion</li>
              <li>All of them are signed. Postgres has no unsigned integer types, unlike MySQL</li>
              <li>SMALLINT saves only 2 bytes per row and often gets padded away by alignment, so use it only for very wide tables or clear small ranges such as a year or a rating</li>
            </ul>
            <CodeBlock
              title="Ranges in practice"
              language="sql"
              code={`SELECT 32767::smallint;             -- ok
-- SELECT 32768::smallint;          -- ERROR: smallint out of range

CREATE TABLE ratings (
  id      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  stars   SMALLINT NOT NULL CHECK (stars BETWEEN 1 AND 5),
  year    SMALLINT NOT NULL
);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="Are NUMERIC and DECIMAL different? What about the MONEY type?">
            <p>
              In PostgreSQL, <code>NUMERIC</code> and <code>DECIMAL</code> are the same type. Interviewers still ask, because other databases treat them differently.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Use either name. Teams usually write <code>NUMERIC(12, 2)</code></li>
              <li><code>MONEY</code> looks tempting but is a bad default: it follows the locale, has rounding quirks, and Prisma does not map it cleanly</li>
              <li>Prefer <code>NUMERIC</code> for prices, or <code>BIGINT</code> storing the amount in paise or cents</li>
            </ul>
            <CodeBlock
              title="NUMERIC, not MONEY"
              language="sql"
              code={`SELECT 10.5::numeric, 10.5::decimal;  -- same type

-- Avoid money for new columns
-- amount MONEY

CREATE TABLE prices (
  amount NUMERIC(12, 2) NOT NULL
);`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="What do the numbers in NUMERIC(10, 2) mean?">
            <p>
              The first number is precision: how many digits in total. The second is scale: how many of those digits are after the decimal point.
              So <code>NUMERIC(10, 2)</code> holds 8 digits before the point and 2 after it.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Values are rounded to the scale on insert, not truncated. 9.999 stored as scale 2 becomes 10.00</li>
              <li>Going over the precision is an error, not a silent rounding. That is usually what you want</li>
              <li>Plain <code>NUMERIC</code> with no precision accepts almost any number. Handy for imports, but it allows inconsistent scale</li>
              <li><code>NUMERIC</code> also accepts the special value <code>NaN</code>, so add a CHECK if that matters</li>
              <li>Storage is variable length, so wide precision costs space only when you use it</li>
            </ul>
            <CodeBlock
              title="Precision and scale behaviour"
              language="sql"
              code={`SELECT 1234.5678::numeric(10, 2);   -- 1234.57 (rounded)
-- SELECT 123456789.00::numeric(10, 2); -- ERROR: numeric field overflow

CREATE TABLE payments (
  id       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  amount   NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  tax_rate NUMERIC(5, 4) NOT NULL   -- e.g. 0.1800 for 18%
);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="For an auto-incrementing id, is SERIAL or IDENTITY the better numeric choice?">
            <p>
              Both produce an integer id from a sequence. <code>IDENTITY</code> is the modern SQL-standard way and is preferred in new code.
              The numeric part of the decision is which width you pick.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><code>SERIAL</code> is INTEGER based, so it stops at about 2.1 billion. <code>BIGSERIAL</code> and <code>BIGINT ... IDENTITY</code> use 8 bytes</li>
              <li>Default to <code>BIGINT GENERATED ALWAYS AS IDENTITY</code>. The extra 4 bytes per row is cheap insurance against a painful migration later</li>
              <li><code>IDENTITY</code> ties the sequence to the column, so dropping the column drops the sequence and permissions are simpler</li>
              <li>Prisma writes <code>Int @default(autoincrement())</code>, which becomes SERIAL. Use <code>BigInt</code> for tables that will grow past 2 billion rows</li>
            </ul>
            <CodeBlock
              title="Choosing the id width"
              language="sql"
              code={`-- Old style, INTEGER range
CREATE TABLE t_small (id SERIAL PRIMARY KEY);

-- Preferred
CREATE TABLE events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  body TEXT NOT NULL
);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What happens when an integer column overflows?">
            <p>
              Postgres raises an error and the statement fails. It does not wrap around to a negative number the way C code does, and it does not
              silently store a wrong value. That is safe, but it means your writes stop working.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>The usual production version of this incident is a SERIAL primary key reaching 2,147,483,647. Every INSERT then fails with &quot;integer out of range&quot;</li>
              <li>The same error can come from a sum or a multiplication, even if the column itself is fine. Cast to <code>bigint</code> or <code>numeric</code> inside the aggregate</li>
              <li>Monitor how close a sequence is to its limit before it becomes an outage</li>
              <li>The fix is an <code>ALTER COLUMN ... TYPE BIGINT</code>, which rewrites the table and locks it, so on a big table you do the expand-contract dance instead</li>
            </ul>
            <CodeBlock
              title="Overflow and how to avoid it"
              language="sql"
              code={`-- Overflow in an aggregate, not the column
SELECT sum(quantity) FROM order_items;              -- can overflow int4
SELECT sum(quantity::bigint) FROM order_items;      -- safe

-- How much room is left in each sequence
SELECT schemaname, sequencename, last_value, max_value,
       round(100.0 * last_value / max_value, 2) AS pct_used
FROM pg_sequences
WHERE last_value IS NOT NULL
ORDER BY pct_used DESC;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="How do you migrate an INT primary key to BIGINT without downtime?">
            <p>
              A plain <code>ALTER TABLE ... ALTER COLUMN id TYPE BIGINT</code> rewrites every row and holds an ACCESS EXCLUSIVE lock, which blocks all reads
              and writes. On a large table that is an outage. So you add a new column and move over gradually.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Add a nullable <code>id_big BIGINT</code> column. Adding a nullable column with no default is instant</li>
              <li>Backfill in small batches with a short sleep between them, so autovacuum keeps up and replicas do not fall behind</li>
              <li>Keep it in sync with a trigger for new and updated rows while the backfill runs</li>
              <li>Do the same for every foreign key column that points at this id, or the swap will fail</li>
              <li>Create the new unique index with <code>CONCURRENTLY</code>, then swap the primary key and the sequence inside one short transaction</li>
              <li>Drop the old column later, once you are sure nothing reads it</li>
            </ul>
            <CodeBlock
              title="Expand, backfill, swap"
              language="sql"
              code={`ALTER TABLE events ADD COLUMN id_big BIGINT;

-- Keep new writes in sync
CREATE FUNCTION events_sync_id_big() RETURNS trigger AS $fn$
BEGIN
  NEW.id_big := NEW.id;
  RETURN NEW;
END;
$fn$ LANGUAGE plpgsql;

CREATE TRIGGER events_sync_id_big_trg
BEFORE INSERT OR UPDATE ON events
FOR EACH ROW EXECUTE FUNCTION events_sync_id_big();

-- Backfill in batches (run repeatedly from a job)
UPDATE events SET id_big = id
WHERE id_big IS NULL
  AND id IN (SELECT id FROM events WHERE id_big IS NULL LIMIT 10000);

CREATE UNIQUE INDEX CONCURRENTLY events_id_big_uidx ON events (id_big);`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

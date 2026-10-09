import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 2: Sequences and Identity - Module 3 - Most Asked Interview Questions',
  description:
    'Most asked interview questions on PostgreSQL sequences and identity columns — SERIAL vs IDENTITY, why ids have gaps, setval, and GENERATED ALWAYS vs BY DEFAULT',
};

export default function MaiqM03L02SequencesAndIdentity() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 2: Sequences and Identity</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          How Postgres generates ids, why those ids skip numbers, and how to fix a sequence that has fallen out of step.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="What is the difference between SERIAL and IDENTITY?">
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>SERIAL / BIGSERIAL:</strong> Convenience shorthand creating a sequence + default — older Postgres style</li>
              <li><strong>GENERATED ... AS IDENTITY:</strong> SQL-standard identity columns (preferred in modern PG)</li>
              <li><code>BY DEFAULT</code> allows override; <code>ALWAYS</code> blocks insert of explicit values unless <code>OVERRIDING SYSTEM VALUE</code></li>
              <li>With SERIAL the sequence is a separate object that merely has a default pointing at it, so it can be left behind or lose its link. With IDENTITY the sequence is owned by the column</li>
              <li>SERIAL also needs the user to have rights on the sequence itself, which is a common permission surprise</li>
            </ul>
            <CodeBlock
              title="SERIAL vs IDENTITY"
              language="sql"
              code={`-- Legacy style
CREATE TABLE t1 (id SERIAL PRIMARY KEY);

-- Modern style (preferred)
CREATE TABLE t2 (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL
);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="What is a sequence?">
            <ul className="list-disc pl-6 space-y-1">
              <li>A sequence is a database object that generates unique integers</li>
              <li>Used by SERIAL/IDENTITY defaults behind the scenes</li>
              <li><code>nextval</code>, <code>currval</code>, <code>setval</code> control it</li>
              <li>Gaps are normal after rollbacks — do not assume contiguous IDs</li>
              <li>A sequence lives outside transactions on purpose, so two sessions never wait for each other to get an id</li>
              <li>Options you can set: <code>START</code>, <code>INCREMENT</code>, <code>MINVALUE</code>, <code>MAXVALUE</code>, <code>CACHE</code>, and <code>CYCLE</code></li>
            </ul>
            <CodeBlock
              title="Sequence basics"
              language="sql"
              code={`CREATE SEQUENCE order_number_seq START 1000;
SELECT nextval('order_number_seq');
SELECT setval('order_number_seq', 5000);`}
            />
            <CodeBlock
              title="Inspect sequences"
              language="sql"
              code={`SELECT schemaname, sequencename, last_value, increment_by, max_value
FROM pg_sequences;

-- Which sequence backs this column?
SELECT pg_get_serial_sequence('orders', 'id');`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="Why do my ids have gaps?">
            <p>
              Because a sequence never gives the same number twice, and it does not take numbers back. That is what makes it fast and safe for many sessions
              at once. Gaps are normal and expected, not a bug.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Rollback:</strong> a failed INSERT still consumed its id. Undoing the row does not undo the <code>nextval</code></li>
              <li><strong>Conflicts:</strong> an <code>INSERT ... ON CONFLICT DO NOTHING</code> evaluates the default first, so a skipped row still burns an id</li>
              <li><strong>Caching:</strong> each session grabs a block of values when <code>CACHE</code> is greater than 1. Values left unused when the session ends are lost forever</li>
              <li><strong>Crash:</strong> Postgres logs sequence advances in chunks, so a crash can leave a jump of up to 32 values</li>
              <li><strong>Deletes:</strong> deleting rows obviously leaves holes, and the sequence keeps counting up</li>
              <li>So never use an id as a count, and never show it to a user as &quot;invoice number 5&quot; if the numbers must be unbroken</li>
              <li>If you truly need gapless numbering, such as for tax invoices, you need a counter row that you lock and update inside the transaction. That serialises inserts, which is exactly the cost a sequence avoids</li>
            </ul>
            <CodeBlock
              title="Gaps in action"
              language="sql"
              code={`CREATE TABLE notes (id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, body TEXT);

INSERT INTO notes (body) VALUES ('first');   -- id 1

BEGIN;
INSERT INTO notes (body) VALUES ('oops');    -- id 2 is consumed
ROLLBACK;                                    -- row gone, id 2 is not reused

INSERT INTO notes (body) VALUES ('second');  -- id 3

SELECT id, body FROM notes;                  -- 1 and 3`}
            />
            <CodeBlock
              title="Gapless numbering when the business demands it"
              language="sql"
              code={`CREATE TABLE invoice_counters (
  year  INT PRIMARY KEY,
  last_no INT NOT NULL DEFAULT 0
);

-- Inside the same transaction as the insert. One writer at a time per year.
UPDATE invoice_counters
SET last_no = last_no + 1
WHERE year = 2026
RETURNING last_no;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="What is the difference between GENERATED ALWAYS and GENERATED BY DEFAULT AS IDENTITY?">
            <p>
              Both attach a sequence to the column. The difference is what happens when an INSERT supplies its own value for that column.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>GENERATED ALWAYS:</strong> an explicit value is rejected with an error. You must write <code>OVERRIDING SYSTEM VALUE</code> to force it. This is the safer default, because nothing can accidentally insert an id that the sequence will hand out again later</li>
              <li><strong>GENERATED BY DEFAULT:</strong> the sequence is used only when you omit the column or pass <code>DEFAULT</code>. An explicit value goes straight in, and the sequence is not advanced, which is how a duplicate key error appears months later</li>
              <li>Choose <code>BY DEFAULT</code> when you need to load existing rows with their original ids, for example during a data migration or in test fixtures</li>
              <li>Choose <code>ALWAYS</code> for normal application tables</li>
              <li>You can switch between them at any time with a plain <code>ALTER TABLE</code>, and it is instant</li>
              <li>Both behave the same for <code>COPY</code>: if the column is in the column list, the supplied value is used, so bulk loads into an ALWAYS column need <code>OVERRIDING SYSTEM VALUE</code> or a temporary switch</li>
            </ul>
            <CodeBlock
              title="ALWAYS versus BY DEFAULT"
              language="sql"
              code={`CREATE TABLE a (id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, body TEXT);
CREATE TABLE b (id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY, body TEXT);

-- Rejected: cannot insert into an ALWAYS identity column
-- INSERT INTO a (id, body) VALUES (100, 'forced');

-- Allowed with the escape hatch
INSERT INTO a (id, body) OVERRIDING SYSTEM VALUE VALUES (100, 'forced');

-- Accepted silently, and the sequence is NOT advanced
INSERT INTO b (id, body) VALUES (100, 'forced');
INSERT INTO b (body) VALUES ('next');  -- may collide later

-- Change the behaviour, or the sequence options, without a rewrite
ALTER TABLE a ALTER COLUMN id SET GENERATED BY DEFAULT;
ALTER TABLE a ALTER COLUMN id RESTART WITH 1000;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How do you reset a sequence with setval, and when do you need to?">
            <p>
              You need it after any load that inserted explicit ids, such as a restore or an import, because the sequence was never advanced. The symptom is
              a duplicate key error on the primary key even though the row you are inserting looks new.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><code>setval(seq, n)</code> sets the last used value, so the next id is n plus 1</li>
              <li><code>setval(seq, n, false)</code> means n has not been used yet, so the next id is n itself. Getting this third argument wrong is the classic off-by-one</li>
              <li>The safe recipe is <code>setval(seq, coalesce(max(id), 0) + 1, false)</code>, which also works on an empty table</li>
              <li>Find the sequence name with <code>pg_get_serial_sequence</code> rather than guessing, since a renamed table keeps its old sequence name</li>
              <li><code>ALTER SEQUENCE ... RESTART WITH n</code> does the same thing declaratively, and for an identity column you can use <code>ALTER TABLE ... ALTER COLUMN id RESTART</code></li>
              <li>Do this while nothing else is writing. Another session that already grabbed a cached block will still hand out the old numbers</li>
              <li>Never move a sequence backwards on a live table. You will generate ids that already exist</li>
            </ul>
            <CodeBlock
              title="Fixing a sequence after an import"
              language="sql"
              code={`-- Next id becomes max(id) + 1, and it works on an empty table too
SELECT setval(
  pg_get_serial_sequence('orders', 'id'),
  coalesce((SELECT max(id) FROM orders), 0) + 1,
  false
);

-- The declarative equivalents
ALTER SEQUENCE orders_id_seq RESTART WITH 5001;
ALTER TABLE orders ALTER COLUMN id RESTART WITH 5001;

-- Confirm
SELECT last_value, is_called FROM orders_id_seq;`}
            />
            <CodeBlock
              title="Find every out-of-step sequence"
              language="sql"
              code={`SELECT c.relname AS table_name,
       a.attname  AS column_name,
       pg_get_serial_sequence(c.relname, a.attname) AS seq
FROM pg_class c
JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum > 0
WHERE c.relkind = 'r'
  AND c.relnamespace = 'public'::regnamespace
  AND pg_get_serial_sequence(c.relname, a.attname) IS NOT NULL;`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

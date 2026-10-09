import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 2: Character Types - Module 2 - Most Asked Interview Questions',
  description:
    'Most asked interview questions on PostgreSQL text types — VARCHAR vs TEXT vs CHAR, length limits, CHAR padding, case-insensitive text with citext, and collation basics',
};

export default function MaiqM02L02CharacterTypes() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 2: Character Types</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Storing text in Postgres. The types are simple, but interviewers love the follow-ups about length limits, padding, and case-insensitive matching.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="What is the difference between VARCHAR, TEXT, and CHAR?">
            <p>
              All three store text. In PostgreSQL, <code>TEXT</code> and <code>VARCHAR</code> are stored the same way. Pick the one that matches the rule you want.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>TEXT:</strong> any length. This is the usual choice in Postgres</li>
              <li><strong>VARCHAR(n):</strong> text with a maximum length, such as 50. Same speed as TEXT</li>
              <li><strong>CHAR(n):</strong> always n characters, padded with spaces. Almost never useful. Prefer VARCHAR</li>
              <li>In some other databases VARCHAR is faster than TEXT. In Postgres they perform the same</li>
            </ul>
            <CodeBlock
              title="String types"
              language="sql"
              code={`CREATE TABLE profiles (
  username VARCHAR(50) NOT NULL,  -- enforce max length
  bio      TEXT,                  -- unlimited notes
  code     CHAR(3)                -- e.g. ISO country — still usually VARCHAR is clearer
);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="Should you set a length limit on text columns?">
            <p>
              Set a limit only when the limit is a real business rule. There is no performance reason to add one in Postgres.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Good limits: a 2-character country code, a 10-digit phone number, a 64-character SKU. These are real rules</li>
              <li>Bad limits: a guessed <code>VARCHAR(255)</code> on a name or an address. Real data breaks it and then you need a migration</li>
              <li>Growing a limit (<code>VARCHAR(50)</code> to <code>VARCHAR(100)</code>, or to <code>TEXT</code>) is cheap in modern Postgres and does not rewrite the table. Shrinking it does rewrite and validate</li>
              <li>A <code>CHECK</code> constraint is often clearer than a type length, because you can validate more than length at the same time</li>
              <li>Also remember the limit counts characters, not bytes, so a 10-character limit still holds 10 emoji</li>
            </ul>
            <CodeBlock
              title="Limit as a rule, not a guess"
              language="sql"
              code={`CREATE TABLE addresses (
  id       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  line1    TEXT NOT NULL CHECK (length(trim(line1)) BETWEEN 3 AND 200),
  country  CHAR(2) NOT NULL CHECK (country ~ '^[A-Z]{2}$'),
  pincode  VARCHAR(10) NOT NULL
);

-- Widening is a catalog-only change, no table rewrite
ALTER TABLE addresses ALTER COLUMN pincode TYPE VARCHAR(20);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="What is the trailing space behaviour of CHAR(n)?">
            <p>
              <code>CHAR(n)</code> pads short values with spaces up to n characters, and it ignores trailing spaces when comparing.
              That mix of padding and ignoring is exactly why it causes bugs.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Storing <code>&apos;IN&apos;</code> in a <code>CHAR(5)</code> gives you back <code>&apos;IN   &apos;</code>, with three spaces</li>
              <li>Comparisons between CHAR values ignore those trailing spaces, so <code>&apos;IN&apos;</code> equals <code>&apos;IN   &apos;</code></li>
              <li>But <code>length()</code> and string concatenation see the spaces, so your UI and your logs show odd gaps</li>
              <li>Cast the CHAR to TEXT and the padding becomes real, which changes comparison results. This is the classic gotcha</li>
              <li>Recommendation, and the answer interviewers expect: use <code>TEXT</code> or <code>VARCHAR</code> and never <code>CHAR</code></li>
            </ul>
            <CodeBlock
              title="Padding surprises"
              language="sql"
              code={`SELECT length('IN'::char(5));            -- 2, trailing spaces are ignored here
SELECT length('IN'::char(5)::text);      -- 5, now the padding is real
SELECT 'IN'::char(5) = 'IN';             -- true
SELECT 'IN'::char(5)::text = 'IN';       -- false
SELECT ('[' || 'IN'::char(5) || ']');    -- [IN   ]`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="What is the difference between LIKE and ILIKE?">
            <p>
              <code>LIKE</code> is case-sensitive in PostgreSQL. <code>ILIKE</code> is case-insensitive. Both support <code>%</code> (any string) and <code>_</code> (one character).
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>A leading wildcard such as <code>LIKE &apos;%sql&apos;</code> cannot use a normal B-tree. Use <code>pg_trgm</code> for contains-search</li>
              <li>A trailing wildcard <code>LIKE &apos;sql%&apos;</code> can use a B-tree, or <code>text_pattern_ops</code> if the collation is not C</li>
              <li>Escape a literal percent with <code>ESCAPE</code> if user input might contain <code>%</code></li>
              <li>In Prisma, <code>contains</code> / <code>startsWith</code> / <code>mode: &apos;insensitive&apos;</code> map to these patterns</li>
            </ul>
            <CodeBlock
              title="LIKE vs ILIKE"
              language="sql"
              code={`SELECT * FROM users WHERE email LIKE  'Ada%';   -- misses ada@...
SELECT * FROM users WHERE email ILIKE 'Ada%';   -- matches

SELECT * FROM posts WHERE title ILIKE '%postgres%';`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How do you store and compare text case-insensitively, for example emails?">
            <p>
              Postgres comparisons are case-sensitive by default. There are two standard answers: normalise the value with an expression index, or use the
              <code> citext</code> type. Interviewers usually want you to mention both and prefer the index.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Preferred:</strong> a unique index on <code>lower(email)</code>. You keep the original text and still block duplicates that differ only by case</li>
              <li>Your query must use the same expression, <code>WHERE lower(email) = lower($1)</code>, or the index is not used</li>
              <li>A <code>GENERATED ALWAYS AS (lower(email)) STORED</code> column is a nice variant, because ORMs like Prisma can filter on a plain column</li>
              <li><strong>citext:</strong> an extension type that compares case-insensitively everywhere. Convenient, but it is not in every managed offering, it hides what is happening, and it can behave oddly with some collations</li>
              <li>Postgres 12+ also supports a non-deterministic ICU collation for true case-insensitive comparison, but such columns cannot use pattern matching like LIKE</li>
              <li>Whatever you choose, also trim the input in the app. Case is not the only way users create duplicates</li>
            </ul>
            <CodeBlock
              title="Expression index approach"
              language="sql"
              code={`CREATE TABLE users (
  id    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email TEXT NOT NULL
);

CREATE UNIQUE INDEX users_email_lower_uidx ON users (lower(email));

-- Uses the index
SELECT * FROM users WHERE lower(email) = lower('Riya@Example.com');`}
            />
            <CodeBlock
              title="citext approach"
              language="sql"
              code={`CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE members (
  id    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email CITEXT UNIQUE NOT NULL
);

SELECT * FROM members WHERE email = 'RIYA@EXAMPLE.COM'; -- matches riya@example.com`}
            />
            <CodeBlock
              title="Generated column so Prisma can filter normally"
              language="typescript"
              code={`model User {
  id         BigInt @id @default(autoincrement())
  email      String
  emailLower String @map("email_lower")

  @@unique([emailLower])
}

// SQL side: email_lower TEXT GENERATED ALWAYS AS (lower(email)) STORED`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="What is collation, and why does it matter in production?">
            <p>
              A collation is the rule set for sorting and comparing text. It decides whether <code>&apos;a&apos;</code> sorts before <code>&apos;B&apos;</code>,
              how accents are treated, and how ties are broken. It is set per database, and can be overridden per column or per query.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>C (or POSIX):</strong> byte order. Fast and completely stable, but <code>Z</code> sorts before <code>a</code></li>
              <li><strong>Locale collations such as en_US.UTF-8:</strong> human-friendly ordering, roughly case-insensitive sorting, but slower and dependent on the operating system libraries</li>
              <li><strong>The big production risk:</strong> if the C library (glibc) changes its collation rules during an OS upgrade, existing text indexes are silently wrong. Queries start missing rows until you <code>REINDEX</code></li>
              <li>ICU collations, available from Postgres 10 and much easier to use as the database default from 15, are versioned, so Postgres can warn you when the version changes</li>
              <li>A pattern index for <code>LIKE &apos;abc%&apos;</code> on a non-C collation needs <code>text_pattern_ops</code>, otherwise the index is skipped</li>
              <li>Collation is also why &quot;unique email&quot; is harder than it looks: two different Unicode spellings of the same name are different strings, so normalise input in the app</li>
            </ul>
            <CodeBlock
              title="Inspect and override collation"
              language="sql"
              code={`SHOW lc_collate;
SELECT datname, datcollate, datctype FROM pg_database;

-- Per column
CREATE TABLE docs (
  title TEXT COLLATE "en-US-x-icu"
);

-- Per query
SELECT title FROM docs ORDER BY title COLLATE "C";

-- Pattern index for LIKE prefix search
CREATE INDEX docs_title_pattern_idx ON docs (title text_pattern_ops);`}
            />
            <CodeBlock
              title="After an OS or glibc upgrade"
              language="bash"
              code={`# Rebuild text indexes so they match the new collation rules
reindexdb --all --concurrently

# Postgres 15+ will also report a mismatch:
# WARNING: database "app" has a collation version mismatch`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 1: String Functions - Module 7 - Most Asked Interview Questions',
  description:
    'Most asked PostgreSQL string function interview questions: CONCAT, the double pipe operator, TRIM, UPPER, LOWER, LENGTH, REPLACE, SPLIT_PART, POSITION, SUBSTRING, LIKE vs ILIKE.',
};

export default function M7L1StringFunctions() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 1: String Functions</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Text work shows up in almost every interview. This lesson covers the string helpers you are actually
          asked about: joining text, cleaning spaces, changing case, measuring length, cutting pieces out, and
          searching with patterns.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="How do you concatenate and trim strings in PostgreSQL?">
            <p>
              Concatenate means join text together. Join text with <code>CONCAT</code> or the double pipe
              operator <code>||</code>. <code>TRIM</code> removes extra spaces from the edges.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <code>CONCAT</code> skips NULL. A missing value is treated as an empty string.
              </li>
              <li>
                <code>||</code> turns the whole result into NULL if any piece is NULL.
              </li>
              <li>
                <code>TRIM</code> can also strip a specific character, not just spaces.
              </li>
            </ul>
            <CodeBlock
              title="String basics"
              language="sql"
              code={`SELECT
  CONCAT(first_name, ' ', last_name) AS full_name,
  TRIM(BOTH ' ' FROM '  hello  ') AS trimmed,
  first_name || ' ' || last_name AS via_pipe
FROM users;`}
            />
            <CodeBlock
              title="LTRIM, RTRIM, and trimming a specific character"
              language="sql"
              code={`SELECT
  LTRIM('   spaced')        AS left_trimmed,
  RTRIM('spaced   ')        AS right_trimmed,
  TRIM(BOTH '0' FROM '007') AS strip_zeros;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="How do UPPER and LOWER work, and where are they used in real queries?">
            <p>
              <code>UPPER</code> makes text all capitals. <code>LOWER</code> makes it all small letters. They do
              not change the stored data. They only change the value returned by the query.
            </p>
            <p>
              The common real use is case-insensitive matching. Case-insensitive means &quot;A&quot; and
              &quot;a&quot; count as the same letter. You force both sides to the same case, then compare.
            </p>
            <CodeBlock
              title="UPPER and LOWER"
              language="sql"
              code={`SELECT
  UPPER(country_code) AS code_upper,
  LOWER(email)        AS email_lower
FROM users;

-- Case-insensitive lookup
SELECT * FROM users
WHERE LOWER(email) = LOWER('Ada@Example.com');`}
            />
            <p>
              There is also <code>INITCAP</code>, which capitalises the first letter of each word. It is handy for
              display names.
            </p>
            <CodeBlock
              title="INITCAP"
              language="sql"
              code={`SELECT INITCAP('ada lovelace') AS pretty_name;
-- Ada Lovelace`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="How do you get the length of a string, and what is the catch with CHAR columns?">
            <p>
              <code>LENGTH</code> returns the number of characters. <code>OCTET_LENGTH</code> returns the number
              of bytes, which is bigger for accented or non-English characters because those need more bytes.
            </p>
            <p>
              The catch interviewers like: a <code>char(n)</code> column pads values with spaces to the full
              width, and <code>LENGTH</code> ignores that trailing padding. That is one more reason to use
              <code>text</code> or <code>varchar</code> instead of <code>char</code>.
            </p>
            <CodeBlock
              title="LENGTH vs OCTET_LENGTH"
              language="sql"
              code={`SELECT
  LENGTH('cafe')        AS chars,        -- 4
  LENGTH('café')        AS chars_accent, -- 4
  OCTET_LENGTH('café')  AS bytes;        -- 5

-- Find rows that look empty but hold only spaces
SELECT id FROM users WHERE LENGTH(TRIM(nickname)) = 0;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="What is the difference between LIKE and ILIKE?">
            <p>
              <code>LIKE</code> is case-sensitive pattern matching. <code>ILIKE</code> is case-insensitive and is
              specific to PostgreSQL. A pattern is a small template for text.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <code>%</code> matches any sequence of characters, including none.
              </li>
              <li>
                <code>_</code> matches exactly one character.
              </li>
              <li>
                Use <code>NOT LIKE</code> to exclude matches.
              </li>
            </ul>
            <CodeBlock
              title="LIKE / ILIKE"
              language="sql"
              code={`SELECT * FROM products WHERE name LIKE 'Pro%';
SELECT * FROM products WHERE name ILIKE '%iphone%';

-- One unknown character
SELECT * FROM products WHERE sku LIKE 'AB_123';`}
            />
            <CodeBlock
              title="Prisma"
              language="typescript"
              code={`await prisma.product.findMany({
  where: { name: { contains: 'iphone', mode: 'insensitive' } },
});`}
            />
            <p>
              Performance note for later: a pattern that starts with <code>%</code> cannot use a normal index.
              Lesson 6 covers how to fix that with a trigram index.
            </p>
          </InterviewQACard>

          <InterviewQACard level="Junior" question="Explain SUBSTRING and how to take part of a string.">
            <p>
              <code>SUBSTRING</code> (also written <code>SUBSTR</code>) pulls a piece out of a string. You give it
              a start position and how many characters to take. Positions start at 1, not 0.
            </p>
            <p>
              <code>LEFT</code> and <code>RIGHT</code> are shortcuts for the first or last N characters.
            </p>
            <CodeBlock
              title="SUBSTRING, LEFT, RIGHT"
              language="sql"
              code={`SELECT
  SUBSTRING(email FROM 1 FOR 3) AS email_prefix,
  SUBSTRING(email, 1, 3)        AS same_thing,
  LEFT(phone, 3)                AS area_code,
  RIGHT(card_number, 4)         AS last_four
FROM users;`}
            />
            <p>
              <code>SUBSTRING</code> also accepts a regular expression. A regular expression is a pattern language
              for text. This version returns the first matching part.
            </p>
            <CodeBlock
              title="SUBSTRING with a pattern"
              language="sql"
              code={`SELECT SUBSTRING('order-2026-0042' FROM '[0-9]{4}') AS year_part;
-- 2026`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="How do you replace text inside a string?">
            <p>
              <code>REPLACE(source, find, put_instead)</code> swaps every occurrence of one piece of text for
              another. It is plain text matching, not a pattern.
            </p>
            <p>
              When you need a pattern, use <code>REGEXP_REPLACE</code>. Add the flag <code>g</code> to replace
              every match instead of only the first one.
            </p>
            <CodeBlock
              title="REPLACE and REGEXP_REPLACE"
              language="sql"
              code={`SELECT REPLACE('555-123-4567', '-', '') AS digits_only;

-- Remove every character that is not a digit
SELECT REGEXP_REPLACE('(555) 123-4567', '[^0-9]', '', 'g') AS cleaned;

-- Collapse repeated spaces into one
SELECT REGEXP_REPLACE('too    many   spaces', ' +', ' ', 'g') AS tidy;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="What does SPLIT_PART do, and when do you reach for it?">
            <p>
              <code>SPLIT_PART(text, delimiter, n)</code> cuts a string on a separator and returns the nth piece.
              A delimiter is the character that separates the pieces. Counting starts at 1.
            </p>
            <p>
              It is the quickest way to grab a domain from an email, a segment from a path, or one column from a
              delimited import file. If the piece does not exist you get an empty string, not NULL.
            </p>
            <CodeBlock
              title="SPLIT_PART"
              language="sql"
              code={`SELECT
  SPLIT_PART(email, '@', 1) AS local_part,
  SPLIT_PART(email, '@', 2) AS domain
FROM users;

-- Count signups per email domain
SELECT SPLIT_PART(email, '@', 2) AS domain, COUNT(*) AS users
FROM users
GROUP BY 1
ORDER BY users DESC;`}
            />
            <p>
              If you need every piece as separate rows instead of one piece, use
              <code>STRING_TO_ARRAY</code> together with <code>unnest</code>, or
              <code>REGEXP_SPLIT_TO_TABLE</code>.
            </p>
            <CodeBlock
              title="Every piece as rows"
              language="sql"
              code={`SELECT unnest(STRING_TO_ARRAY('a,b,c', ',')) AS part;
SELECT REGEXP_SPLIT_TO_TABLE('a,b,c', ',') AS part;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How do you find where one string appears inside another?">
            <p>
              <code>POSITION(needle IN haystack)</code> returns the 1-based index of the first match, or
              <code>0</code> when there is no match. <code>STRPOS(haystack, needle)</code> does the same with the
              arguments swapped.
            </p>
            <p>
              Because a miss returns <code>0</code> and not NULL, you test with
              <code>POSITION(...) &gt; 0</code>. Pairing it with <code>SUBSTRING</code> lets you extract text up
              to a marker.
            </p>
            <CodeBlock
              title="POSITION and STRPOS"
              language="sql"
              code={`SELECT
  POSITION('@' IN email)   AS at_index,
  STRPOS(email, '@')       AS same_index
FROM users;

-- Everything before the @ sign, without SPLIT_PART
SELECT SUBSTRING(email FROM 1 FOR POSITION('@' IN email) - 1) AS local_part
FROM users
WHERE POSITION('@' IN email) > 0;`}
            />
            <p>
              For a simple yes-or-no check, <code>ILIKE</code> or <code>STRPOS(...) &gt; 0</code> both read fine.
              Prefer <code>ILIKE</code> when you may later add an index for it.
            </p>
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Why does CONCAT handle NULL differently from the double pipe operator?">
            <p>
              This is a favourite trick question. The two look interchangeable but behave differently when a value
              is missing.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <code>||</code> is the standard SQL concatenation operator. In standard SQL, any operator applied
                to NULL returns NULL. So one NULL poisons the whole expression.
              </li>
              <li>
                <code>CONCAT</code> is a function that was defined to be forgiving. It treats NULL as an empty
                string, so you still get the other pieces.
              </li>
              <li>
                <code>CONCAT_WS(separator, ...)</code> goes further: it skips NULL arguments entirely, so you do
                not end up with a dangling separator.
              </li>
            </ul>
            <CodeBlock
              title="The NULL difference"
              language="sql"
              code={`SELECT
  'Ada' || NULL || 'Lovelace'          AS pipe_result,   -- NULL
  CONCAT('Ada', NULL, 'Lovelace')      AS concat_result, -- AdaLovelace
  CONCAT_WS(' ', 'Ada', NULL, 'King')  AS ws_result;     -- Ada King`}
            />
            <p>
              If you want <code>||</code> but with safe behaviour, wrap each nullable piece in
              <code>COALESCE</code>. <code>COALESCE</code> returns the first value that is not NULL.
            </p>
            <CodeBlock
              title="Making the pipe operator safe"
              language="sql"
              code={`SELECT COALESCE(first_name, '') || ' ' || COALESCE(last_name, '') AS full_name
FROM users;

-- Usually nicer:
SELECT CONCAT_WS(' ', first_name, last_name) AS full_name
FROM users;`}
            />
            <p>
              The same trap exists in application code. In Prisma you build the string in JavaScript, so a missing
              field becomes the text &quot;null&quot; or &quot;undefined&quot; unless you guard it.
            </p>
            <CodeBlock
              title="Prisma equivalent"
              language="typescript"
              code={`const users = await prisma.user.findMany({
  select: { firstName: true, lastName: true },
});

const names = users.map((u) =>
  [u.firstName, u.lastName].filter(Boolean).join(' '),
);

// Or let the database do it
const rows = await prisma.$queryRawUnsafe(
  "SELECT CONCAT_WS(' ', first_name, last_name) AS full_name FROM users",
);`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

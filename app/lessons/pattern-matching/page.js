import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Pattern matching - PostgreSQL Learning',
  description: 'Learn about pattern matching in PostgreSQL including LIKE, ILIKE, SIMILAR TO, and regular expressions',
};

export default function PatternMatching() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Pattern matching</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">LIKE and ILIKE</h2>

          <CodeBlock
            title="SQL: LIKE and ILIKE"
            language="sql"
            code={`-- LIKE (case-sensitive pattern matching)
SELECT * FROM users WHERE username LIKE 'john%';  -- Starts with 'john'
SELECT * FROM users WHERE email LIKE '%@example.com';  -- Ends with '@example.com'
SELECT * FROM users WHERE username LIKE 'j_n%';  -- 'j' + any char + 'n' + anything

-- Wildcards:
-- % matches any sequence of characters
-- _ matches any single character

-- ILIKE (case-insensitive pattern matching)
SELECT * FROM users WHERE username ILIKE 'john%';
SELECT * FROM users WHERE email ILIKE '%EXAMPLE.COM';

-- NOT LIKE / NOT ILIKE
SELECT * FROM users WHERE username NOT LIKE 'admin%';
SELECT * FROM users WHERE email NOT ILIKE '%test%';

-- ESCAPE character for literal % or _
SELECT * FROM products WHERE name LIKE '50%% off' ESCAPE '\\';`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">SIMILAR TO</h2>

          <CodeBlock
            title="SQL: SIMILAR TO"
            language="sql"
            code={`-- SIMILAR TO (SQL standard pattern matching)
SELECT * FROM users WHERE username SIMILAR TO 'john%';

-- Character classes
SELECT * FROM users WHERE username SIMILAR TO '[a-z]+';  -- Lowercase letters
SELECT * FROM users WHERE phone SIMILAR TO '[0-9]{3}-[0-9]{3}-[0-9]{4}';  -- Phone format

-- Quantifiers
SELECT * FROM users WHERE username SIMILAR TO 'j{1,3}ohn';  -- 1-3 'j's
SELECT * FROM products WHERE sku SIMILAR TO '[A-Z]{2,3}-[0-9]+';

-- Alternation
SELECT * FROM users WHERE status SIMILAR TO '(active|inactive|pending)';

-- NOT SIMILAR TO
SELECT * FROM users WHERE username NOT SIMILAR TO 'admin%';`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Regular Expressions</h2>

          <CodeBlock
            title="SQL: Regular Expressions"
            language="sql"
            code={`-- ~ (case-sensitive match)
SELECT * FROM users WHERE email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$';

-- ~* (case-insensitive match)
SELECT * FROM users WHERE email ~* 'example';

-- !~ (case-sensitive no match)
SELECT * FROM users WHERE email !~ '^[0-9]';

-- !~* (case-insensitive no match)
SELECT * FROM users WHERE email !~* 'test';

-- REGEXP_REPLACE
SELECT 
  email,
  REGEXP_REPLACE(email, '@.*', '@example.com') AS normalized_email
FROM users;

-- REGEXP_SPLIT_TO_ARRAY
SELECT 
  tags,
  REGEXP_SPLIT_TO_ARRAY(tags, ',') AS tag_array
FROM products;

-- REGEXP_MATCHES
SELECT 
  email,
  (REGEXP_MATCHES(email, '@(.+)$'))[1] AS domain
FROM users;`}
          />
        </section>
      </div>
    </LessonLayout>
  );
}


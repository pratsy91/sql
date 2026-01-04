import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'String Functions - PostgreSQL Learning',
  description: 'Learn about PostgreSQL string functions including concat, length, upper, lower, trim, substring, replace, and more',
};

export default function StringFunctions() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">String Functions</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Concatenation Functions</h2>

          <CodeBlock
            title="SQL: Concatenation"
            language="sql"
            code={`-- CONCAT (concatenate strings, handles NULL)
SELECT CONCAT('Hello', ' ', 'World') AS greeting;
SELECT CONCAT(first_name, ' ', last_name) AS full_name FROM users;
SELECT CONCAT('User: ', username, NULL, ' - ', email) FROM users;  -- NULL ignored

-- CONCAT_WS (concatenate with separator)
SELECT CONCAT_WS(', ', 'Apple', 'Banana', 'Cherry') AS fruits;
SELECT CONCAT_WS(' ', first_name, middle_name, last_name) AS full_name FROM users;

-- || operator (concatenation)
SELECT 'Hello' || ' ' || 'World' AS greeting;
SELECT first_name || ' ' || last_name AS full_name FROM users;
SELECT 'User ID: ' || id::text AS user_info FROM users;`}
          />
          <CodeBlock
            title="Prisma: Concatenation"
            language="prisma"
            code={`// Prisma doesn't have built-in concatenation
// Use raw SQL or handle in application

const users = await prisma.$queryRaw\`
  SELECT 
    id,
    CONCAT(first_name, ' ', last_name) AS full_name
  FROM users
\`;

// Or process in application
const users = await prisma.user.findMany();
const processed = users.map(u => ({
  ...u,
  fullName: \`\${u.firstName} \${u.lastName}\`,
}));`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Length Functions</h2>

          <CodeBlock
            title="SQL: Length Functions"
            language="sql"
            code={`-- LENGTH (character length)
SELECT LENGTH('Hello') AS len;  -- 5
SELECT LENGTH(username) AS username_length FROM users;

-- CHAR_LENGTH (same as LENGTH)
SELECT CHAR_LENGTH('Hello') AS len;

-- OCTET_LENGTH (byte length)
SELECT OCTET_LENGTH('Hello') AS bytes;  -- 5 for ASCII
SELECT OCTET_LENGTH('你好') AS bytes;  -- 6 for UTF-8 (3 bytes per char)

-- BIT_LENGTH (bit length)
SELECT BIT_LENGTH('Hello') AS bits;  -- 40 (5 bytes * 8)`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Case Conversion</h2>

          <CodeBlock
            title="SQL: Case Conversion"
            language="sql"
            code={`-- UPPER (convert to uppercase)
SELECT UPPER('hello world') AS upper;  -- 'HELLO WORLD'
SELECT UPPER(username) AS username_upper FROM users;

-- LOWER (convert to lowercase)
SELECT LOWER('HELLO WORLD') AS lower;  -- 'hello world'
SELECT LOWER(email) AS email_lower FROM users;

-- INITCAP (capitalize first letter of each word)
SELECT INITCAP('hello world') AS initcap;  -- 'Hello World'
SELECT INITCAP(username) AS username_initcap FROM users;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Trimming Functions</h2>

          <CodeBlock
            title="SQL: Trimming"
            language="sql"
            code={`-- TRIM (remove leading and trailing spaces)
SELECT TRIM('  hello  ') AS trimmed;  -- 'hello'
SELECT TRIM(LEADING 'x' FROM 'xxxhelloxxx') AS trim_leading;
SELECT TRIM(TRAILING 'x' FROM 'xxxhelloxxx') AS trim_trailing;
SELECT TRIM(BOTH 'x' FROM 'xxxhelloxxx') AS trim_both;

-- LTRIM (remove leading spaces/chars)
SELECT LTRIM('  hello  ') AS ltrimmed;
SELECT LTRIM('xxxhello', 'x') AS ltrim_chars;

-- RTRIM (remove trailing spaces/chars)
SELECT RTRIM('  hello  ') AS rtrimmed;
SELECT RTRIM('helloxxx', 'x') AS rtrim_chars;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Substring Functions</h2>

          <CodeBlock
            title="SQL: Substring"
            language="sql"
            code={`-- SUBSTRING
SELECT SUBSTRING('PostgreSQL' FROM 1 FOR 5) AS sub;  -- 'Postg'
SELECT SUBSTRING('PostgreSQL' FROM 6) AS sub;  -- 'reSQL'
SELECT SUBSTRING(username FROM 1 FOR 10) FROM users;

-- LEFT (first N characters)
SELECT LEFT('PostgreSQL', 5) AS left_part;  -- 'Postg'

-- RIGHT (last N characters)
SELECT RIGHT('PostgreSQL', 5) AS right_part;  -- 'reSQL'

-- SPLIT_PART (split string by delimiter)
SELECT SPLIT_PART('apple,banana,cherry', ',', 2) AS second;  -- 'banana'
SELECT SPLIT_PART(email, '@', 1) AS username_part FROM users;
SELECT SPLIT_PART(email, '@', 2) AS domain_part FROM users;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Replace and Translate</h2>

          <CodeBlock
            title="SQL: Replace and Translate"
            language="sql"
            code={`-- REPLACE (replace all occurrences)
SELECT REPLACE('Hello World', 'World', 'PostgreSQL') AS replaced;
SELECT REPLACE(email, '@olddomain.com', '@newdomain.com') FROM users;

-- TRANSLATE (character-by-character translation)
SELECT TRANSLATE('Hello', 'elo', 'ELO') AS translated;  -- 'HELLO'
SELECT TRANSLATE(phone, '()-', '') AS phone_clean FROM users;  -- Remove chars`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Position Functions</h2>

          <CodeBlock
            title="SQL: Position"
            language="sql"
            code={`-- POSITION (find substring position)
SELECT POSITION('SQL' IN 'PostgreSQL') AS pos;  -- 8
SELECT POSITION('@' IN email) AS at_position FROM users;

-- STRPOS (same as POSITION)
SELECT STRPOS('PostgreSQL', 'SQL') AS pos;  -- 8

-- Use in queries
SELECT * FROM users WHERE POSITION('@example.com' IN email) > 0;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">REVERSE</h2>

          <CodeBlock
            title="SQL: REVERSE"
            language="sql"
            code={`-- REVERSE (reverse string)
SELECT REVERSE('PostgreSQL') AS reversed;  -- 'LQSergtsoP'
SELECT REVERSE(username) AS reversed_username FROM users;`}
          />
        </section>
      </div>
    </LessonLayout>
  );
}


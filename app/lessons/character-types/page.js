import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Character Types - PostgreSQL Learning',
  description: 'Learn about PostgreSQL character data types including char, varchar, text, encoding, and string functions',
};

export default function CharacterTypes() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Character Types</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Character Type Overview</h2>
          <p className="mb-4">
            PostgreSQL provides three character types for storing text data.
          </p>
          
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Type</th>
                  <th className="text-left p-2">Description</th>
                  <th className="text-left p-2">Storage</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-2"><code>CHAR(n)</code> or <code>CHARACTER(n)</code></td>
                  <td className="p-2">Fixed-length, blank-padded</td>
                  <td className="p-2">n bytes (up to 10MB)</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2"><code>VARCHAR(n)</code> or <code>CHARACTER VARYING(n)</code></td>
                  <td className="p-2">Variable-length with limit</td>
                  <td className="p-2">Actual length + 1-4 bytes</td>
                </tr>
                <tr>
                  <td className="p-2"><code>TEXT</code></td>
                  <td className="p-2">Variable-length, unlimited</td>
                  <td className="p-2">Actual length + 1-4 bytes</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">CHAR(n) - Fixed Length</h2>
          <p className="mb-4">
            CHAR(n) stores exactly n characters, padding with spaces if necessary. Trailing spaces are removed when comparing.
          </p>

          <CodeBlock
            title="SQL: CHAR Type"
            language="sql"
            code={`-- Create table with CHAR
CREATE TABLE codes (
  id SERIAL PRIMARY KEY,
  country_code CHAR(2),        -- Always 2 characters
  status_code CHAR(3),         -- Always 3 characters
  category CHAR(10)            -- Always 10 characters (padded)
);

-- Insert values
INSERT INTO codes (country_code, status_code, category)
VALUES 
  ('US', 'ACT', 'PRODUCT'),
  ('UK', 'INA', 'SERVICE'),
  ('CA', 'PEN', 'SUPPORT');

-- CHAR values are padded with spaces
SELECT 
  country_code,
  LENGTH(country_code) AS length,
  status_code,
  LENGTH(status_code) AS status_length,
  category,
  LENGTH(category) AS cat_length
FROM codes;

-- Trailing spaces are ignored in comparisons
SELECT * FROM codes WHERE country_code = 'US';  -- Matches 'US  ' (with spaces)
SELECT * FROM codes WHERE country_code = 'US  ';  -- Also matches

-- Use CHAR_LENGTH or LENGTH to see actual content
SELECT 
  country_code,
  CHAR_LENGTH(TRIM(country_code)) AS trimmed_length
FROM codes;`}
          />
          <CodeBlock
            title="Prisma: CHAR Type"
            language="prisma"
            code={`// schema.prisma
model Code {
  id          Int     @id @default(autoincrement())
  countryCode String  @map("country_code") @db.Char(2)
  statusCode  String  @map("status_code") @db.Char(3)
  category    String  @db.Char(10)
  
  @@map("codes")
}

// Usage
const code = await prisma.code.create({
  data: {
    countryCode: 'US',
    statusCode: 'ACT',
    category: 'PRODUCT',
  },
});

// Prisma handles padding automatically
const codes = await prisma.code.findMany({
  where: {
    countryCode: 'US',  // Works even if stored with trailing spaces
  },
});`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">VARCHAR(n) - Variable Length with Limit</h2>
          <p className="mb-4">
            VARCHAR(n) stores variable-length strings up to n characters. No padding is applied.
          </p>

          <CodeBlock
            title="SQL: VARCHAR Type"
            language="sql"
            code={`-- Create table with VARCHAR
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50),         -- Max 50 characters
  email VARCHAR(255),           -- Max 255 characters
  bio VARCHAR(500)              -- Max 500 characters
);

-- Insert values
INSERT INTO users (username, email, bio)
VALUES 
  ('alice', 'alice@example.com', 'Software developer'),
  ('bob', 'bob@example.com', 'A' || REPEAT(' very long bio ', 20)),
  ('charlie', 'charlie@example.com', NULL);

-- VARCHAR stores exact length (no padding)
SELECT 
  username,
  LENGTH(username) AS username_length,
  email,
  LENGTH(email) AS email_length,
  bio,
  LENGTH(bio) AS bio_length
FROM users;

-- VARCHAR without length limit (same as TEXT)
CREATE TABLE notes (
  id SERIAL PRIMARY KEY,
  content VARCHAR  -- No limit, same as TEXT
);`}
          />
          <CodeBlock
            title="Prisma: VARCHAR Type"
            language="prisma"
            code={`// schema.prisma
model User {
  id       Int     @id @default(autoincrement())
  username String  @db.VarChar(50)
  email    String  @db.VarChar(255)
  bio      String? @db.VarChar(500)
  
  @@map("users")
}

// Usage
const user = await prisma.user.create({
  data: {
    username: 'alice',
    email: 'alice@example.com',
    bio: 'Software developer',
  },
});

// Prisma validates length constraints
// This would fail if username exceeds 50 characters
try {
  await prisma.user.create({
    data: {
      username: 'a'.repeat(51),  // Too long!
      email: 'test@example.com',
    },
  });
} catch (error) {
  console.error('String too long:', error);
}`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">TEXT - Unlimited Length</h2>
          <p className="mb-4">
            TEXT stores variable-length strings with no length limit. This is the recommended type for most text storage.
          </p>

          <CodeBlock
            title="SQL: TEXT Type"
            language="sql"
            code={`-- Create table with TEXT
CREATE TABLE articles (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200),
  content TEXT,              -- Unlimited length
  summary TEXT,
  metadata TEXT
);

-- Insert values of any length
INSERT INTO articles (title, content, summary)
VALUES 
  ('Short Article', 'This is a short article.', 'Brief summary'),
  ('Long Article', REPEAT('This is a very long article content. ', 1000), 'Long summary'),
  ('Article with NULL', NULL, NULL);

-- TEXT can store very large content
SELECT 
  id,
  title,
  LENGTH(content) AS content_length,
  LEFT(content, 50) || '...' AS content_preview
FROM articles;

-- TEXT is efficient and recommended for most use cases
-- Performance is similar to VARCHAR`}
          />
          <CodeBlock
            title="Prisma: TEXT Type"
            language="prisma"
            code={`// schema.prisma
model Article {
  id       Int     @id @default(autoincrement())
  title    String  @db.VarChar(200)
  content  String  @db.Text
  summary  String? @db.Text
  metadata String? @db.Text
  
  @@map("articles")
}

// Usage
const article = await prisma.article.create({
  data: {
    title: 'My Article',
    content: 'Very long content...'.repeat(1000),
    summary: 'Summary text',
  },
});

// TEXT is the default for String in Prisma
model SimpleArticle {
  id      Int    @id @default(autoincrement())
  content String  // Defaults to TEXT in PostgreSQL
}`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Character Encoding (UTF-8)</h2>
          <p className="mb-4">
            PostgreSQL uses UTF-8 encoding by default, which supports all Unicode characters.
          </p>

          <CodeBlock
            title="SQL: Character Encoding"
            language="sql"
            code={`-- Check database encoding
SHOW server_encoding;
SELECT current_setting('server_encoding');

-- Check client encoding
SHOW client_encoding;
SELECT current_setting('client_encoding');

-- Set client encoding
SET client_encoding TO 'UTF8';

-- UTF-8 supports all Unicode characters
CREATE TABLE multilingual (
  id SERIAL PRIMARY KEY,
  english TEXT,
  chinese TEXT,
  arabic TEXT,
  emoji TEXT
);

INSERT INTO multilingual (english, chinese, arabic, emoji)
VALUES 
  ('Hello', '你好', 'مرحبا', '👋 🌍'),
  ('World', '世界', 'العالم', '🎉 🚀');

-- String length functions handle UTF-8 correctly
SELECT 
  english,
  LENGTH(english) AS length,
  chinese,
  LENGTH(chinese) AS chinese_length,
  emoji,
  LENGTH(emoji) AS emoji_length,
  CHAR_LENGTH(emoji) AS emoji_char_length
FROM multilingual;

-- Convert between encodings (if needed)
-- Note: This requires appropriate encoding support`}
          />
          <CodeBlock
            title="Prisma: Character Encoding"
            language="javascript"
            code={`// Prisma automatically handles UTF-8 encoding
// Ensure your connection string and database use UTF-8

// schema.prisma
model Multilingual {
  id      Int    @id @default(autoincrement())
  english String @db.Text
  chinese String @db.Text
  arabic  String @db.Text
  emoji   String @db.Text
  
  @@map("multilingual")
}

// Usage - Prisma handles UTF-8 automatically
const data = await prisma.multilingual.create({
  data: {
    english: 'Hello',
    chinese: '你好',
    arabic: 'مرحبا',
    emoji: '👋 🌍',
  },
});

// Query with UTF-8 strings
const results = await prisma.multilingual.findMany({
  where: {
    chinese: {
      contains: '你',
    },
  },
});

// Ensure your database connection uses UTF-8
// DATABASE_URL="postgresql://user:pass@localhost/db?client_encoding=UTF8"`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">String Functions</h2>
          <p className="mb-4">
            PostgreSQL provides extensive string manipulation functions.
          </p>

          <CodeBlock
            title="SQL: String Functions"
            language="sql"
            code={`-- Concatenation
SELECT 'Hello' || ' ' || 'World' AS concatenated;
SELECT CONCAT('Hello', ' ', 'World') AS concat_function;
SELECT CONCAT_WS(', ', 'Apple', 'Banana', 'Cherry') AS concat_ws;

-- Case conversion
SELECT 
  UPPER('hello') AS upper_case,
  LOWER('HELLO') AS lower_case,
  INITCAP('hello world') AS initcap;

-- Trimming
SELECT 
  TRIM('  hello  ') AS trimmed,
  LTRIM('  hello  ') AS left_trimmed,
  RTRIM('  hello  ') AS right_trimmed,
  TRIM(LEADING 'x' FROM 'xxxhelloxxx') AS trim_leading,
  TRIM(TRAILING 'x' FROM 'xxxhelloxxx') AS trim_trailing,
  TRIM(BOTH 'x' FROM 'xxxhelloxxx') AS trim_both;

-- Substring operations
SELECT 
  SUBSTRING('PostgreSQL' FROM 1 FOR 5) AS substring,
  SUBSTRING('PostgreSQL' FROM 6) AS substring_from,
  LEFT('PostgreSQL', 5) AS left_part,
  RIGHT('PostgreSQL', 5) AS right_part;

-- String replacement
SELECT 
  REPLACE('Hello World', 'World', 'PostgreSQL') AS replaced,
  TRANSLATE('Hello', 'elo', 'ELO') AS translated;

-- String position and search
SELECT 
  POSITION('SQL' IN 'PostgreSQL') AS position,
  STRPOS('PostgreSQL', 'SQL') AS strpos,
  'PostgreSQL' LIKE '%SQL%' AS like_match,
  'PostgreSQL' ILIKE '%sql%' AS ilike_match;

-- String length
SELECT 
  LENGTH('Hello') AS length,
  CHAR_LENGTH('Hello') AS char_length,
  OCTET_LENGTH('Hello') AS octet_length;

-- Padding
SELECT 
  LPAD('Hello', 10, '*') AS left_padded,
  RPAD('Hello', 10, '*') AS right_padded;

-- String splitting
SELECT 
  SPLIT_PART('apple,banana,cherry', ',', 2) AS split_part,
  STRING_TO_ARRAY('apple,banana,cherry', ',') AS string_to_array;

-- Regular expressions
SELECT 
  'PostgreSQL' ~ '^Post' AS regex_match,
  'PostgreSQL' ~* '^post' AS case_insensitive_match,
  REGEXP_REPLACE('Hello123World', '[0-9]+', '') AS regex_replace,
  REGEXP_SPLIT_TO_ARRAY('a,b,c', ',') AS regex_split;

-- Practical examples
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  description TEXT,
  sku VARCHAR(50)
);

INSERT INTO products (name, description, sku)
VALUES 
  ('  Laptop Computer  ', 'High-performance laptop', 'LAP-001'),
  ('Mouse Pad', 'Ergonomic mouse pad', 'MOU-002');

-- Clean and format product names
SELECT 
  id,
  TRIM(name) AS cleaned_name,
  UPPER(sku) AS uppercase_sku,
  INITCAP(description) AS formatted_description,
  SPLIT_PART(sku, '-', 1) AS sku_prefix,
  SPLIT_PART(sku, '-', 2) AS sku_number
FROM products;`}
          />
          <CodeBlock
            title="Prisma: String Functions"
            language="javascript"
            code={`// Prisma doesn't have built-in string functions
// Use raw SQL for complex string operations

// schema.prisma
model Product {
  id          Int     @id @default(autoincrement())
  name        String  @db.VarChar(100)
  description String? @db.Text
  sku         String  @db.VarChar(50)
  
  @@map("products")
}

// Basic operations in JavaScript/TypeScript
const products = await prisma.product.findMany();

// Process strings in application code
const processed = products.map(product => ({
  ...product,
  cleanedName: product.name.trim(),
  upperSku: product.sku.toUpperCase(),
}));

// Use raw SQL for database-level string operations
const results = await prisma.$queryRaw\`
  SELECT 
    id,
    TRIM(name) AS cleaned_name,
    UPPER(sku) AS uppercase_sku,
    INITCAP(description) AS formatted_description
  FROM products
\`;

// String filtering with Prisma
const filtered = await prisma.product.findMany({
  where: {
    name: {
      contains: 'Laptop',
      mode: 'insensitive',  // Case-insensitive search
    },
    sku: {
      startsWith: 'LAP',
    },
  },
});

// Update with string manipulation
await prisma.$executeRaw\`
  UPDATE products
  SET name = TRIM(name),
      sku = UPPER(sku)
  WHERE name != TRIM(name) OR sku != UPPER(sku)
\`;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Use TEXT</strong> for most text storage (no performance penalty vs VARCHAR)</li>
              <li><strong>Use VARCHAR(n)</strong> when you need to enforce a maximum length</li>
              <li><strong>Avoid CHAR(n)</strong> unless you specifically need fixed-length strings</li>
              <li><strong>Always use UTF-8</strong> encoding for international support</li>
              <li><strong>Consider indexing</strong> frequently searched text columns</li>
              <li><strong>Use full-text search</strong> for complex text searching (covered later)</li>
            </ul>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}


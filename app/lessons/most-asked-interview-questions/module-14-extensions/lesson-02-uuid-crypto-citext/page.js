import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 2: UUID, pgcrypto and citext - Module 14 - Most Asked Interview Questions',
  description:
    'Most asked PostgreSQL interview questions on uuid-ossp vs pgcrypto vs gen_random_uuid, UUID primary key trade-offs, pgcrypto, hashing passwords in the app vs the database, and citext vs a lower(email) index.',
};

export default function Module14Lesson02UuidCryptoCitext() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 2: UUID, pgcrypto and citext</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Three extensions come up in almost every interview because almost every app touches them: how you
          generate IDs, how you handle hashing and encryption, and how you make email comparisons ignore
          capital letters.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard
            level="Junior"
            question="uuid-ossp vs pgcrypto vs gen_random_uuid(): what should you use?"
          >
            <p>
              Use <code>gen_random_uuid()</code>. Since <strong>PostgreSQL 13</strong> it is built into the
              core database, so you need no extension at all, and it produces a random UUID version 4. The
              older options exist for history and for special cases.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <code>gen_random_uuid()</code>: core since PG 13. The default answer.
              </li>
              <li>
                <code>pgcrypto</code>: provided <code>gen_random_uuid()</code> before PG 13. On PG 13 and
                later you no longer need it just for UUIDs.
              </li>
              <li>
                <code>uuid-ossp</code>: provides other UUID versions, such as v1 which embeds a timestamp and
                MAC address, and v5 which hashes a name into a stable UUID. Only install it if you genuinely
                need those.
              </li>
              <li>
                PostgreSQL 18 adds <code>uuidv7()</code>, a time-ordered UUID, which fixes most of the index
                locality problem discussed below.
              </li>
            </ul>
            <CodeBlock
              title="UUID generation"
              language="sql"
              code={`SELECT gen_random_uuid();          -- core PostgreSQL 13+, UUID v4

-- Only if you need other versions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
SELECT uuid_generate_v4();
SELECT uuid_generate_v1();        -- time and MAC based, leaks some info
SELECT uuid_generate_v5(uuid_ns_url(), 'https://example.com/u/1');  -- deterministic`}
            />
            <CodeBlock
              title="Prisma default UUID"
              language="prisma"
              code={`model User {
  id    String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email String @unique
}

// Alternative: Prisma generates the value in the application instead
model Session {
  id String @id @default(uuid()) @db.Uuid
}`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="What is citext and when is it useful?">
            <p>
              <code>citext</code> is a text type whose comparisons ignore letter case. With an ordinary{' '}
              <code>text</code> column, <code>Alice@X.com</code> and <code>alice@x.com</code> are two
              different values and a <code>UNIQUE</code> constraint happily allows both. With{' '}
              <code>citext</code> they collide, which is what you want for emails and usernames.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                It also means you stop wrapping every lookup in <code>LOWER()</code>.
              </li>
              <li>
                Still normalise and trim input in the application, so stored data is tidy and predictable.
              </li>
              <li>
                It is not free: comparisons do case folding, and some ORM tooling handles the custom type
                awkwardly.
              </li>
            </ul>
            <CodeBlock
              title="citext"
              language="sql"
              code={`CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE users (
  id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email CITEXT UNIQUE NOT NULL
);

INSERT INTO users (email) VALUES ('Alice@X.com');
INSERT INTO users (email) VALUES ('alice@x.com');  -- rejected: unique violation

SELECT * FROM users WHERE email = 'ALICE@X.COM';   -- found, no LOWER() needed`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="What is the trade-off of using a UUID as a primary key?">
            <p>
              One line: UUIDs let any client or service generate an ID without asking the database, but
              random UUIDs are larger and scatter writes across the index instead of appending to the end of
              it.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Good</strong>: no coordination needed, IDs can be created offline or in another
                service, and they do not leak how many rows you have the way a sequential integer does.
              </li>
              <li>
                <strong>Cost</strong>: 16 bytes versus 8 for <code>bigint</code>, and every foreign key
                carries that extra width. Random v4 values land in random index pages, which hurts cache hit
                rate and causes more page splits on insert-heavy tables.
              </li>
              <li>
                <strong>Fix</strong>: use a time-ordered ID such as UUID v7 or ULID so new rows still land at
                the end of the index.
              </li>
              <li>
                <strong>Always</strong> store it as <code>uuid</code>, never as <code>text</code>. Text
                doubles the size and slows comparisons.
              </li>
            </ul>
            <CodeBlock
              title="uuid vs text storage"
              language="sql"
              code={`-- Correct: native 16-byte type
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

-- Wrong: 36 characters of text per row, in every index and foreign key
-- id TEXT PRIMARY KEY

SELECT pg_column_size('11111111-1111-1111-1111-111111111111'::uuid) AS as_uuid,  -- 16
       pg_column_size('11111111-1111-1111-1111-111111111111'::text) AS as_text;  -- 37`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="What is pgcrypto used for?">
            <p>
              <code>pgcrypto</code> adds cryptography functions to SQL: one-way hashes with{' '}
              <code>digest</code>, password hashing with <code>crypt</code> and <code>gen_salt</code>, random
              bytes, and PGP-style symmetric and public key encryption for column values.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <code>digest()</code>: a plain hash such as SHA-256. Fine for fingerprints and checksums.
              </li>
              <li>
                <code>crypt()</code> with <code>gen_salt('bf')</code>: a slow, salted hash designed for
                passwords.
              </li>
              <li>
                <code>pgp_sym_encrypt()</code>: encrypt a column value with a key you supply.
              </li>
              <li>
                <code>gen_random_bytes()</code>: cryptographically strong randomness for tokens.
              </li>
            </ul>
            <p>
              The big caveat interviewers want to hear: if you encrypt inside SQL, the key travels in the
              query and may land in logs, and the database can read the plaintext. That defeats much of the
              point.
            </p>
            <CodeBlock
              title="pgcrypto examples"
              language="sql"
              code={`CREATE EXTENSION IF NOT EXISTS pgcrypto;

SELECT encode(digest('payload', 'sha256'), 'hex');   -- fingerprint
SELECT crypt('password', gen_salt('bf', 12));        -- bcrypt hash
SELECT encode(gen_random_bytes(32), 'hex');          -- random token

-- Encrypted column value
SELECT pgp_sym_encrypt('4111111111111111', 'key-from-kms');
SELECT pgp_sym_decrypt(card_enc, 'key-from-kms') FROM payments;`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="Should you hash passwords in the database or in the application?"
          >
            <p>
              In the application. <code>pgcrypto</code> can do it, and interviewers ask precisely to see
              whether you know why you should not.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>The plaintext reaches the server.</strong> To run{' '}
                <code>crypt(&apos;secret&apos;, ...)</code> you must send the raw password in a SQL statement,
                where it can appear in <code>pg_stat_statements</code>, in the slow query log, or in an error
                message.
              </li>
              <li>
                <strong>You cannot use the best algorithms.</strong> pgcrypto gives you bcrypt. Application
                libraries give you Argon2id and scrypt, which are memory-hard and the current
                recommendation.
              </li>
              <li>
                <strong>Hashing burns database CPU.</strong> Password hashing is deliberately slow. Doing it
                on your hardest-to-scale tier, during a login storm, is the wrong place for that cost.
              </li>
              <li>
                <strong>Rotating work factors is easier in app code</strong>, where you can re-hash on
                successful login.
              </li>
            </ul>
            <p>
              The right shape: the app hashes with Argon2id or bcrypt and sends only the finished hash. The
              database stores an opaque string and never sees a password. Then actually use{' '}
              <code>pgcrypto</code> for what it is good at, such as random tokens and checksums.
            </p>
            <CodeBlock
              title="Hash in the app, store the result"
              language="typescript"
              code={`import argon2 from 'argon2';

// Register: the database never sees the plaintext
const passwordHash = await argon2.hash(plainPassword, { type: argon2.argon2id });
await prisma.user.create({ data: { email, passwordHash } });

// Login: compare in the app
const user = await prisma.user.findUnique({ where: { email } });
const ok = user ? await argon2.verify(user.passwordHash, plainPassword) : false;
if (!ok) throw new Error('Invalid credentials');`}
            />
            <CodeBlock
              title="What not to do"
              language="sql"
              code={`-- Anti-pattern: the raw password is now inside a SQL statement
INSERT INTO users (email, password_hash)
VALUES ('a@b.com', crypt('SuperSecret123', gen_salt('bf')));

-- Acceptable pgcrypto use: no user secret in the statement
UPDATE api_keys
SET token = encode(gen_random_bytes(32), 'hex')
WHERE id = $1;`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="citext or a unique index on lower(email): which do you pick?"
          >
            <p>
              Both make emails case-insensitively unique, and both are correct. They differ in where the rule
              lives.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>citext</strong>: the column itself is case-insensitive, so every comparison, join, and
                constraint behaves that way automatically. Nobody can forget. It needs an extension, and
                Prisma handles it via <code>@db.Citext</code> or an <code>Unsupported</code> mapping.
              </li>
              <li>
                <strong>Unique index on <code>lower(email)</code></strong>: no extension, plain{' '}
                <code>text</code> column, works everywhere. But the index is only used when the query also
                writes <code>lower(email) = lower($1)</code>. Query with <code>email = $1</code> and you get
                a sequential scan and case-sensitive behaviour.
              </li>
            </ul>
            <p>
              Practical recommendation: normalise to lowercase in the application on write, and add the
              functional unique index as the safety net. That works on every host, including ones that do not
              allow <code>citext</code>. Choose <code>citext</code> when many teams or tools query the table
              directly and you cannot rely on all of them remembering to call <code>lower()</code>.
            </p>
            <CodeBlock
              title="Both approaches"
              language="sql"
              code={`-- Option A: citext column
CREATE EXTENSION IF NOT EXISTS citext;
CREATE TABLE users_a (
  id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email CITEXT UNIQUE NOT NULL
);

-- Option B: text column with a functional unique index
CREATE TABLE users_b (
  id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL
);
CREATE UNIQUE INDEX users_b_email_lower_key ON users_b (lower(email));

-- Option B only uses that index when the query matches its expression
SELECT * FROM users_b WHERE lower(email) = lower('Alice@X.com');  -- index scan
SELECT * FROM users_b WHERE email = 'Alice@X.com';                -- seq scan`}
            />
            <CodeBlock
              title="Prisma for each option"
              language="prisma"
              code={`// Option A: citext, declared as a native type
model UserA {
  id    String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email String @unique @db.Citext
}

// Option B: normalise in app code, add the functional index via raw SQL migration
model UserB {
  id    String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email String
}`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

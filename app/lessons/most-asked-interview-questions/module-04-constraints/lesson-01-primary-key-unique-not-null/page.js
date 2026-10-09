import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 1: Primary Key, UNIQUE, and NOT NULL - Module 4 - Most Asked Interview Questions',
  description:
    'Most asked interview questions on PRIMARY KEY vs UNIQUE, NOT NULL, DEFAULT, composite keys, natural vs surrogate keys, and constraint vs index in PostgreSQL.',
};

export default function M4L1PrimaryKeyUniqueNotNull() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 1: Primary Key, UNIQUE, and NOT NULL</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          A constraint is a rule the database itself enforces. These three rules are the ones you will
          write on almost every table, and they are the ones interviewers ask about first.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="What is a PRIMARY KEY vs a UNIQUE constraint?">
            <p>A primary key is the main id of a row. UNIQUE only says “this value cannot repeat.”</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>PRIMARY KEY:</strong> one per table. The column cannot be NULL and cannot repeat</li>
              <li><strong>UNIQUE:</strong> values cannot repeat, but in Postgres many NULLs are allowed (NULL is not equal to NULL)</li>
              <li>Both create an index so lookups stay fast</li>
              <li>Foreign keys usually point at the primary key</li>
            </ul>
            <CodeBlock
              title="PK and UNIQUE"
              language="sql"
              code={`CREATE TABLE users (
  id    BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  phone TEXT UNIQUE  -- multiple NULLs allowed
);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="What does NOT NULL do?">
            <ul className="list-disc pl-6 space-y-1">
              <li>Rejects <code>NULL</code> values for that column</li>
              <li>Does not create an index by itself</li>
              <li>Combine with defaults when a value should always exist</li>
            </ul>
            <CodeBlock
              title="NOT NULL"
              language="sql"
              code={`CREATE TABLE accounts (
  id         BIGSERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="What is the difference between DEFAULT and NOT NULL?">
            <p>
              They solve two different problems. <code>NOT NULL</code> blocks an empty value.
              <code>DEFAULT</code> fills in a value when you do not send one. They work best together.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>DEFAULT only:</strong> the column is filled when you skip it, but you can still store <code>NULL</code> on purpose</li>
              <li><strong>NOT NULL only:</strong> every insert must send a value or it fails</li>
              <li><strong>Both:</strong> the value always exists, and old code that skips the column still works</li>
              <li>A default is used only at insert time. Changing a default later does not change rows already stored</li>
            </ul>
            <CodeBlock
              title="DEFAULT vs NOT NULL"
              language="sql"
              code={`CREATE TABLE invoices (
  id         BIGSERIAL PRIMARY KEY,
  status     TEXT NOT NULL DEFAULT 'draft',   -- always present, no need to send it
  note       TEXT DEFAULT 'none',             -- default applies, but NULL is still allowed
  paid_at    TIMESTAMPTZ                      -- NULL means "not paid yet"
);

-- status becomes 'draft', note becomes 'none'
INSERT INTO invoices (id) VALUES (DEFAULT);

-- This is allowed: an explicit NULL beats the DEFAULT
INSERT INTO invoices (note) VALUES (NULL);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="Why should every table have a primary key?">
            <p>
              A primary key gives each row one short, stable name. Without it, two rows can look
              exactly the same and you have no safe way to point at just one of them.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>You can update or delete exactly one row instead of guessing</li>
              <li>Other tables can reference the row with a foreign key</li>
              <li>Lookups by id are fast because the key comes with an index</li>
              <li>Tools need it: logical replication, many ORMs, and Prisma all expect a unique row id</li>
              <li>Duplicate rows are blocked before they become a data cleanup project</li>
            </ul>
            <CodeBlock
              title="Identity column (modern style)"
              language="sql"
              code={`-- GENERATED ALWAYS AS IDENTITY is the SQL standard way; BIGSERIAL is the older Postgres way
CREATE TABLE orders (
  id       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id  BIGINT NOT NULL,
  total    NUMERIC(12, 2) NOT NULL
);`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="Can a UNIQUE constraint allow multiple NULLs? Why?">
            <ul className="list-disc pl-6 space-y-1">
              <li>In PostgreSQL, <code>UNIQUE</code> treats NULL as distinct — multiple NULLs are allowed</li>
              <li>This surprises candidates coming from other SQL dialects or business rules</li>
              <li>To allow only one NULL: partial unique index <code>WHERE col IS NOT NULL</code> plus app rules, or use a sentinel</li>
              <li>PG 15+ also supports <code>UNIQUE NULLS NOT DISTINCT</code></li>
            </ul>
            <CodeBlock
              title="NULLS NOT DISTINCT (PG 15+)"
              language="sql"
              code={`CREATE TABLE devices (
  id         BIGSERIAL PRIMARY KEY,
  serial_no  TEXT,
  UNIQUE NULLS NOT DISTINCT (serial_no)
);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What are composite primary keys and composite unique constraints?">
            <ul className="list-disc pl-6 space-y-1">
              <li>Composite PK: uniqueness across multiple columns together</li>
              <li>Common in junction tables for many-to-many</li>
              <li>Composite UNIQUE prevents duplicate pairs even with a surrogate PK</li>
            </ul>
            <CodeBlock
              title="Composite keys"
              language="sql"
              code={`CREATE TABLE enrollments (
  student_id BIGINT REFERENCES students (id),
  course_id  BIGINT REFERENCES courses (id),
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (student_id, course_id)
);

-- Surrogate PK + composite unique
CREATE TABLE memberships (
  id      BIGSERIAL PRIMARY KEY,
  org_id  BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  UNIQUE (org_id, user_id)
);`}
            />
            <CodeBlock
              title="Prisma composite"
              language="typescript"
              code={`model Enrollment {
  studentId Int
  courseId  Int
  student   Student @relation(fields: [studentId], references: [id])
  course    Course  @relation(fields: [courseId], references: [id])

  @@id([studentId, courseId])
}

model Membership {
  id     Int @id @default(autoincrement())
  orgId  Int
  userId Int

  @@unique([orgId, userId])
}`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What is the difference between a natural key and a surrogate key?">
            <p>
              A natural key is real data that already identifies the row, like an email or an ISBN.
              A surrogate key is a meaningless id the database made up, like <code>1, 2, 3</code> or a UUID.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Natural key:</strong> no extra column, reads well, but business data changes. People change email. Then every child table that stored that value has to change too</li>
              <li><strong>Surrogate key:</strong> never changes, small and fast to join on, but tells you nothing on its own</li>
              <li>Common production answer: use a surrogate primary key, and still put a <code>UNIQUE</code> constraint on the natural key so duplicates are impossible</li>
              <li>Junction tables are the usual exception — a composite natural key of the two foreign keys is fine</li>
              <li>UUID vs bigint: UUIDs are good when ids are made by clients or many services; they are wider and random, so plain v4 UUIDs can hurt index locality</li>
            </ul>
            <CodeBlock
              title="Surrogate PK plus unique natural key"
              language="sql"
              code={`CREATE TABLE customers (
  id      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,  -- surrogate
  email   TEXT NOT NULL UNIQUE,                             -- natural key, still protected
  tax_id  TEXT UNIQUE
);

-- Children reference the stable id, so changing an email breaks nothing
CREATE TABLE invoices (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers (id)
);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What is the difference between a constraint and an index?">
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Constraint:</strong> Logical rule for integrity (PK/UNIQUE/FK/CHECK)</li>
              <li><strong>Index:</strong> Physical access path for performance</li>
              <li>PK/UNIQUE constraints create unique indexes automatically</li>
              <li>FK requires an index on the <em>referenced</em> side; indexing the referencing column is strongly recommended for deletes/joins</li>
              <li>A unique index behaves like a unique constraint, but only a real constraint can be named as an <code>ON CONFLICT</code> constraint target or referenced by a foreign key</li>
            </ul>
            <CodeBlock
              title="Constraint vs bare index"
              language="sql"
              code={`-- Constraint: shows up in \\d output as a constraint, can be an FK target
ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);

-- Index only: enforces uniqueness too, and can do things a constraint cannot
CREATE UNIQUE INDEX users_lower_email_uidx ON users (lower(email));`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

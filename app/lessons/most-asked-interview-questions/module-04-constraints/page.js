import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';
import InterviewQACard from '../../../components/InterviewQACard';

export const metadata = {
  title: 'Module 4: Constraints - Most Asked Interview Questions',
  description:
    'Most asked interview questions on PostgreSQL constraints covering junior to senior — PK, UNIQUE, FK actions, CHECK, NOT NULL, composite keys, deferrable, EXCLUDE, and Prisma relations',
};

export default function Module4Constraints() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Module 4: Constraints</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Most asked interview questions for Phase 4 — Junior → Senior. Includes PostgreSQL (latest) and Prisma where relevant.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="What is a PRIMARY KEY vs a UNIQUE constraint?">
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>PRIMARY KEY:</strong> Uniquely identifies a row; implies <code>NOT NULL</code> + unique; only one PK per table</li>
              <li><strong>UNIQUE:</strong> Ensures uniqueness; allows multiple <code>NULL</code>s in PostgreSQL (NULL ≠ NULL)</li>
              <li>Both create a unique B-tree index under the hood</li>
              <li>PK is the default target for foreign keys</li>
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

          <InterviewQACard level="Junior" question="What is a FOREIGN KEY?">
            <p>A foreign key ensures values in a child column exist in a parent table’s referenced key — referential integrity.</p>
            <CodeBlock
              title="Foreign key"
              language="sql"
              code={`CREATE TABLE orders (
  id         BIGSERIAL PRIMARY KEY,
  user_id    BIGINT NOT NULL REFERENCES users (id),
  total      NUMERIC(12, 2) NOT NULL
);

-- Named constraint form
ALTER TABLE orders
  ADD CONSTRAINT orders_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users (id);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="Explain ON DELETE CASCADE, SET NULL, and RESTRICT.">
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>CASCADE:</strong> Deleting parent deletes child rows</li>
              <li><strong>SET NULL:</strong> Child FK columns become NULL (column must be nullable)</li>
              <li><strong>RESTRICT / NO ACTION:</strong> Block parent delete if children exist (most common default behavior)</li>
              <li><strong>SET DEFAULT:</strong> Set child FK to its default value</li>
              <li>Same options exist for <code>ON UPDATE</code></li>
            </ul>
            <CodeBlock
              title="FK delete actions"
              language="sql"
              code={`CREATE TABLE posts (
  id      BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE comments (
  id      BIGSERIAL PRIMARY KEY,
  post_id BIGINT REFERENCES posts (id) ON DELETE SET NULL
);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="What is a CHECK constraint?">
            <ul className="list-disc pl-6 space-y-1">
              <li>Enforces a boolean expression on each row</li>
              <li>Good for ranges, allowed values, cross-column rules</li>
              <li>Expression must be immutable / deterministic for the row</li>
            </ul>
            <CodeBlock
              title="CHECK examples"
              language="sql"
              code={`CREATE TABLE products (
  id           BIGSERIAL PRIMARY KEY,
  price        NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  stock        INT NOT NULL CHECK (stock >= 0),
  discount_pct NUMERIC(5, 2),
  CONSTRAINT products_discount_chk
    CHECK (discount_pct IS NULL OR discount_pct BETWEEN 0 AND 100)
);`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

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

          <InterviewQACard level="Mid" question="How do you map FK onDelete behavior in Prisma?">
            <ul className="list-disc pl-6 space-y-1">
              <li>Use <code>onDelete</code> on <code>@relation</code>: <code>Cascade</code>, <code>SetNull</code>, <code>Restrict</code>, <code>NoAction</code>, <code>SetDefault</code></li>
              <li>Must match nullable FK fields when using <code>SetNull</code></li>
              <li><code>@@unique</code> / <code>@@id</code> define uniqueness; <code>@relation</code> defines referential actions</li>
            </ul>
            <CodeBlock
              title="Prisma onDelete"
              language="typescript"
              code={`model User {
  id    Int    @id @default(autoincrement())
  posts Post[]
}

model Post {
  id     Int  @id @default(autoincrement())
  userId Int
  user   User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Comment {
  id     Int   @id @default(autoincrement())
  postId Int?
  post   Post? @relation(fields: [postId], references: [id], onDelete: SetNull)
}`}
            />
          </InterviewQACard>

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

          <InterviewQACard level="Mid" question="What is the difference between a constraint and an index?">
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Constraint:</strong> Logical rule for integrity (PK/UNIQUE/FK/CHECK)</li>
              <li><strong>Index:</strong> Physical access path for performance</li>
              <li>PK/UNIQUE constraints create unique indexes automatically</li>
              <li>FK requires an index on the <em>referenced</em> side; indexing the referencing column is strongly recommended for deletes/joins</li>
            </ul>
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How do you add a constraint to an existing table without long downtime?">
            <ul className="list-disc pl-6 space-y-1">
              <li>For CHECK/FK: <code>NOT VALID</code> then <code>VALIDATE CONSTRAINT</code> — avoids full rewrite lock pattern for validation phase nuances</li>
              <li>Validate scans existing rows with a weaker lock than creating a fully validated constraint in one step</li>
              <li>Clean bad data first; monitor lock waits</li>
            </ul>
            <CodeBlock
              title="NOT VALID then VALIDATE"
              language="sql"
              code={`ALTER TABLE orders
  ADD CONSTRAINT orders_total_chk CHECK (total >= 0) NOT VALID;

ALTER TABLE orders VALIDATE CONSTRAINT orders_total_chk;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="What are deferrable constraints?">
            <ul className="list-disc pl-6 space-y-1">
              <li>Normally constraints are checked immediately after each statement</li>
              <li><code>DEFERRABLE</code> + <code>INITIALLY DEFERRED</code> checks at transaction commit</li>
              <li>Useful for circular FKs or multi-row swaps that temporarily violate uniqueness</li>
              <li>Overuse hides bugs; prefer redesign when possible</li>
            </ul>
            <CodeBlock
              title="Deferrable UNIQUE"
              language="sql"
              code={`CREATE TABLE seats (
  id        BIGSERIAL PRIMARY KEY,
  room_id   BIGINT NOT NULL,
  seat_no   INT NOT NULL,
  CONSTRAINT seats_room_seat_uidx UNIQUE (room_id, seat_no) DEFERRABLE INITIALLY DEFERRED
);

BEGIN;
UPDATE seats SET seat_no = seat_no + 100 WHERE room_id = 1; -- temporary duplicates OK
UPDATE seats SET seat_no = seat_no - 99 WHERE room_id = 1;
COMMIT; -- checked here`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="What is an EXCLUDE constraint and when is it used?">
            <ul className="list-disc pl-6 space-y-1">
              <li><code>EXCLUDE</code> prevents conflicting rows using an index operator class (often GiST)</li>
              <li>Classic use: no overlapping time ranges for the same resource (booking systems)</li>
              <li>More powerful than UNIQUE for non-equality conflicts</li>
              <li>Requires appropriate extensions/types (e.g. <code>btree_gist</code> for mixing equality + range)</li>
            </ul>
            <CodeBlock
              title="EXCLUDE overlapping bookings"
              language="sql"
              code={`CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE bookings (
  id          BIGSERIAL PRIMARY KEY,
  room_id     BIGINT NOT NULL,
  during      TSRANGE NOT NULL,
  EXCLUDE USING gist (room_id WITH =, during WITH &&)
);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="How do constraints interact with concurrency and upserts?">
            <ul className="list-disc pl-6 space-y-1">
              <li>Unique violations under concurrency are expected — handle with retry or <code>ON CONFLICT</code></li>
              <li>FK checks can block on parent row locks</li>
              <li>Partial unique indexes encode business rules (“one active subscription per user”)</li>
            </ul>
            <CodeBlock
              title="Partial unique index"
              language="sql"
              code={`CREATE UNIQUE INDEX one_active_sub_per_user
  ON subscriptions (user_id)
  WHERE status = 'active';`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="What constraint design mistakes do interviewers listen for?">
            <ul className="list-disc pl-6 space-y-1">
              <li>Relying only on the application for integrity (race conditions, other writers)</li>
              <li><code>ON DELETE CASCADE</code> everywhere without thinking about blast radius</li>
              <li>Missing indexes on FK columns → slow deletes and joins</li>
              <li>CHECK constraints that call non-immutable functions or depend on other tables (not allowed / fragile)</li>
              <li>Composite keys without documenting access patterns</li>
            </ul>
          </InterviewQACard>

          <InterviewQACard level="Senior" question="How do you express advanced uniqueness in Prisma when the schema DSL is limited?">
            <ul className="list-disc pl-6 space-y-1">
              <li>Use <code>@@unique</code>, <code>@@id</code>, and relation <code>onDelete</code>/<code>onUpdate</code> first</li>
              <li>Partial unique indexes and EXCLUDE often need custom SQL in migrations</li>
              <li>Keep Prisma schema in sync with comments / ignored maps so <code>db pull</code> does not surprise you</li>
            </ul>
            <CodeBlock
              title="Custom partial unique in migration"
              language="sql"
              code={`-- prisma/migrations/.../migration.sql
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS users_email_active_uidx
  ON users (email)
  WHERE deleted_at IS NULL;`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 8: ENUM Types - Module 2 - Most Asked Interview Questions',
  description:
    'Most asked interview questions on PostgreSQL ENUM — trade-offs, ALTER TYPE ADD VALUE, removing a value, and ENUM vs lookup table vs TEXT CHECK',
};

export default function MaiqM02L08EnumTypes() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 8: ENUM Types</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Enums look perfect for status columns. The interview is about how painful they are to change later.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="What is an ENUM type in PostgreSQL?">
            <p>
              An ENUM is a custom type with a fixed list of labels. The database rejects any other value.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Readable: <code>&apos;pending&apos;</code>, <code>&apos;paid&apos;</code>, <code>&apos;shipped&apos;</code></li>
              <li>Compact storage (4 bytes internally)</li>
              <li>Values sort in the order they were declared, not alphabetically</li>
              <li>In Prisma you declare an <code>enum</code> in the schema and it maps to a Postgres enum</li>
            </ul>
            <CodeBlock
              title="ENUM example"
              language="sql"
              code={`CREATE TYPE order_status AS ENUM ('pending', 'paid', 'shipped', 'cancelled');

CREATE TABLE orders (
  id     BIGSERIAL PRIMARY KEY,
  status order_status NOT NULL DEFAULT 'pending'
);`}
            />
            <CodeBlock
              title="Prisma enum"
              language="typescript"
              code={`enum OrderStatus {
  pending
  paid
  shipped
  cancelled
}

model Order {
  id     Int         @id @default(autoincrement())
  status OrderStatus @default(pending)
}`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="What are ENUM types, and what are the trade-offs?">
            <ul className="list-disc pl-6 space-y-1">
              <li>Enums are custom types with a fixed set of labels — strong validation at the DB layer</li>
              <li>Pros: readable, compact storage, check without a separate CHECK list</li>
              <li>Cons: adding/renaming values needs <code>ALTER TYPE</code>; removing values is painful; migrations can be awkward</li>
              <li>Alternative: <code>TEXT</code> + <code>CHECK</code>, or a lookup table for frequently changing sets</li>
              <li>Enum values sort in the order they were declared, not alphabetically. That is sometimes exactly what you want for a status ladder</li>
            </ul>
            <CodeBlock
              title="Add a value"
              language="sql"
              code={`-- PG 10+: ADD VALUE is transactional in recent versions with care
ALTER TYPE order_status ADD VALUE 'refunded';`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How do you add, rename, or remove a value from an existing ENUM?">
            <p>
              Adding and renaming are single commands. Removing a value is the hard one, because Postgres has no <code>DROP VALUE</code>.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><code>ALTER TYPE ... ADD VALUE</code> appends a label. Use <code>BEFORE</code> or <code>AFTER</code> to control the sort position</li>
              <li>Before Postgres 12, <code>ADD VALUE</code> could not run inside a transaction block at all. From 12 it can, but you still cannot use the new value in the same transaction that added it. This bites people using migration tools that wrap everything in one transaction</li>
              <li><code>ADD VALUE IF NOT EXISTS</code> makes the migration safe to re-run</li>
              <li><code>ALTER TYPE ... RENAME VALUE old TO new</code> renames in place, and existing rows follow automatically</li>
              <li><strong>To remove a value</strong> you create a new type, migrate the column, and drop the old type. Update any rows still using the doomed label first</li>
              <li>This whole dance is the main reason experienced teams choose a lookup table for statuses that change often</li>
            </ul>
            <CodeBlock
              title="Add and rename"
              language="sql"
              code={`ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'refunded';
ALTER TYPE order_status ADD VALUE 'packed' AFTER 'paid';
ALTER TYPE order_status RENAME VALUE 'cancelled' TO 'canceled';

SELECT enumlabel, enumsortorder
FROM pg_enum
WHERE enumtypid = 'order_status'::regtype
ORDER BY enumsortorder;`}
            />
            <CodeBlock
              title="Removing a value: swap the type"
              language="sql"
              code={`-- 1. Move rows off the value you are dropping
UPDATE orders SET status = 'canceled' WHERE status = 'refunded';

-- 2. Create the new type without it
CREATE TYPE order_status_new AS ENUM ('pending', 'paid', 'packed', 'shipped', 'canceled');

-- 3. Swap the column over (rewrites the table, so plan the lock)
ALTER TABLE orders
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE order_status_new
    USING status::text::order_status_new,
  ALTER COLUMN status SET DEFAULT 'pending';

-- 4. Clean up
DROP TYPE order_status;
ALTER TYPE order_status_new RENAME TO order_status;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="ENUM, lookup table, or TEXT with a CHECK — which do you pick and why?">
            <p>
              All three stop bad values. They differ in how easily the list can change, whether the list can carry extra information, and how much work a
              schema migration is. A senior answer names the deciding factor rather than picking a favourite.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>ENUM:</strong> compact (4 bytes), self-documenting, sorts in declared order, and gives clean generated types in Prisma and similar tools. Cost: every change is a DDL migration, and you cannot attach a label, colour, or sort weight to a value</li>
              <li><strong>TEXT with a CHECK:</strong> easiest to change, since altering a constraint is cheaper than altering a type, and you can add it <code>NOT VALID</code> then validate. Cost: the allowed list lives in a constraint definition, which tools do not introspect as nicely, and it stores the full string on every row</li>
              <li><strong>Lookup table with a foreign key:</strong> the most flexible. Values become data, so a product manager can add one without a deploy, and you can store a display name, a sort order, and an is_active flag next to it. Cost: an extra join, and you must plan what happens when a value is retired</li>
              <li><strong>Deciding rule:</strong> if the set is fixed by code logic and changes maybe once a year, use an ENUM. If the set is business data that grows, use a lookup table. If you want the middle ground with the least ceremony, use TEXT plus CHECK</li>
              <li><strong>Migration cost matters most:</strong> ENUM changes are DDL on a shared type, which can conflict with concurrent deploys. A lookup table change is a plain INSERT</li>
              <li>Whichever you choose, keep the database as the last line of defence. The application should also validate, so users get a good error message instead of a constraint violation</li>
            </ul>
            <CodeBlock
              title="TEXT with a CHECK"
              language="sql"
              code={`CREATE TABLE tickets (
  id     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'pending', 'resolved', 'closed'))
);

-- Changing the list is a constraint swap, not a type rewrite
ALTER TABLE tickets DROP CONSTRAINT tickets_status_check;
ALTER TABLE tickets ADD CONSTRAINT tickets_status_check
  CHECK (status IN ('open', 'pending', 'on_hold', 'resolved', 'closed'));`}
            />
            <CodeBlock
              title="Lookup table version"
              language="sql"
              code={`CREATE TABLE ticket_statuses (
  code       TEXT PRIMARY KEY,
  label      TEXT NOT NULL,
  sort_order SMALLINT NOT NULL,
  is_active  BOOLEAN NOT NULL DEFAULT true
);

INSERT INTO ticket_statuses (code, label, sort_order) VALUES
  ('open', 'Open', 1),
  ('pending', 'Waiting on customer', 2),
  ('resolved', 'Resolved', 3);

CREATE TABLE tickets (
  id     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  status TEXT NOT NULL REFERENCES ticket_statuses (code)
);

INSERT INTO ticket_statuses (code, label, sort_order)
VALUES ('on_hold', 'On hold', 4);`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

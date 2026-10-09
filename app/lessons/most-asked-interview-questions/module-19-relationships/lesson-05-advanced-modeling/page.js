import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 5: Advanced Modeling - Module 19 - Most Asked Interview Questions',
  description:
    'Most asked advanced schema modeling interview questions: soft deletes, polymorphic association pitfalls and exclusive arcs, status history and audit tables, soft delete versus an archive table, multi-tenant single-database design with a tenant id, composite foreign keys for tenant isolation, and implicit versus explicit many-to-many in Prisma.',
};

export default function M19L5AdvancedModeling() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 5: Advanced Modeling</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          The patterns in this lesson turn up in almost every real system: rows that must not really be deleted,
          links that point at more than one kind of thing, a record of how something changed, and many customers
          sharing one database. Each one has a version that works and a version that quietly breaks.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard
            level="Junior"
            question="What is a soft delete, and what does it change about your queries?"
          >
            <p>
              A soft delete marks a row as gone instead of removing it. The usual shape is a nullable{' '}
              <code>deleted_at</code> timestamp: NULL means live, a value means deleted and when.
            </p>
            <p>
              A timestamp beats a boolean, because it tells you <em>when</em> for free, and it still reads as a
              simple flag in a <code>WHERE</code> clause.
            </p>
            <CodeBlock
              title="The column and the filter"
              language="sql"
              code={`ALTER TABLE posts ADD COLUMN deleted_at TIMESTAMPTZ;

-- Deleting
UPDATE posts SET deleted_at = now() WHERE id = $1;

-- Every read must now filter
SELECT id, title FROM posts WHERE deleted_at IS NULL;

-- A partial index keeps the live-row queries fast and small
CREATE INDEX posts_live_created_idx ON posts (created_at DESC)
  WHERE deleted_at IS NULL;`}
            />
            <p>
              The cost is that the filter is now required <em>everywhere</em>, and forgetting it is a silent bug:
              deleted rows reappear in a list, or a count is wrong. Three specific things break, and naming them is
              what a good answer sounds like:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Unique constraints still apply,</strong> so a deleted user keeps their email reserved
                forever. The fix is a partial unique index over live rows only
              </li>
              <li>
                <strong>Foreign keys still point at deleted rows,</strong> so children can be attached to a parent
                the application thinks is gone
              </li>
              <li>
                <strong>Nothing cascades,</strong> because no delete happened. You have to soft-delete children
                yourself
              </li>
            </ul>
            <CodeBlock
              title="Partial unique index so a deleted email can be reused"
              language="sql"
              code={`DROP INDEX IF EXISTS users_email_key;

CREATE UNIQUE INDEX users_email_live_key
  ON users (email) WHERE deleted_at IS NULL;`}
            />
            <p>
              In Prisma, put the filter in one place rather than in every query. A client extension applies it for
              you, so a new endpoint cannot forget.
            </p>
            <CodeBlock
              title="Filter once, in an extension"
              language="typescript"
              code={`export const db = prisma.$extends({
  query: {
    post: {
      async findMany({ args, query }) {
        args.where = { deletedAt: null, ...args.where };
        return query(args);
      },
      async findFirst({ args, query }) {
        args.where = { deletedAt: null, ...args.where };
        return query(args);
      },
    },
  },
});

// Use the raw client deliberately when an admin screen must see everything.`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="What are the pitfalls of polymorphic associations?">
            <p>
              A polymorphic association is a link that can point at more than one kind of parent, usually stored as
              two columns: <code>commentable_type</code> holding a table name, and{' '}
              <code>commentable_id</code> holding a row id. This is the Rails-style pattern, and the problem is
              simple: a foreign key can only reference one table, so there is no constraint you can add.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Integrity becomes application-only. Nothing stops a row with{' '}
                <code>type = &apos;Post&apos;</code> and an id that belongs to a ticket
              </li>
              <li>Orphans are created by any delete, because no cascade can exist</li>
              <li>
                Joins need a <code>CASE</code> or a union and cannot use a normal index cleanly, so the planner
                cannot estimate them well
              </li>
              <li>
                The type column is a string referring to a table name, which means a rename breaks data rather than
                code
              </li>
              <li>
                Prisma cannot model it as a relation at all, so you lose <code>include</code> and get raw queries
                instead
              </li>
            </ul>
            <p>
              The alternatives, in the order you should consider them. An <strong>exclusive arc</strong> uses one
              nullable foreign key per possible parent plus a <code>CHECK</code> that exactly one is set — real
              constraints, real cascades, and the only cost is one column per parent type. A{' '}
              <strong>separate child table per parent</strong> (<code>post_comments</code>,{' '}
              <code>ticket_comments</code>) is the cleanest when the behaviour differs anyway. And a{' '}
              <strong>shared supertype</strong> table gives you one real target to reference when you have many
              parent types.
            </p>
            <CodeBlock
              title="Exclusive arc: real constraints, exactly one parent"
              language="sql"
              code={`CREATE TABLE attachments (
  id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  file_url  TEXT NOT NULL,
  order_id  INT REFERENCES orders(id)  ON DELETE CASCADE,
  ticket_id INT REFERENCES tickets(id) ON DELETE CASCADE,
  CHECK (
    (order_id IS NOT NULL)::int + (ticket_id IS NOT NULL)::int = 1
  )
);

CREATE INDEX attachments_order_id_idx  ON attachments (order_id);
CREATE INDEX attachments_ticket_id_idx ON attachments (ticket_id);`}
            />
            <CodeBlock
              title="Shared supertype: one table everything can reference"
              language="sql"
              code={`-- Every commentable thing gets a row here first
CREATE TABLE commentables (
  id   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('post', 'ticket'))
);

CREATE TABLE posts (
  id BIGINT PRIMARY KEY REFERENCES commentables(id) ON DELETE CASCADE,
  title TEXT NOT NULL
);

CREATE TABLE tickets (
  id BIGINT PRIMARY KEY REFERENCES commentables(id) ON DELETE CASCADE,
  subject TEXT NOT NULL
);

-- One real foreign key, one cascade, no type column to get wrong
CREATE TABLE comments (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  commentable_id BIGINT NOT NULL REFERENCES commentables(id) ON DELETE CASCADE,
  body          TEXT NOT NULL
);`}
            />
            <CodeBlock
              title="Exclusive arc in Prisma"
              language="typescript"
              code={`model Attachment {
  id       BigInt  @id @default(autoincrement())
  fileUrl  String
  orderId  Int?
  ticketId Int?

  order  Order?  @relation(fields: [orderId],  references: [id], onDelete: Cascade)
  ticket Ticket? @relation(fields: [ticketId], references: [id], onDelete: Cascade)

  @@index([orderId])
  @@index([ticketId])
}

// Prisma cannot express the CHECK, so add it in a hand-written migration.`}
            />
            <p>
              Be fair about when polymorphism wins: a generic audit log or tagging system that must attach to twenty
              entity types would need twenty nullable columns, and there the loose pattern is a reasonable trade.
              Say that out loud, and say what you do about it — a scheduled job that finds orphans, and the type
              column stored as an enum rather than a free-text table name.
            </p>
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="How do you model a status history or audit table?"
          >
            <p>
              Keep the current value on the row, and append every change to a second table. The current status is
              what every query needs, so it should not require reading history; the history is append-only, which
              makes it cheap to write and safe to keep.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                One row per transition, with the old value, the new value, who did it, when, and why
              </li>
              <li>
                Append only. Never update or delete a history row, which is what makes it trustworthy
              </li>
              <li>
                Write the current value and the history row in the same transaction, or in a trigger so it cannot be
                skipped
              </li>
              <li>
                Index by the entity and time, because &quot;show me this order&apos;s timeline&quot; is the query
              </li>
              <li>
                Expect it to be your largest table. Plan partitioning by month and a retention policy from day one
              </li>
            </ul>
            <CodeBlock
              title="Status history"
              language="sql"
              code={`CREATE TABLE order_status_history (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id   BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status TEXT,                    -- NULL for the first row
  to_status   TEXT NOT NULL,
  changed_by  INT REFERENCES users(id),
  reason      TEXT,
  changed_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX order_status_history_order_idx
  ON order_status_history (order_id, changed_at DESC);

-- The timeline for one order
SELECT from_status, to_status, changed_at, reason
FROM order_status_history
WHERE order_id = $1
ORDER BY changed_at;

-- How long orders sat in each status
SELECT to_status,
       avg(lead(changed_at) OVER (PARTITION BY order_id ORDER BY changed_at) - changed_at)
FROM order_status_history
GROUP BY to_status;`}
            />
            <CodeBlock
              title="A trigger means no code path can skip it"
              language="sql"
              code={`CREATE OR REPLACE FUNCTION log_order_status() RETURNS trigger AS $fn$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO order_status_history (order_id, from_status, to_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status,
            nullif(current_setting('app.user_id', true), '')::int);
  END IF;
  RETURN NEW;
END;
$fn$ LANGUAGE plpgsql;

CREATE TRIGGER orders_status_history
AFTER UPDATE OF status ON orders
FOR EACH ROW EXECUTE FUNCTION log_order_status();`}
            />
            <p>
              For a general audit log across many tables, a single table with a JSONB payload is the pragmatic
              choice, because you cannot have a column per field of every entity. This is the one place the
              polymorphic pattern is normal, and a GIN index makes the payload searchable.
            </p>
            <CodeBlock
              title="Generic audit log"
              language="sql"
              code={`CREATE TABLE audit_log (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id   TEXT NOT NULL,
  action      TEXT NOT NULL,      -- created | updated | deleted
  actor_id    INT,
  changes     JSONB NOT NULL,     -- { "status": ["pending", "paid"] }
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
) PARTITION BY RANGE (created_at);

CREATE TABLE audit_log_2026_01 PARTITION OF audit_log
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE INDEX audit_log_entity_idx ON audit_log (entity_type, entity_id, created_at DESC);
CREATE INDEX audit_log_changes_gin ON audit_log USING GIN (changes);`}
            />
            <p>
              Partitioning is what makes retention cheap: dropping last year&apos;s data is{' '}
              <code>DROP TABLE audit_log_2025_01</code>, which is instant, instead of a{' '}
              <code>DELETE</code> of a hundred million rows that bloats the table.
            </p>
            <p>
              If you need not just the changes but the ability to query the whole row as it was at a point in time,
              that is a temporal or bitemporal table: the history holds a <code>valid_from</code> and{' '}
              <code>valid_to</code> range, and an exclusion constraint guarantees the ranges never overlap.
            </p>
            <CodeBlock
              title="Non-overlapping validity ranges"
              language="sql"
              code={`CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE price_history (
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  price      NUMERIC(12,2) NOT NULL,
  valid      TSTZRANGE NOT NULL,
  EXCLUDE USING gist (product_id WITH =, valid WITH &&)
);

-- The price that applied on a given day
SELECT price FROM price_history
WHERE product_id = $1 AND valid @> $2::timestamptz;`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="Soft delete or an archive table — how do you choose?"
          >
            <p>
              Both keep the data. The difference is where the deleted rows live, and therefore who has to remember
              about them.
            </p>
            <p>
              <strong>Soft delete</strong> leaves the row in the main table with a flag. Undelete is one{' '}
              <code>UPDATE</code>, and foreign keys keep working, which is why it wins when restoring is a real user
              feature. The price is that every query in the system must filter, uniqueness needs partial indexes, and
              the table keeps growing with rows nobody wants.
            </p>
            <p>
              <strong>An archive table</strong> moves the row out. The main table stays small and every query is
              naturally correct, because the deleted rows are not there to be found. The price is that the move is
              real work, the archive schema has to be kept in step, and foreign keys from the archive do not point
              anywhere useful.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Soft delete when:</strong> users can restore, the row is referenced by other live rows,
                deletes are rare, and admins need to see deleted items in the normal UI
              </li>
              <li>
                <strong>Archive when:</strong> the table is huge and mostly cold, deleted rows are never shown
                again, retention is driven by compliance, or the query cost of filtering is hurting you
              </li>
              <li>
                <strong>Neither, sometimes:</strong> if the real requirement is &quot;know what happened&quot;, an
                append-only event or audit table answers it without changing how the main table is queried
              </li>
            </ul>
            <CodeBlock
              title="Archive in one atomic statement"
              language="sql"
              code={`CREATE TABLE orders_archive (LIKE orders INCLUDING DEFAULTS);
ALTER TABLE orders_archive ADD COLUMN archived_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Move rows out and in, atomically, with a data-modifying CTE
WITH moved AS (
  DELETE FROM orders
  WHERE created_at < now() - interval '2 years'
  RETURNING *
)
INSERT INTO orders_archive
SELECT *, now() FROM moved;`}
            />
            <p>
              Note that the archive table deliberately has no foreign keys and no unique constraints beyond its own
              key. It is a record of the past, so it must accept rows whose parents have since been deleted.
            </p>
            <p>
              There is a third option worth knowing, because it often beats both: <strong>partitioning</strong> by
              time. Old rows sit in their own partition, so queries with a date filter never touch them, and
              expiring a period is a <code>DROP TABLE</code> rather than a migration of rows.
            </p>
            <CodeBlock
              title="Prisma: soft delete with an explicit escape hatch"
              language="typescript"
              code={`// Normal reads go through the extension and never see deleted rows
const posts = await db.post.findMany({ where: { authorId } });

// Admin restore uses the raw client on purpose
await prisma.post.update({
  where: { id },
  data: { deletedAt: null },
});

// A retention job hard-deletes what is past the promised window
await prisma.post.deleteMany({
  where: { deletedAt: { lt: new Date(Date.now() - 90 * 864e5) } },
});`}
            />
            <p>
              That last query matters legally as much as technically. If your privacy policy promises deletion after
              90 days, a soft delete alone does not keep the promise, so the retention job is part of the design and
              not an afterthought.
            </p>
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard
            level="Senior"
            question="How do you design a multi-tenant application in a single database?"
          >
            <p>
              There are three shapes, and the first question in an interview is which one and why.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Shared tables with a tenant_id column.</strong> One schema, one set of tables, a{' '}
                <code>tenant_id</code> on every tenant-owned row. Cheapest to run and to migrate, and the default
                for almost every SaaS product
              </li>
              <li>
                <strong>One schema per tenant.</strong> Strong isolation and easy per-tenant export, but migrations
                must run N times and connection and catalogue overhead grows. Painful past a few hundred tenants
              </li>
              <li>
                <strong>One database per tenant.</strong> The strongest isolation, sometimes required by contract,
                and by far the most operational work
              </li>
            </ul>
            <p>
              For the shared-table approach, the rules that keep it safe are not complicated, but every one of them
              has to hold everywhere.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <code>tenant_id</code> is <code>NOT NULL</code> on every tenant-owned table, with no default, so a
                forgotten value is an error rather than a leak
              </li>
              <li>
                It is the <em>first</em> column of essentially every index, because every query filters on it
              </li>
              <li>
                Every unique constraint is scoped to the tenant: <code>UNIQUE (tenant_id, email)</code>, not{' '}
                <code>UNIQUE (email)</code>. Getting this wrong means one customer&apos;s signup blocks
                another&apos;s
              </li>
              <li>
                The filter is applied in one place — a client extension or a repository layer — never typed by hand
                in each query
              </li>
              <li>
                Row-level security as a backstop, so a missing filter returns nothing instead of everything
              </li>
              <li>
                Watch the noisy neighbour: one huge tenant skews statistics and fills shared caches. Partitioning by
                tenant, or moving the largest tenants to their own database, is the usual escape
              </li>
            </ul>
            <CodeBlock
              title="Tenant-scoped tables and indexes"
              language="sql"
              code={`CREATE TABLE projects (
  id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id BIGINT NOT NULL REFERENCES tenants(id),
  name      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)              -- scoped, not global
);

-- tenant_id leads every index, because every query filters on it
CREATE INDEX projects_tenant_created_idx ON projects (tenant_id, created_at DESC);`}
            />
            <CodeBlock
              title="Row-level security as the backstop"
              language="sql"
              code={`ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects FORCE ROW LEVEL SECURITY;

CREATE POLICY projects_tenant ON projects
  USING (tenant_id = current_setting('app.tenant_id', true)::bigint)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::bigint);

-- Set per transaction; SET LOCAL resets automatically at commit
BEGIN;
SET LOCAL app.tenant_id = '42';
SELECT * FROM projects;    -- only tenant 42's rows, filter or no filter
COMMIT;`}
            />
            <p>
              The <code>WITH CHECK</code> half is the part people forget: without it the policy filters reads but
              still lets a write insert a row belonging to another tenant.
            </p>
            <CodeBlock
              title="Prisma: scope every query in one place"
              language="typescript"
              code={`export function forTenant(tenantId: bigint) {
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          if (args && typeof args === 'object') {
            if ('where' in args) args.where = { tenantId, ...args.where };
            if ('data'  in args && !Array.isArray(args.data)) {
              args.data = { tenantId, ...args.data };
            }
          }
          return query(args);
        },
      },
    },
  });
}

// One scoped client per request, built from the verified session
const db = forTenant(session.tenantId);`}
            />
            <p>
              Say what you would monitor, because that is what separates experience from theory: rows per tenant, so
              you see a noisy neighbour coming; and a periodic check that every tenant-owned table really has a{' '}
              <code>NOT NULL tenant_id</code> and a tenant-leading index, because the table someone adds next month
              is the one that leaks.
            </p>
            <CodeBlock
              title="Find tables that forgot the rules"
              language="sql"
              code={`-- Tenant-owned tables where tenant_id is nullable
SELECT c.relname
FROM pg_attribute a
JOIN pg_class c ON c.oid = a.attrelid
WHERE a.attname = 'tenant_id' AND NOT a.attnotnull AND c.relkind = 'r';

-- Tables with a tenant_id but no index that starts with it
SELECT c.relname
FROM pg_class c
JOIN pg_attribute a ON a.attrelid = c.oid AND a.attname = 'tenant_id'
WHERE c.relkind = 'r'
  AND NOT EXISTS (
    SELECT 1 FROM pg_index i
    WHERE i.indrelid = c.oid AND i.indkey[0] = a.attnum
  );`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Senior"
            question="How do composite foreign keys give you tenant isolation?"
          >
            <p>
              A plain <code>tenant_id</code> column tells you which tenant owns a row. It does not stop a row in one
              tenant pointing at a row in another. If <code>tasks.project_id</code> references{' '}
              <code>projects(id)</code> and nothing more, then a bug that writes the wrong project id creates a task
              that belongs to tenant A and lives in tenant B&apos;s project. The database is happy; your isolation is
              gone.
            </p>
            <p>
              The fix is to make the tenant part of the key on both sides. If the parent&apos;s key is{' '}
              <code>(tenant_id, id)</code> and the child references it using the child&apos;s <em>own</em>{' '}
              <code>tenant_id</code> column, a cross-tenant reference cannot be written down. It is not forbidden; it
              is unrepresentable.
            </p>
            <CodeBlock
              title="The same column serves two jobs"
              language="sql"
              code={`CREATE TABLE projects (
  tenant_id BIGINT NOT NULL REFERENCES tenants(id),
  id        BIGINT GENERATED BY DEFAULT AS IDENTITY,
  name      TEXT NOT NULL,
  PRIMARY KEY (tenant_id, id)
);

CREATE TABLE tasks (
  tenant_id  BIGINT NOT NULL REFERENCES tenants(id),
  id         BIGINT GENERATED BY DEFAULT AS IDENTITY,
  project_id BIGINT NOT NULL,
  title      TEXT NOT NULL,
  PRIMARY KEY (tenant_id, id),
  FOREIGN KEY (tenant_id, project_id)
    REFERENCES projects (tenant_id, id)
    ON DELETE CASCADE
);

-- A task in tenant 1 can only reference a project whose tenant_id is also 1,
-- because the SAME tenant_id column is used for both the row and the reference.
CREATE INDEX tasks_tenant_project_idx ON tasks (tenant_id, project_id);`}
            />
            <p>
              The bonus is that the tenant column is now the leading column of the primary key, so it is the leading
              column of an index on every table by construction, which is exactly what you wanted anyway.
            </p>
            <p>
              Now the costs, because this is a senior question and the trade-offs are the answer:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Every foreign key becomes two columns, so joins and indexes are wider and the schema is noisier
              </li>
              <li>
                Ids are only unique within a tenant, so every lookup needs both values. An API route with just an id
                no longer identifies a row, which is arguably a feature
              </li>
              <li>
                Retrofitting this onto an existing schema is a large migration, because every primary key and every
                foreign key changes
              </li>
              <li>
                In Prisma you need <code>@@id([tenantId, id])</code> and multi-field{' '}
                <code>references</code>, and relations become slightly clumsier to write
              </li>
            </ul>
            <CodeBlock
              title="Composite keys in Prisma"
              language="typescript"
              code={`model Project {
  tenantId BigInt
  id       BigInt @default(autoincrement())
  name     String
  tasks    Task[]

  @@id([tenantId, id])
  @@unique([tenantId, name])
}

model Task {
  tenantId  BigInt
  id        BigInt @default(autoincrement())
  projectId BigInt
  title     String

  project Project @relation(
    fields: [tenantId, projectId],
    references: [tenantId, id],
    onDelete: Cascade
  )

  @@id([tenantId, id])
  @@index([tenantId, projectId])
}`}
            />
            <CodeBlock
              title="Querying with a composite key"
              language="typescript"
              code={`// Both parts are required, so a wrong tenant simply finds nothing
const task = await prisma.task.findUnique({
  where: { tenantId_id: { tenantId, id } },
  select: { id: true, title: true, project: { select: { name: true } } },
});`}
            />
            <p>
              A lighter-weight version if a full migration is out of reach: keep single-column keys and add a{' '}
              <code>CHECK</code> enforced by a trigger, or add a redundant composite unique key on the parent and a
              composite foreign key only on the two or three relations that matter most. Partial protection on the
              dangerous edges beats a perfect design nobody has time to ship.
            </p>
          </InterviewQACard>

          <InterviewQACard
            level="Senior"
            question="Implicit vs explicit many-to-many in Prisma — how do you decide in production?"
          >
            <p>
              An <strong>implicit</strong> many-to-many is two list fields and no join model: Prisma creates and owns
              the join table, names it <code>_StudentToCourse</code>, and hides it from you. An{' '}
              <strong>explicit</strong> one is a model you write yourself.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Implicit:</strong> fine for simple tags and roles with no extra data. Less schema to write,
                and <code>connect</code> and <code>disconnect</code> read nicely
              </li>
              <li>
                <strong>Explicit:</strong> required as soon as the relationship has attributes, needs its own
                indexes, needs a timestamp, or must be queried as a first-class thing
              </li>
              <li>
                Teams often start implicit and move to explicit when the product needs metadata. Plan for that
                migration early if it looks likely
              </li>
            </ul>
            <p>
              The decisive argument in production is usually not features but control. The implicit join table is
              invisible in your schema file, so you cannot add a column, cannot add an index beyond the two Prisma
              creates, and cannot query it directly with the typed client. You also cannot easily write raw SQL
              against a table whose name starts with an underscore without quoting it, and its exact shape is an
              implementation detail that is not yours to rely on.
            </p>
            <CodeBlock
              title="Implicit: shortest possible"
              language="typescript"
              code={`model Post {
  id   Int    @id @default(autoincrement())
  tags Tag[]
}

model Tag {
  id    Int    @id @default(autoincrement())
  name  String @unique
  posts Post[]
}

// Prisma creates _PostToTag(A, B) behind the scenes`}
            />
            <CodeBlock
              title="Connect and disconnect, the implicit convenience"
              language="typescript"
              code={`await prisma.post.update({
  where: { id: postId },
  data: {
    tags: {
      connect: [{ name: 'postgres' }],
      disconnect: [{ name: 'draft' }],
    },
  },
});`}
            />
            <CodeBlock
              title="Explicit: when the link has its own facts"
              language="typescript"
              code={`model Enrollment {
  studentId  Int
  courseId   Int
  grade      String?
  enrolledAt DateTime @default(now())

  student Student @relation(fields: [studentId], references: [id], onDelete: Cascade)
  course  Course  @relation(fields: [courseId],  references: [id], onDelete: Cascade)

  @@id([studentId, courseId])
  @@index([courseId])
}`}
            />
            <CodeBlock
              title="Explicit join model queries"
              language="typescript"
              code={`await prisma.enrollment.create({
  data: { studentId: 1, courseId: 9, grade: null },
});

const roster = await prisma.enrollment.findMany({
  where: { courseId: 9 },
  select: {
    grade: true,
    enrolledAt: true,
    student: { select: { id: true, name: true } },
  },
});`}
            />
            <p>
              The migration from implicit to explicit is worth being able to describe, because it is the real risk
              you are weighing. You declare a model that maps to the existing table with{' '}
              <code>@@map</code> and the same column names, which makes it a no-op at the database level, then add
              your new columns and indexes in normal migrations afterwards. Check the generated SQL carefully: if the
              mapping is even slightly off, Migrate proposes to drop the table and create a new one, which deletes
              every link.
            </p>
            <CodeBlock
              title="Adopting the existing implicit table"
              language="typescript"
              code={`// Map onto the table Prisma already created, so nothing is rebuilt
model PostTag {
  postId Int @map("A")
  tagId  Int @map("B")

  post Post @relation(fields: [postId], references: [id], onDelete: Cascade)
  tag  Tag  @relation(fields: [tagId],  references: [id], onDelete: Cascade)

  @@id([postId, tagId])
  @@index([tagId])
  @@map("_PostToTag")
}`}
            />
            <p>
              My default recommendation, and a reasonable thing to say in an interview: use implicit only for
              genuinely attribute-free links such as tags, and write the join model explicitly whenever the
              relationship has a name in the business language. If someone says &quot;enrolment&quot; or
              &quot;membership&quot; rather than &quot;the link between&quot;, it is an entity, and entities should
              be visible in the schema.
            </p>
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

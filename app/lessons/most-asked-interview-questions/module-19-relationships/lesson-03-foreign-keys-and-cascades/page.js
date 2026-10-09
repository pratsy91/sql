import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 3: Foreign Keys and Cascades - Module 19 - Most Asked Interview Questions',
  description:
    'Most asked foreign key interview questions: what a foreign key enforces, why you must index the child column yourself, ON DELETE CASCADE vs SET NULL vs RESTRICT vs NO ACTION, deleting a parent with children in one transaction, database versus application integrity, cascade choices for multi-tenant SaaS, and referential actions that fight soft deletes.',
};

export default function M19L3ForeignKeysAndCascades() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 3: Foreign Keys and Cascades</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          A foreign key is the database promising that a link points at something real. This lesson covers what that
          promise costs, what happens to children when the parent is deleted, and why the choice is a product
          decision rather than a technical one.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="What is a foreign key, and why do we use it?">
            <p>
              A foreign key is a rule: a child column, such as <code>orders.customer_id</code>, must match a real
              parent row, or be NULL. The database enforces this, not only your application.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Stops orphan rows, such as an order whose customer does not exist</li>
              <li>Makes the link obvious to people reading the schema, and to tools like Prisma</li>
              <li>Lets you choose what happens on delete: cascade, set null, or block the delete</li>
              <li>
                Gives the query planner information, because it knows a join cannot lose or duplicate rows
              </li>
            </ul>
            <p>
              The part people underestimate: the guarantee holds no matter what writes to the database. A
              background job, a data fix someone ran in psql at midnight, a second service, a bad migration — none
              of them can create an orphan. Application-level checks only protect the code path that contains the
              check.
            </p>
            <CodeBlock
              title="What it blocks"
              language="sql"
              code={`CREATE TABLE orders (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id INT NOT NULL REFERENCES customers(id),
  total       NUMERIC(12,2) NOT NULL
);

-- ERROR: insert or update on table "orders" violates foreign key constraint
INSERT INTO orders (customer_id, total) VALUES (999999, 10.00);

-- ERROR: update or delete on table "customers" violates foreign key constraint
DELETE FROM customers WHERE id = 7;   -- when order rows still point at 7`}
            />
            <CodeBlock
              title="Prisma relation with a foreign key"
              language="typescript"
              code={`model Order {
  id         Int      @id @default(autoincrement())
  customerId Int
  customer   Customer @relation(fields: [customerId], references: [id])

  @@index([customerId])
}

model Customer {
  id     Int     @id @default(autoincrement())
  orders Order[]
}`}
            />
            <p>
              The costs, so your answer is balanced: every insert into the child takes a shared lock on the parent
              row to check it still exists, every parent delete has to look in the child table, and bulk loads are
              slower. Large data-warehouse loads sometimes drop constraints, load, then re-add them. For normal
              application tables the safety is worth far more than the cost.
            </p>
          </InterviewQACard>

          <InterviewQACard
            level="Junior"
            question="Should you index the foreign key column?"
          >
            <p>
              Almost always yes, and you have to do it yourself. PostgreSQL creates an index on the{' '}
              <em>parent</em> side, because the referenced column must be a primary key or unique. The child column
              gets no index at all.
            </p>
            <p>There are three separate reasons, and the second one is the one people forget:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Queries that read children by parent, such as <code>WHERE order_id = 5</code>, and joins from child
                to parent
              </li>
              <li>
                <strong>Deleting or updating a parent row.</strong> PostgreSQL must check whether any child
                references it. With no index that is a sequential scan of the child table, once per parent row
                deleted, while holding locks. This is how a one-row delete becomes a thirty-second outage
              </li>
              <li>
                <code>ON DELETE CASCADE</code> and <code>SET NULL</code> have the same problem, multiplied down the
                depth of the tree
              </li>
            </ul>
            <CodeBlock
              title="Add it every time"
              language="sql"
              code={`CREATE TABLE order_items (
  id       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  sku      TEXT NOT NULL
);

-- Not created automatically
CREATE INDEX order_items_order_id_idx ON order_items (order_id);`}
            />
            <p>The exceptions are real but narrow:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                A one-to-one relation where the column is already <code>UNIQUE</code> — the unique constraint is an
                index
              </li>
              <li>
                A junction table whose composite primary key starts with that column — it is already the leading
                column of an index
              </li>
              <li>
                A tiny lookup parent that is never deleted and never joined from, such as a currency codes table
              </li>
            </ul>
            <p>
              Often the better answer is not a single-column index but a composite one that starts with the foreign
              key, because that serves the real query too.
            </p>
            <CodeBlock
              title="One composite index instead of two"
              language="sql"
              code={`-- Serves "items for this order" AND "items for this order, newest first"
CREATE INDEX order_items_order_created_idx
  ON order_items (order_id, created_at DESC);

-- So a plain index on (order_id) would now be redundant.`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard
            level="Mid"
            question="Explain ON DELETE CASCADE, SET NULL, RESTRICT, and NO ACTION."
          >
            <p>
              These are the <strong>referential actions</strong>: what the database does to child rows when the
              parent is deleted or its key is updated.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>CASCADE</strong> — deleting the parent deletes the dependent children
              </li>
              <li>
                <strong>SET NULL</strong> — the child foreign key is set to NULL, so the column must be nullable
              </li>
              <li>
                <strong>RESTRICT</strong> — rejects the delete if children exist, checked immediately
              </li>
              <li>
                <strong>NO ACTION</strong> — the default, and behaves like RESTRICT in most cases. The difference is
                timing: NO ACTION can be deferred to the end of the transaction if the constraint is declared{' '}
                <code>DEFERRABLE</code>, while RESTRICT never defers
              </li>
              <li>
                <strong>SET DEFAULT</strong> — less common; sets the child key to the column default, which must
                itself be a valid parent
              </li>
            </ul>
            <p>
              That NO ACTION subtlety is worth understanding rather than memorising. With a deferrable NO ACTION you
              can delete the parent and then re-point the children inside the same transaction, and the check at
              commit passes. RESTRICT would have failed at the moment of the delete.
            </p>
            <CodeBlock
              title="SQL cascade options"
              language="sql"
              code={`ALTER TABLE orders
  ADD CONSTRAINT orders_customer_id_fkey
  FOREIGN KEY (customer_id) REFERENCES customers(id)
  ON DELETE RESTRICT;

ALTER TABLE posts
  ADD CONSTRAINT posts_author_id_fkey
  FOREIGN KEY (author_id) REFERENCES users(id)
  ON DELETE CASCADE;

ALTER TABLE comments
  ADD CONSTRAINT comments_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id)
  ON DELETE SET NULL;

-- Deferred check: allowed to be temporarily broken inside a transaction
ALTER TABLE invoices
  ADD CONSTRAINT invoices_order_id_fkey
  FOREIGN KEY (order_id) REFERENCES orders(id)
  DEFERRABLE INITIALLY DEFERRED;`}
            />
            <CodeBlock
              title="Prisma onDelete"
              language="typescript"
              code={`model Post {
  id       Int  @id @default(autoincrement())
  authorId Int
  author   User @relation(fields: [authorId], references: [id], onDelete: Cascade)
}

model Order {
  id         Int      @id @default(autoincrement())
  customerId Int
  customer   Customer @relation(fields: [customerId], references: [id], onDelete: Restrict)
}

model Comment {
  id     Int   @id @default(autoincrement())
  userId Int?
  user   User? @relation(fields: [userId], references: [id], onDelete: SetNull)
}`}
            />
            <p>
              How to choose, in one line each. Use <strong>CASCADE</strong> when the child is part of the parent and
              is meaningless without it: order items, comments on a post, images on a product. Use{' '}
              <strong>SET NULL</strong> when the child survives the parent: an anonymous comment, a task whose
              assignee left. Use <strong>RESTRICT</strong> when losing the child would be a disaster: anything to do
              with invoices, payments or audit records. Then the delete fails loudly and a human decides.
            </p>
            <p>
              Two warnings. CASCADE is recursive, so deleting one tenant can delete millions of rows in one
              transaction; that is a long lock and an enormous write-ahead log burst. And Prisma also knows about a
              separate <code>onUpdate</code> action, which matters far less in practice because primary keys should
              never change.
            </p>
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="How do you delete a parent with children in one transaction?"
          >
            <p>
              If the constraint is RESTRICT or NO ACTION, you delete from the bottom of the tree upwards, all inside
              one transaction so the database is never half-deleted.
            </p>
            <CodeBlock
              title="Children first, then the parent"
              language="sql"
              code={`BEGIN;
DELETE FROM order_item_taxes
 WHERE order_item_id IN (SELECT id FROM order_items WHERE order_id = $1);
DELETE FROM order_items WHERE order_id = $1;
DELETE FROM orders     WHERE id = $1;
COMMIT;`}
            />
            <CodeBlock
              title="Prisma, same order"
              language="typescript"
              code={`await prisma.$transaction(async (tx) => {
  await tx.orderItem.deleteMany({ where: { orderId } });
  await tx.order.delete({ where: { id: orderId } });
});`}
            />
            <p>
              Two things make this safer. First, lock the parent before you start, so another request cannot add a
              child between your delete of the children and your delete of the parent. Second, delete rows in a
              consistent order across your whole codebase, because two transactions deleting the same rows in
              opposite orders is the standard recipe for a deadlock.
            </p>
            <CodeBlock
              title="Lock the parent first to close the race"
              language="sql"
              code={`BEGIN;
SELECT id FROM orders WHERE id = $1 FOR UPDATE;   -- blocks concurrent writers
DELETE FROM order_items WHERE order_id = $1;
DELETE FROM orders WHERE id = $1;
COMMIT;`}
            />
            <p>
              One statement can do the whole thing, which removes the race entirely. A data-modifying CTE deletes
              the children and the parent in a single atomic statement.
            </p>
            <CodeBlock
              title="One statement with a data-modifying CTE"
              language="sql"
              code={`WITH removed_items AS (
  DELETE FROM order_items WHERE order_id = $1 RETURNING id
)
DELETE FROM orders WHERE id = $1;`}
            />
            <p>
              For a big tree, prefer <code>ON DELETE CASCADE</code> and let the database do it: one statement, right
              order guaranteed, and it cannot forget a table someone added last week. The counter-argument is that
              an accidental cascade is silent and unrecoverable, which is why many teams use RESTRICT on the
              dangerous top-level edges and CASCADE below them.
            </p>
            <p>
              Also mind the size. Deleting a parent with two million children is one enormous transaction. Deleting
              the children in batches first, then the parent, keeps locks short and lets vacuum keep up.
            </p>
            <CodeBlock
              title="Batch the children before deleting the parent"
              language="sql"
              code={`-- Repeat until zero rows are affected
DELETE FROM order_items
WHERE id IN (SELECT id FROM order_items WHERE order_id = $1 LIMIT 10000);`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="Database-level versus application-level integrity — which and why?"
          >
            <p>
              Both, with the database as the last line of defence. They are not competing options; they protect
              against different things.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>The database</strong> is the only place a rule cannot be bypassed. It applies to every
                writer: your app, a second service, a migration, a support engineer in psql, a restored backup
              </li>
              <li>
                <strong>The application</strong> gives good error messages, can express rules SQL cannot, and can
                check things before the user submits a form
              </li>
              <li>
                A check in application code alone is a check that holds &quot;until someone writes a second code
                path&quot;, which always happens
              </li>
            </ul>
            <p>
              The killer argument is concurrency. An application-level check is read-then-write, and two requests
              can both read &quot;no such email&quot; and both insert. Only a unique constraint stops that, because
              only the database can make the check and the write atomic.
            </p>
            <CodeBlock
              title="The race an application check cannot win"
              language="typescript"
              code={`// BROKEN under concurrency: two requests can both pass the check
const existing = await prisma.user.findUnique({ where: { email } });
if (existing) throw new Error('taken');
await prisma.user.create({ data: { email } });

// CORRECT: let the constraint decide, then translate the error
try {
  await prisma.user.create({ data: { email } });
} catch (e) {
  if (e.code === 'P2002') throw new Error('That email is already registered');
  throw e;
}`}
            />
            <p>
              That is the pattern to describe: enforce in the database, translate in the application. Prisma gives
              you specific error codes — <code>P2002</code> for a unique violation,{' '}
              <code>P2003</code> for a foreign key violation, <code>P2025</code> for a missing record — so you can
              produce a friendly message without duplicating the rule.
            </p>
            <p>
              The one situation where people genuinely turn database integrity off is worth naming, because
              interviewers ask about it. Prisma&apos;s <code>relationMode = &quot;prisma&quot;</code> emulates
              relations in the client instead of creating real constraints, which is needed for databases such as
              PlanetScale that do not support foreign keys. You get no real cascades, and integrity is only as good
              as your code. Choose it because your platform forces you to, not because it is convenient.
            </p>
            <CodeBlock
              title="Rules that belong in the database"
              language="sql"
              code={`-- Identity and uniqueness
ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);

-- Relationships
ALTER TABLE orders ADD CONSTRAINT orders_customer_id_fkey
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT;

-- Simple invariants
ALTER TABLE order_items ADD CONSTRAINT order_items_qty_check CHECK (qty > 0);

-- Ranges that must not overlap, which application code gets wrong constantly
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE bookings ADD CONSTRAINT bookings_no_overlap
  EXCLUDE USING gist (room_id WITH =, during WITH &&);`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard
            level="Senior"
            question="How do you choose cascade behaviour for a SaaS multi-tenant schema?"
          >
            <p>
              Work outwards from the tenant. The question is really &quot;what must survive a tenant being
              deleted&quot;, and that is a legal and product question before it is a schema question.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Tenant root delete: usually CASCADE through owned data (projects, then tasks, then comments),{' '}
                <em>or</em> soft-delete the tenant and purge in the background
              </li>
              <li>
                Cross-tenant references must be impossible. Composite foreign keys on{' '}
                <code>(tenant_id, id)</code> make them unrepresentable rather than merely discouraged
              </li>
              <li>
                Billing, invoices and audit tables are usually RESTRICT, or soft-deleted with a retention period,
                because you must still be able to answer questions about a customer who left
              </li>
              <li>
                Prefer explicit RESTRICT on destructive edges while a product is young. An accidental mass delete
                that the database refused is a bug report; one that the database performed is a restore from backup
              </li>
              <li>
                Never run a tenant purge as one transaction. Millions of cascaded deletes hold locks for minutes,
                bloat tables and spike replication lag
              </li>
            </ul>
            <CodeBlock
              title="Composite foreign key for tenant safety"
              language="sql"
              code={`CREATE TABLE projects (
  tenant_id INT NOT NULL,
  id        INT GENERATED BY DEFAULT AS IDENTITY,
  name      TEXT NOT NULL,
  PRIMARY KEY (tenant_id, id)
);

CREATE TABLE tasks (
  tenant_id  INT NOT NULL,
  id         INT GENERATED BY DEFAULT AS IDENTITY,
  project_id INT NOT NULL,
  PRIMARY KEY (tenant_id, id),
  FOREIGN KEY (tenant_id, project_id)
    REFERENCES projects (tenant_id, id)
    ON DELETE CASCADE
);

-- A task cannot reference a project in another tenant:
-- the tenant_id in the key is the same column used for the row itself.`}
            />
            <CodeBlock
              title="Soft-delete the tenant, purge in batches"
              language="sql"
              code={`-- Immediate: the tenant disappears from the product
UPDATE tenants SET deleted_at = now() WHERE id = $1;

-- Later, a job walks the tree bottom-up in small batches
DELETE FROM comments
WHERE id IN (SELECT id FROM comments WHERE tenant_id = $1 LIMIT 10000);`}
            />
            <p>
              The strongest version of tenant isolation is row-level security, where the database itself refuses to
              return another tenant&apos;s rows even if a query forgets the filter. Prisma does not manage those
              policies, so you write them in SQL migrations and set the tenant per connection.
            </p>
            <CodeBlock
              title="Row-level security as a backstop"
              language="sql"
              code={`ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY projects_tenant_isolation ON projects
  USING (tenant_id = current_setting('app.tenant_id', true)::int);

-- The application sets this at the start of each transaction
SET LOCAL app.tenant_id = '42';`}
            />
            <p>
              Say the trade-off: composite keys make every relation two columns wide, which Prisma supports but
              which makes the models noisier, and row-level security adds a per-query cost plus real operational
              complexity. For a small product a single <code>tenant_id</code> column enforced by a Prisma client
              extension is a reasonable stage; the composite keys and policies come when the blast radius of a
              mistake justifies them.
            </p>
          </InterviewQACard>

          <InterviewQACard
            level="Senior"
            question="Which referential actions interact badly with soft deletes or ORMs?"
          >
            <p>
              The root problem is that the database has no idea what a soft delete is. To PostgreSQL, a row with{' '}
              <code>deleted_at</code> set is an ordinary live row, so constraints and cascades ignore your
              convention completely.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                A real <code>ON DELETE CASCADE</code> bypasses soft deletes entirely. The moment anything hard
                deletes a parent, children vanish for good, and your &quot;we never lose data&quot; promise is gone
              </li>
              <li>
                Soft-deleted parents still block a unique email or slug, because the row is still there. Users
                cannot re-register with an address they &quot;deleted&quot;
              </li>
              <li>
                Soft-deleted parents still satisfy foreign keys, so children can keep referencing a parent your
                application considers gone — and new children can still be created under it
              </li>
              <li>
                Prisma <code>onDelete</code> only becomes a real constraint when Migrate creates it. A schema edited
                without a migration, or a database created with <code>db push</code> at some point, leaves the file
                and the database disagreeing. That mismatch is a classic footgun
              </li>
              <li>
                With <code>relationMode = &quot;prisma&quot;</code> there are no database constraints at all, so no
                cascades happen and the client must delete dependents itself
              </li>
              <li>
                Cascades are invisible to ORM middleware. A row removed by a database cascade fires no Prisma
                hook, so your audit log and your cache never hear about it
              </li>
            </ul>
            <p>
              The fixes are specific. Use a partial unique index so the constraint only applies to live rows. Use a
              validation trigger so a child cannot be attached to a soft-deleted parent. And enforce the read filter
              in one place, not in every query.
            </p>
            <CodeBlock
              title="Partial unique index: uniqueness among live rows only"
              language="sql"
              code={`DROP INDEX IF EXISTS users_email_key;

CREATE UNIQUE INDEX users_email_live_key
  ON users (email) WHERE deleted_at IS NULL;

-- Now a deleted account frees its email, and two live accounts still cannot share one.`}
            />
            <CodeBlock
              title="Block new children under a soft-deleted parent"
              language="sql"
              code={`CREATE OR REPLACE FUNCTION assert_parent_live() RETURNS trigger AS $fn$
BEGIN
  IF EXISTS (
    SELECT 1 FROM posts
    WHERE id = NEW.post_id AND deleted_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'cannot comment on a deleted post';
  END IF;
  RETURN NEW;
END;
$fn$ LANGUAGE plpgsql;

CREATE TRIGGER comments_parent_live
BEFORE INSERT ON comments
FOR EACH ROW EXECUTE FUNCTION assert_parent_live();`}
            />
            <CodeBlock
              title="Soft delete the whole subtree yourself, since no cascade will"
              language="typescript"
              code={`await prisma.$transaction(async (tx) => {
  const now = new Date();
  await tx.comment.updateMany({ where: { postId }, data: { deletedAt: now } });
  await tx.post.update({ where: { id: postId }, data: { deletedAt: now } });
});`}
            />
            <CodeBlock
              title="Verify what the database actually does"
              language="sql"
              code={`SELECT conname, confdeltype, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE contype = 'f' AND conrelid = 'orders'::regclass;
-- confdeltype: a = no action, r = restrict, c = cascade,
--              n = set null, d = set default`}
            />
            <p>
              The honest senior conclusion: soft delete is a real feature with real costs, and it should be a
              deliberate choice for the few tables that need it, not a default applied to every table. Where the
              actual requirement is &quot;keep a record of what happened&quot;, an append-only history table or an
              archive table is simpler and does not poison every query in the system.
            </p>
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

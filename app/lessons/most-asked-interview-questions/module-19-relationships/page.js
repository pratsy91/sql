import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';
import InterviewQACard from '../../../components/InterviewQACard';

export const metadata = {
  title: 'Module 19: Database Relationships & Schema Design - Most Asked Interview Questions',
  description:
    'Most asked interview questions on database relationships and schema design: 1:1, 1:N, M:N, FK cascades, self-references, junction tables, polymorphism pitfalls, and Prisma onDelete — Junior to Senior.',
};

export default function Module19Relationships() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Module 19: Database Relationships & Schema Design</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Most asked interview questions for Phase 19 — Junior → Senior. Cardinality, foreign keys and
          cascades, self-referencing trees, junction tables, polymorphic pitfalls, ERD thinking, and Prisma
          relation APIs.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard
            level="Junior"
            question="Explain one-to-one, one-to-many, and many-to-many relationships."
          >
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>1:1</strong> — each row in A relates to at most one in B (User ↔ Profile). Implement
                with a unique FK on one side.
              </li>
              <li>
                <strong>1:N</strong> — one parent, many children (Customer → Orders). FK on the child table.
              </li>
              <li>
                <strong>M:N</strong> — both sides can relate to many (Students ↔ Courses). Needs a junction /
                join table (or Prisma implicit M:N).
              </li>
            </ul>
            <CodeBlock
              title="SQL shapes"
              language="sql"
              code={`-- 1:1
CREATE TABLE profiles (
  user_id INT PRIMARY KEY REFERENCES users(id),
  bio text
);

-- 1:N
CREATE TABLE orders (
  id BIGSERIAL PRIMARY KEY,
  customer_id INT NOT NULL REFERENCES customers(id),
  total NUMERIC(12,2)
);

-- M:N
CREATE TABLE enrollment (
  student_id INT REFERENCES students(id),
  course_id  INT REFERENCES courses(id),
  PRIMARY KEY (student_id, course_id)
);`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Junior"
            question="What is a foreign key, and why do we use it?"
          >
            <p>
              A foreign key is a constraint that values in a child column must exist in a parent key (or be
              NULL). It enforces referential integrity in the database — not only in application code.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Prevents orphan rows (orders pointing at missing customers)</li>
              <li>Documents relationships for humans and ORMs</li>
              <li>Enables cascade / restrict behaviors on delete/update</li>
            </ul>
            <CodeBlock
              title="Prisma relation with FK"
              language="typescript"
              code={`model Order {
  id         Int      @id @default(autoincrement())
  customerId Int
  customer   Customer @relation(fields: [customerId], references: [id])
}

model Customer {
  id     Int     @id @default(autoincrement())
  orders Order[]
}`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Junior"
            question="What is a junction (associative) table?"
          >
            <p>
              A junction table stores pairs of keys to implement M:N. Add payload columns when the
              relationship itself has data (role, quantity, assigned_at).
            </p>
            <CodeBlock
              title="Junction with payload"
              language="sql"
              code={`CREATE TABLE product_tag (
  product_id INT REFERENCES products(id) ON DELETE CASCADE,
  tag_id     INT REFERENCES tags(id) ON DELETE CASCADE,
  tagged_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (product_id, tag_id)
);`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Junior"
            question="How do you think about an ERD before writing SQL or Prisma schema?"
          >
            <ul className="list-disc pl-6 space-y-1">
              <li>List entities (nouns) and relationships (verbs) from the domain</li>
              <li>Decide cardinality (1:1 / 1:N / M:N) and optionality (must / may)</li>
              <li>Choose primary keys; place foreign keys on the “many” or dependent side</li>
              <li>Normalize to reduce duplication, then note intentional denormalizations</li>
              <li>Translate boxes/lines into <code>CREATE TABLE</code> or Prisma <code>model</code>s</li>
            </ul>
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard
            level="Mid"
            question="Explain ON DELETE CASCADE, SET NULL, RESTRICT, and NO ACTION."
          >
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>CASCADE</strong> — deleting parent deletes dependent children
              </li>
              <li>
                <strong>SET NULL</strong> — child FK set to NULL (column must be nullable)
              </li>
              <li>
                <strong>RESTRICT</strong> — reject delete if children exist (immediate check)
              </li>
              <li>
                <strong>NO ACTION</strong> — similar to RESTRICT in Postgres for most cases; check can defer
                to end of transaction if constraint is deferrable
              </li>
              <li>
                <strong>SET DEFAULT</strong> — less common; sets FK to column default
              </li>
            </ul>
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
  ON DELETE SET NULL;`}
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
  id         Int       @id @default(autoincrement())
  customerId Int
  customer   Customer  @relation(fields: [customerId], references: [id], onDelete: Restrict)
}

model Comment {
  id     Int   @id @default(autoincrement())
  userId Int?
  user   User? @relation(fields: [userId], references: [id], onDelete: SetNull)
}`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="How do you model a self-referencing relationship (manager / employee)?"
          >
            <p>
              The classic pattern is an adjacency list: a nullable <code>manager_id</code> FK pointing at the
              same table.
            </p>
            <CodeBlock
              title="Adjacency list SQL + Prisma"
              language="sql"
              code={`CREATE TABLE employees (
  id SERIAL PRIMARY KEY,
  name text NOT NULL,
  manager_id INT REFERENCES employees(id) ON DELETE SET NULL
);

-- Direct reports
SELECT * FROM employees WHERE manager_id = 10;

-- Hierarchy with recursive CTE
WITH RECURSIVE tree AS (
  SELECT id, name, manager_id, 1 AS depth
  FROM employees WHERE id = 1
  UNION ALL
  SELECT e.id, e.name, e.manager_id, t.depth + 1
  FROM employees e
  JOIN tree t ON e.manager_id = t.id
)
SELECT * FROM tree;`}
            />
            <CodeBlock
              title="Prisma self-relation"
              language="typescript"
              code={`model Employee {
  id        Int        @id @default(autoincrement())
  name      String
  managerId Int?
  manager   Employee?  @relation("OrgChart", fields: [managerId], references: [id])
  reports   Employee[] @relation("OrgChart")
}`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="Adjacency list vs closure table vs ltree — when do you use each?"
          >
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Adjacency list:</strong> simple writes; reads of deep trees need recursive CTEs —
                default for org charts / comments
              </li>
              <li>
                <strong>Closure table:</strong> stores all ancestor–descendant pairs — fast subtree queries,
                more write complexity
              </li>
              <li>
                <strong>
                  <code>ltree</code>
                </strong>{' '}
                (Postgres extension): path labels like <code>Root.Engineering.Backend</code> with GiST
                operators — excellent for category trees
              </li>
            </ul>
            <CodeBlock
              title="ltree sketch"
              language="sql"
              code={`CREATE EXTENSION IF NOT EXISTS ltree;

CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name text NOT NULL,
  path ltree NOT NULL
);
CREATE INDEX categories_path_gist ON categories USING GIST (path);

-- Descendants of Engineering
SELECT * FROM categories WHERE path <@ 'Root.Engineering';`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="What are polymorphic association pitfalls?"
          >
            <p>
              Patterns like <code>commentable_type</code> + <code>commentable_id</code> (Rails-style) cannot
              use a real foreign key to multiple parent tables. Integrity becomes application-only.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Orphans and wrong-type IDs are easy to introduce</li>
              <li>Joins and cascading deletes are awkward</li>
              <li>
                Prefer: separate tables per parent, exclusive arcs (multiple nullable FKs + CHECK), or join
                tables per relation
              </li>
            </ul>
            <CodeBlock
              title="Exclusive arc alternative"
              language="sql"
              code={`CREATE TABLE attachments (
  id SERIAL PRIMARY KEY,
  file_url text NOT NULL,
  order_id   INT REFERENCES orders(id),
  ticket_id  INT REFERENCES tickets(id),
  CHECK (
    (order_id IS NOT NULL)::int + (ticket_id IS NOT NULL)::int = 1
  )
);`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="How do you prevent orphans when deleting parents in Prisma apps?"
          >
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Set explicit <code>onDelete</code> in schema to match product rules (Cascade vs Restrict)
              </li>
              <li>
                With Restrict: delete or reassign children in a transaction before deleting parent
              </li>
              <li>
                Soft-delete parents carefully — children may still reference a “deleted” parent
              </li>
              <li>
                Never rely only on Client <code>include: delete</code> patterns without DB constraints
              </li>
            </ul>
            <CodeBlock
              title="Safe delete order in a transaction"
              language="typescript"
              code={`await prisma.$transaction(async (tx) => {
  await tx.orderItem.deleteMany({ where: { orderId } });
  await tx.order.delete({ where: { id: orderId } });
});

// Or DB-level: onDelete: Cascade on OrderItem.order`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard
            level="Senior"
            question="How do you choose cascade behavior for a SaaS multi-tenant schema?"
          >
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Tenant root delete: usually Cascade through owned data (projects → tasks → comments){' '}
                <em>or</em> soft-delete the tenant and background-purge
              </li>
              <li>
                Cross-tenant references must be impossible — composite FKs <code>(tenant_id, id)</code> when
                needed
              </li>
              <li>
                Billing / audit tables: often Restrict or soft-delete retention for compliance
              </li>
              <li>
                Prefer explicit Restrict on destructive edges during early product stages to avoid accidental
                mass deletes
              </li>
            </ul>
            <CodeBlock
              title="Composite FK for tenant safety"
              language="sql"
              code={`CREATE TABLE projects (
  tenant_id INT NOT NULL,
  id        INT GENERATED BY DEFAULT AS IDENTITY,
  name text NOT NULL,
  PRIMARY KEY (tenant_id, id)
);

CREATE TABLE tasks (
  tenant_id INT NOT NULL,
  id        INT GENERATED BY DEFAULT AS IDENTITY,
  project_id INT NOT NULL,
  PRIMARY KEY (tenant_id, id),
  FOREIGN KEY (tenant_id, project_id)
    REFERENCES projects (tenant_id, id)
    ON DELETE CASCADE
);`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Senior"
            question="Implicit vs explicit M:N in Prisma — how do you decide in production?"
          >
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Implicit:</strong> fine for simple tags/roles with no payload; Prisma owns the join
                table name
              </li>
              <li>
                <strong>Explicit:</strong> required when the relationship has attributes, needs indexing
                beyond defaults, or must be queried as a first-class entity
              </li>
              <li>
                Teams often start implicit and migrate to explicit when product needs metadata — plan for
                that migration early if likely
              </li>
            </ul>
            <CodeBlock
              title="Explicit join model query"
              language="typescript"
              code={`await prisma.enrollment.create({
  data: {
    studentId: 1,
    courseId: 9,
    grade: null,
  },
});

const roster = await prisma.enrollment.findMany({
  where: { courseId: 9 },
  include: { student: { select: { id: true, name: true } } },
});`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Senior"
            question="How would you design comment threads (self-referencing) for high read volume?"
          >
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Adjacency list + <code>parent_id</code> for writes; fetch by <code>post_id</code> with index
              </li>
              <li>
                Materialize paths (<code>ltree</code> / <code>path</code> string) if you need deep subtree
                filters often
              </li>
              <li>
                Cap nesting depth in application rules; paginate top-level comments separately from replies
              </li>
              <li>
                Consider denormalized <code>reply_count</code> on parent for list views
              </li>
            </ul>
            <CodeBlock
              title="Comments schema sketch"
              language="typescript"
              code={`model Comment {
  id        String    @id @default(cuid())
  postId    String
  parentId  String?
  body      String
  createdAt DateTime  @default(now())
  post      Post      @relation(fields: [postId], references: [id], onDelete: Cascade)
  parent    Comment?  @relation("Thread", fields: [parentId], references: [id], onDelete: Cascade)
  replies   Comment[] @relation("Thread")

  @@index([postId, createdAt])
  @@index([parentId])
}`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Senior"
            question="What referential actions interact badly with soft deletes or ORMs?"
          >
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Hard <code>ON DELETE CASCADE</code> bypasses soft-delete conventions — data disappears
              </li>
              <li>
                Soft-deleted parents still block unique emails unless you use partial unique indexes
              </li>
              <li>
                Prisma <code>onDelete</code> only applies when the DB constraint is created via Migrate —
                mismatched schema vs DB is a common footgun
              </li>
              <li>
                Emulated relations (<code>relationMode = "prisma"</code>) do not get real FK cascades —
                application must delete dependents
              </li>
            </ul>
            <CodeBlock
              title="Verify FK actions in Postgres"
              language="sql"
              code={`SELECT conname, confdeltype, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE contype = 'f' AND conrelid = 'orders'::regclass;
-- confdeltype: a=no action, r=restrict, c=cascade, n=set null, d=set default`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

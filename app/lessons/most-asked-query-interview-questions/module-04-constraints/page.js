import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';
import InterviewQACard from '../../../components/InterviewQACard';

export const metadata = {
  title: 'Module 4: Constraints - Most Asked Query Interview Questions',
  description: 'Most asked SQL for PK, FK, UNIQUE, CHECK, orphans, and catalog constraint inspection',
};

export default function Module04ConstraintQueries() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Module 4: Constraints</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Most asked constraint-related statements and diagnostic queries. Junior → Senior.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="Write CREATE TABLE with NOT NULL, UNIQUE, PK, and CHECK.">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`CREATE TABLE products (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sku        TEXT NOT NULL UNIQUE,
  price      NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  stock      INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0)
);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="Write an INSERT that will fail UNIQUE, and one that succeeds.">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`INSERT INTO users (email, name) VALUES ('a@x.com', 'Ann');
INSERT INTO users (email, name) VALUES ('a@x.com', 'Ann 2'); -- unique_violation`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="Write a FOREIGN KEY with ON DELETE CASCADE vs RESTRICT.">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`ALTER TABLE order_items
  ADD CONSTRAINT order_items_order_fk
  FOREIGN KEY (order_id) REFERENCES orders (id)
  ON DELETE CASCADE;

ALTER TABLE orders
  ADD CONSTRAINT orders_user_fk
  FOREIGN KEY (user_id) REFERENCES users (id)
  ON DELETE RESTRICT;`}
            />
            <CodeBlock
              title="Prisma"
              language="prisma"
              code={`order   Order @relation(fields: [orderId], references: [id], onDelete: Cascade)
user    User  @relation(fields: [userId], references: [id], onDelete: Restrict)`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="Write a query to find orphan child rows (FK missing parent) if the FK was never added.">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`SELECT o.*
FROM orders o
LEFT JOIN users u ON u.id = o.user_id
WHERE u.id IS NULL;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Write a query listing all constraints on a table.">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`SELECT tc.constraint_name, tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public' AND tc.table_name = 'orders';`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Write a composite UNIQUE and the query that would violate it.">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`ALTER TABLE enrollments
  ADD CONSTRAINT enrollments_user_course_uidx UNIQUE (user_id, course_id);

INSERT INTO enrollments (user_id, course_id) VALUES (1, 10);
INSERT INTO enrollments (user_id, course_id) VALUES (1, 10); -- fails`}
            />
            <CodeBlock
              title="Prisma"
              language="prisma"
              code={`@@unique([userId, courseId])`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="Write DEFERRABLE FK checks used inside a transaction (circular inserts).">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`ALTER TABLE employees
  ADD CONSTRAINT employees_manager_fk
  FOREIGN KEY (manager_id) REFERENCES employees (id)
  DEFERRABLE INITIALLY DEFERRED;

BEGIN;
INSERT INTO employees (id, name, manager_id) VALUES (1, 'A', 2);
INSERT INTO employees (id, name, manager_id) VALUES (2, 'B', 1);
COMMIT;`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Senior"
            question="Write an EXCLUDE constraint so two bookings cannot overlap for the same room."
          >
            <CodeBlock
              title="SQL"
              language="sql"
              code={`CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE bookings (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  room_id    BIGINT NOT NULL,
  during     TSTZRANGE NOT NULL,
  EXCLUDE USING gist (room_id WITH =, during WITH &&)
);`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

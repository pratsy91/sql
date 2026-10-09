import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 2: Relationship Types - Module 19 - Most Asked Interview Questions',
  description:
    'Most asked interview questions on relationship types: one-to-one, one-to-many and many-to-many, junction tables, which side holds the foreign key, cardinality versus optionality, when a one-to-one should just be one table, junction tables with extra columns, and reading an ERD before you write SQL.',
};

export default function M19L2RelationshipTypes() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 2: Relationship Types</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Every relational schema is built from three shapes. This lesson names them, shows how each one turns into
          real tables, and answers the questions that follow: which table stores the link, whether it is allowed to
          be empty, and when a separate table is not worth it.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard
            level="Junior"
            question="Explain one-to-one, one-to-many, and many-to-many relationships."
          >
            <p>These names say how many rows on one side can match rows on the other side.</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>1:1</strong> — one user has at most one profile. Put a unique foreign key on one side.
              </li>
              <li>
                <strong>1:N</strong> — one customer has many orders. The order table stores the customer id.
              </li>
              <li>
                <strong>M:N</strong> — students and courses. One student takes many courses, and one course has many
                students. Use a middle table.
              </li>
            </ul>
            <p>
              Notice that only one of the three needs an extra table. 1:1 and 1:N are just a foreign key column in
              the right place; M:N cannot be done with a column at all, because a column holds one value.
            </p>
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
CREATE INDEX orders_customer_id_idx ON orders (customer_id);

-- M:N
CREATE TABLE enrollment (
  student_id INT REFERENCES students(id),
  course_id  INT REFERENCES courses(id),
  PRIMARY KEY (student_id, course_id)
);
CREATE INDEX enrollment_course_id_idx ON enrollment (course_id);`}
            />
            <CodeBlock
              title="The same three in Prisma"
              language="typescript"
              code={`// 1:1 — the unique makes it one-to-one instead of one-to-many
model User {
  id      Int      @id @default(autoincrement())
  profile Profile?
}
model Profile {
  id     Int  @id @default(autoincrement())
  userId Int  @unique
  user   User @relation(fields: [userId], references: [id])
}

// 1:N
model Customer {
  id     Int     @id @default(autoincrement())
  orders Order[]
}
model Order {
  id         Int      @id @default(autoincrement())
  customerId Int
  customer   Customer @relation(fields: [customerId], references: [id])

  @@index([customerId])
}

// M:N (implicit: Prisma creates and owns the join table)
model Student {
  id      Int      @id @default(autoincrement())
  courses Course[]
}
model Course {
  id       Int       @id @default(autoincrement())
  students Student[]
}`}
            />
            <p>
              In Prisma the list field (<code>Order[]</code>) is not a column. It exists only in the generated
              client so you can navigate the relation; the actual link is the{' '}
              <code>customerId</code> column on the other side.
            </p>
          </InterviewQACard>

          <InterviewQACard level="Junior" question="What is a junction (associative) table?">
            <p>
              A junction table is the middle table that makes a many-to-many relationship possible. It stores pairs
              of foreign keys, one pointing at each side. You will also hear it called a join table, a link table,
              a bridge table or a cross-reference table; they all mean the same thing.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                The primary key is usually the pair of foreign keys, which also prevents the same pair being stored
                twice
              </li>
              <li>
                Both foreign key columns want an index. The composite primary key covers lookups by the first
                column, so add a separate index for the second
              </li>
              <li>
                <code>ON DELETE CASCADE</code> on both sides is normally right: if the product is gone, the link to
                its tag is meaningless
              </li>
              <li>Add payload columns when the relationship itself has data, such as a role or a quantity</li>
            </ul>
            <CodeBlock
              title="Junction with a payload column"
              language="sql"
              code={`CREATE TABLE product_tag (
  product_id INT REFERENCES products(id) ON DELETE CASCADE,
  tag_id     INT REFERENCES tags(id) ON DELETE CASCADE,
  tagged_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (product_id, tag_id)
);

-- The PK indexes (product_id, tag_id). Queries by tag need this one:
CREATE INDEX product_tag_tag_id_idx ON product_tag (tag_id);`}
            />
            <CodeBlock
              title="Querying through it"
              language="sql"
              code={`-- Every tag on one product
SELECT t.name
FROM product_tag pt
JOIN tags t ON t.id = pt.tag_id
WHERE pt.product_id = $1;

-- Products that have BOTH of two tags
SELECT pt.product_id
FROM product_tag pt
WHERE pt.tag_id IN ($1, $2)
GROUP BY pt.product_id
HAVING count(DISTINCT pt.tag_id) = 2;`}
            />
            <p>
              That second query is worth remembering. Finding rows that match <em>all</em> of several values needs
              a group and a count, not a chain of <code>AND</code> conditions, because each match is a different
              row.
            </p>
          </InterviewQACard>

          <InterviewQACard
            level="Junior"
            question="How do you decide which side holds the foreign key?"
          >
            <p>
              For one-to-many there is no choice: the foreign key goes on the <strong>many</strong> side. One order
              belongs to one customer, so <code>orders</code> stores <code>customer_id</code>. The other direction
              is impossible, because a customer with 40 orders cannot fit 40 ids in one column.
            </p>
            <p>
              For one-to-one you do have a choice, and these are the tie-breakers:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>The optional side holds the key.</strong> If a user may have a profile but a profile must
                have a user, put <code>user_id</code> on <code>profiles</code>. Then the column can be{' '}
                <code>NOT NULL</code> and you never store NULLs
              </li>
              <li>
                <strong>The dependent side holds the key.</strong> Ask which row cannot exist alone. That is the
                child
              </li>
              <li>
                <strong>The smaller or hotter table stays clean.</strong> If one side is read constantly and the
                other is a rarely-used extension, keep the extension on the outside
              </li>
            </ul>
            <CodeBlock
              title="Foreign key on the dependent, optional side"
              language="sql"
              code={`-- A user can exist without a profile; a profile cannot exist without a user.
-- So the key lives on profiles, and it can be NOT NULL.
CREATE TABLE profiles (
  user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  bio     TEXT,
  avatar_url TEXT
);

-- Using user_id as the primary key is what makes it 1:1 rather than 1:N.`}
            />
            <p>
              Prisma makes the same rule explicit, which is useful for remembering it: the side that lists{' '}
              <code>fields</code> and <code>references</code> in <code>@relation</code> is the side that owns the
              foreign key column. The other side just gets a virtual field.
            </p>
            <CodeBlock
              title="Prisma: the owning side is the one with fields"
              language="typescript"
              code={`model User {
  id      Int      @id @default(autoincrement())
  profile Profile?          // virtual, no column
}

model Profile {
  id     Int  @id @default(autoincrement())
  userId Int  @unique       // the real column
  user   User @relation(fields: [userId], references: [id], onDelete: Cascade)
}`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="What is the difference between cardinality and optionality?">
            <p>
              They answer two different questions about the same relationship.{' '}
              <strong>Cardinality</strong> asks <em>how many</em>: one, or many.{' '}
              <strong>Optionality</strong> asks <em>whether it is required</em>: must there be at least one, or is
              zero allowed. People often say &quot;one-to-many&quot; and forget the second half, which is where the
              real design decisions are.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                In the database, cardinality is expressed by <em>where</em> the foreign key is and whether it is
                unique
              </li>
              <li>
                Optionality is expressed by <code>NULL</code> versus <code>NOT NULL</code> on that column
              </li>
              <li>
                A nullable foreign key means &quot;zero or one&quot;. A <code>NOT NULL</code> foreign key means
                &quot;exactly one&quot;
              </li>
            </ul>
            <CodeBlock
              title="Optionality is one keyword"
              language="sql"
              code={`-- An order MUST have a customer: exactly one
ALTER TABLE orders
  ALTER COLUMN customer_id SET NOT NULL;

-- A comment MAY be anonymous: zero or one author
CREATE TABLE comments (
  id      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  body    TEXT NOT NULL,
  user_id INT REFERENCES users(id) ON DELETE SET NULL   -- nullable on purpose
);`}
            />
            <p>
              The awkward case is &quot;one or many&quot;, meaning at least one child is required. An order must
              have at least one line item. No database can enforce that with a foreign key, because the order row
              has to exist before the line can reference it. Your options are all imperfect, and naming them is a
              good mid-level answer:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Insert the parent and the first child in one transaction, enforced in application code</li>
              <li>
                A <code>DEFERRABLE INITIALLY DEFERRED</code> constraint checked at commit, together with a
                constraint trigger
              </li>
              <li>
                A status column, so an order with no lines is simply <code>draft</code> and never becomes{' '}
                <code>submitted</code>. This is usually the most practical answer
              </li>
            </ul>
            <CodeBlock
              title="Prisma: required versus optional"
              language="typescript"
              code={`model Order {
  id         Int      @id @default(autoincrement())
  customerId Int                       // required: exactly one
  customer   Customer @relation(fields: [customerId], references: [id])
  items      OrderItem[]               // zero or many, from Prisma's point of view
}

model Comment {
  id     Int   @id @default(autoincrement())
  userId Int?                          // optional: the ? makes it nullable
  user   User? @relation(fields: [userId], references: [id], onDelete: SetNull)
}`}
            />
            <p>
              A detail that catches people out: in Prisma the optionality of the scalar field and the relation field
              must agree. <code>userId Int?</code> needs <code>user User?</code>, and a required scalar cannot have
              an optional relation.
            </p>
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="When should a one-to-one relationship just be one table?"
          >
            <p>
              Most of the time. If the extra table always has exactly one row per parent and is always fetched with
              it, splitting it buys you a join and nothing else. Merge it.
            </p>
            <p>Keep them separate when at least one of these is true:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>The row often does not exist.</strong> If only 3% of users have a subscription, a separate
                table beats fifteen nullable columns
              </li>
              <li>
                <strong>The columns are large and rarely read.</strong> A long biography or a JSON blob makes the
                main table&apos;s rows wider, so fewer fit per page and every scan reads more
              </li>
              <li>
                <strong>Access control differs.</strong> Salary or identity-document columns can live in a table
                that a different database role can read, which a column-level rule cannot express as clearly
              </li>
              <li>
                <strong>Lifecycles differ.</strong> The child data is written by another service, or deleted on a
                different schedule, or retained for a different period
              </li>
              <li>
                <strong>It is really a one-to-many in waiting.</strong> &quot;A user has one address&quot; becomes
                &quot;a user has a billing and a shipping address&quot; surprisingly fast
              </li>
            </ul>
            <p>
              Worth knowing for the performance argument: PostgreSQL already moves large values out of the main row
              into separate storage, called TOAST, and does not read them unless you select that column. So the
              &quot;wide row&quot; reason is weaker than it is in some other databases, and a genuinely huge text
              column is often fine where it is.
            </p>
            <CodeBlock
              title="Merge the common case"
              language="sql"
              code={`-- Unnecessary split: every user has exactly one, always read together
CREATE TABLE users (id INT PRIMARY KEY, email TEXT NOT NULL);
CREATE TABLE user_settings (user_id INT PRIMARY KEY REFERENCES users(id), theme TEXT);

-- Simpler and faster
CREATE TABLE users (
  id    INT PRIMARY KEY,
  email TEXT NOT NULL,
  theme TEXT NOT NULL DEFAULT 'system'
);`}
            />
            <CodeBlock
              title="Keep the split when the row is rare"
              language="sql"
              code={`-- Only paying customers have a row here
CREATE TABLE subscriptions (
  user_id          INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  stripe_id        TEXT NOT NULL UNIQUE,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancelled_at     TIMESTAMPTZ
);

-- Every column can be NOT NULL, because the row only exists when it applies.
-- In the merged version they would all have to be nullable.`}
            />
            <p>
              That last comment is the strongest argument for splitting. A separate table lets you make the columns
              required; merging forces them all to be nullable, and nullable columns are how invalid states sneak
              in.
            </p>
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="What changes when you add extra columns to a junction table?"
          >
            <p>
              It stops being a pure link and becomes an entity in its own right. That is normal and often correct —
              an enrolment has a grade, a team membership has a role, a cart line has a quantity — but it has
              consequences you should state.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>It needs a name from the domain.</strong> <code>student_course</code> becomes{' '}
                <code>enrollment</code>, <code>user_team</code> becomes <code>membership</code>. The name tells you
                it has its own facts
              </li>
              <li>
                <strong>In Prisma it must be explicit.</strong> An implicit many-to-many has no room for extra
                columns, so you write the model yourself
              </li>
              <li>
                <strong>Keep the composite unique constraint.</strong> Extra columns tempt people to add a
                surrogate id and drop the pair uniqueness, and then the same student is enrolled twice
              </li>
              <li>
                <strong>Decide whether history matters.</strong> If you need to know that someone left a team and
                rejoined, the pair is no longer unique and you need a time range instead
              </li>
            </ul>
            <CodeBlock
              title="A junction that became an entity"
              language="sql"
              code={`CREATE TABLE enrollment (
  student_id  INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id   INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  grade       TEXT,
  PRIMARY KEY (student_id, course_id)
);

CREATE INDEX enrollment_course_id_idx ON enrollment (course_id);`}
            />
            <CodeBlock
              title="If you add a surrogate id, keep the pair unique"
              language="sql"
              code={`CREATE TABLE membership (
  id       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id  INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id  INT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  role     TEXT NOT NULL DEFAULT 'member',
  UNIQUE (user_id, team_id)      -- without this, duplicates are allowed
);

-- Only one owner per team, enforced by a partial unique index
CREATE UNIQUE INDEX membership_one_owner_idx
  ON membership (team_id) WHERE role = 'owner';`}
            />
            <CodeBlock
              title="Explicit many-to-many in Prisma"
              language="typescript"
              code={`model Enrollment {
  studentId  Int
  courseId   Int
  enrolledAt DateTime @default(now())
  grade      String?

  student Student @relation(fields: [studentId], references: [id], onDelete: Cascade)
  course  Course  @relation(fields: [courseId], references: [id], onDelete: Cascade)

  @@id([studentId, courseId])
  @@index([courseId])
}

model Student {
  id          Int          @id @default(autoincrement())
  enrollments Enrollment[]
}

model Course {
  id          Int          @id @default(autoincrement())
  enrollments Enrollment[]
}`}
            />
            <p>
              Note that you now traverse through the join model:{' '}
              <code>student.enrollments[0].course</code> rather than <code>student.courses[0]</code>. That extra hop
              is the real cost of going explicit, and it is why you would not do it for plain tags.
            </p>
            <CodeBlock
              title="Reading the extra column"
              language="typescript"
              code={`const roster = await prisma.enrollment.findMany({
  where: { courseId: 9 },
  select: {
    grade: true,
    enrolledAt: true,
    student: { select: { id: true, name: true } },
  },
  orderBy: { enrolledAt: 'asc' },
});`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard
            level="Senior"
            question="How do you think about an ERD before writing SQL or a Prisma schema?"
          >
            <p>
              An ERD, an entity relationship diagram, is just boxes for things and lines for how they relate. The
              value is not the drawing; it is that it forces you to ask the questions that are expensive to answer
              later.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>List entities (the nouns) and relationships (the verbs) from how the domain actually talks</li>
              <li>
                Decide cardinality (1:1, 1:N, M:N) and optionality (must or may) for every line, and write the
                sentence out in both directions: &quot;an order has exactly one customer; a customer has zero or
                more orders&quot;
              </li>
              <li>Choose primary keys, and put foreign keys on the many or dependent side</li>
              <li>Normalize to remove duplication, then note any denormalization you are adding on purpose</li>
              <li>
                Mark what happens on delete for every line, because that is a product decision, not a technical one
              </li>
              <li>
                Translate the boxes and lines into <code>CREATE TABLE</code> statements or Prisma{' '}
                <code>model</code> blocks
              </li>
            </ul>
            <p>
              The sentence test in the second point is the most useful habit here. Saying the relationship out loud
              in both directions catches the mistakes that a diagram hides, because &quot;a user has one
              address&quot; sounds fine until you say &quot;an address belongs to exactly one user&quot; and realise
              a family shares one.
            </p>
            <p>Questions to ask about each line before you commit to it:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Will this stay one-to-one?</strong> Turning 1:1 into 1:N later is a migration; designing the
                child table now is free
              </li>
              <li>
                <strong>Does the relationship have its own facts?</strong> If yes, it is an entity, so name it now
                rather than discovering it later
              </li>
              <li>
                <strong>Does the relationship change over time, and do we care?</strong> If we need history, the
                link needs a time range and the current state becomes a query
              </li>
              <li>
                <strong>Which side is the aggregate root?</strong> That is the thing users think they are editing,
                and it usually defines your transaction boundaries and your cascade rules
              </li>
            </ul>
            <p>
              Then keep the diagram honest. The reliable way is to generate it from the schema rather than
              maintaining it by hand, because a hand-drawn ERD is out of date within a month.
            </p>
            <CodeBlock
              title="Generate the diagram from the schema"
              language="bash"
              code={`# From a Prisma schema
npm i -D prisma-erd-generator @mermaid-js/mermaid-cli
# then add the generator block and run: npx prisma generate

# Or straight from a live database
# schemaspy / pg_dump --schema-only both give you something reviewable in git`}
            />
            <CodeBlock
              title="Reading the relationships out of a live database"
              language="sql"
              code={`SELECT c.conrelid::regclass  AS child,
       c.confrelid::regclass AS parent,
       pg_get_constraintdef(c.oid) AS definition
FROM pg_constraint c
WHERE c.contype = 'f'
ORDER BY 1, 2;`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

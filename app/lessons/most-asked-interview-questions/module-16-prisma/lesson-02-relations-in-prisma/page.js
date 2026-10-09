import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 2: Relations in Prisma - Module 16 - Most Asked Interview Questions',
  description:
    'Most asked Prisma relation interview questions: one-to-one, one-to-many, implicit and explicit many-to-many, relation scalar fields, optional relations, connect vs create vs connectOrCreate, and referential actions',
};

export default function MaiqM16L02RelationsInPrisma() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 2: Relations in Prisma</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          How to link models together, what the extra id field next to a relation is for, and how to attach
          rows to each other when you write.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard
            level="Junior"
            question="How do you model 1:1, 1:N, and M:N (implicit vs explicit) in Prisma?"
          >
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>1:1 (one to one):</strong> the foreign key on one side is marked <code>@unique</code>,
                for example a User and a Profile
              </li>
              <li>
                <strong>1:N (one to many):</strong> the foreign key sits on the many side, and the parent gets
                an array field, for example User then Post list
              </li>
              <li>
                <strong>M:N implicit:</strong> both sides have array fields and Prisma creates a hidden join
                table for you
              </li>
              <li>
                <strong>M:N explicit:</strong> you define the join model yourself when you need extra columns
                on the link, such as a role or an enrolled date
              </li>
            </ul>
            <CodeBlock
              title="Implicit vs explicit many-to-many"
              language="typescript"
              code={`// Implicit M:N - Prisma manages the _PostToTag join table
model Post {
  id   Int   @id @default(autoincrement())
  tags Tag[]
}
model Tag {
  id    Int    @id @default(autoincrement())
  posts Post[]
}

// Explicit M:N - join model with payload
model Enrollment {
  studentId Int
  courseId  Int
  grade     String?
  enrolledAt DateTime @default(now())
  student   Student @relation(fields: [studentId], references: [id])
  course    Course  @relation(fields: [courseId], references: [id])

  @@id([studentId, courseId])
}`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="What is a relation scalar field?">
            <p>
              A relation in Prisma is written with two fields. One is the real column in the database, and one
              exists only in Prisma so you can read the related row. The real column is the relation scalar
              field.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <code>authorId String</code> is the relation scalar. It is the actual foreign key column
              </li>
              <li>
                <code>author User</code> is the relation field. There is no such column in the table. Prisma
                fills it when you ask for it with <code>include</code> or <code>select</code>
              </li>
              <li>
                The <code>@relation</code> attribute ties them together with <code>fields</code> and{' '}
                <code>references</code>
              </li>
              <li>
                This is why you can create a Post either by passing{' '}
                <code>{'{ authorId: 1 }'}</code> or by passing a nested{' '}
                <code>{'{ author: { connect: { id: 1 } } }'}</code>
              </li>
            </ul>
            <CodeBlock
              title="Two fields, one relationship"
              language="typescript"
              code={`model Post {
  id       Int    @id @default(autoincrement())
  title    String
  authorId Int                                       // relation scalar - a real column
  author   User   @relation(fields: [authorId], references: [id]) // relation field - virtual
}`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="What is the difference between a required and an optional relation?">
            <p>
              It comes down to whether the foreign key column allows NULL. If the relation scalar is nullable,
              the relation is optional and the row can exist with no parent.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <code>authorId Int</code> with <code>author User</code> is required. Every post must have an
                author, and the database enforces it
              </li>
              <li>
                <code>authorId Int?</code> with <code>author User?</code> is optional. A post can sit with no
                author
              </li>
              <li>
                The scalar and the relation field must agree. You cannot mark one optional and leave the other
                required
              </li>
              <li>
                On a one to many relation the list side is always optional in practice. An empty list is a
                valid answer, so you never write <code>Post[]?</code>
              </li>
              <li>
                Making a required relation optional later is a safe migration. Going the other way fails if
                any existing row has NULL
              </li>
            </ul>
            <CodeBlock
              title="Required and optional side by side"
              language="typescript"
              code={`model Post {
  id       Int    @id @default(autoincrement())
  authorId Int                                                  // required
  author   User   @relation(fields: [authorId], references: [id])

  editorId Int?                                                 // optional
  editor   User?  @relation("edited", fields: [editorId], references: [id])
}`}
            />
            <CodeBlock
              title="What the database sees"
              language="sql"
              code={`CREATE TABLE "Post" (
  id        SERIAL PRIMARY KEY,
  "authorId" INT NOT NULL REFERENCES "User"(id),
  "editorId" INT NULL     REFERENCES "User"(id)
);`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard
            level="Mid"
            question="What is the difference between connect, create, and connectOrCreate?"
          >
            <p>
              All three appear inside a nested write. They answer one question: should the related row already
              exist, or should Prisma make it?
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>connect:</strong> link to a row that already exists, found by a unique field. If it is
                missing you get error P2025
              </li>
              <li>
                <strong>create:</strong> insert a brand new related row in the same statement batch
              </li>
              <li>
                <strong>connectOrCreate:</strong> look for the row by a unique field, link it if found, insert
                it if not. This is the safe choice for things like tags
              </li>
              <li>
                Related keywords on updates: <code>disconnect</code> removes the link, <code>set</code>{' '}
                replaces a whole list, and <code>connect</code> adds to a list
              </li>
            </ul>
            <CodeBlock
              title="Nested writes"
              language="typescript"
              code={`// connect - author must already exist
await prisma.post.create({
  data: {
    title: 'Hello',
    author: { connect: { id: 1 } },
  },
});

// create - makes the profile row too
await prisma.user.create({
  data: {
    email: 'a@b.com',
    profile: { create: { bio: 'New here' } },
  },
});

// connectOrCreate - reuse the tag if it exists
await prisma.post.create({
  data: {
    title: 'Tagged post',
    author: { connect: { id: 1 } },
    tags: {
      connectOrCreate: [
        { where: { name: 'sql' }, create: { name: 'sql' } },
        { where: { name: 'prisma' }, create: { name: 'prisma' } },
      ],
    },
  },
});

// updating a list
await prisma.post.update({
  where: { id: 10 },
  data: {
    tags: {
      disconnect: [{ id: 3 }],   // unlink one
      set: [{ id: 1 }, { id: 2 }], // replace the whole list
    },
  },
});`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="Why does an implicit many-to-many join table have no model in the schema?"
          >
            <p>
              Because the join table carries nothing except the two foreign keys. Prisma decides you do not
              need to see it, creates it with a fixed naming convention, and manages the rows for you.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                The table is named with an underscore then the two model names in alphabetical order, for
                example <code>_PostToTag</code>, with columns A and B
              </li>
              <li>
                Since there is no model, there is no <code>prisma.postToTag</code>. You can only touch it
                through the parent, using <code>connect</code>, <code>disconnect</code>, or <code>set</code>
              </li>
              <li>
                You cannot add a column such as addedAt or addedBy. The moment you need one, you must switch
                to an explicit join model
              </li>
              <li>
                Switching later is a real migration: create the new table, copy rows from the hidden one, then
                drop it. Interviewers like this answer because it shows you have done it
              </li>
              <li>
                The hidden table also needs <code>relationMode</code> awareness on databases without foreign
                keys, and it must be indexed by Prisma for lookups in both directions
              </li>
            </ul>
            <CodeBlock
              title="What Prisma creates behind the scenes"
              language="sql"
              code={`CREATE TABLE "_PostToTag" (
  "A" INT NOT NULL REFERENCES "Post"(id) ON DELETE CASCADE,
  "B" INT NOT NULL REFERENCES "Tag"(id)  ON DELETE CASCADE
);
CREATE UNIQUE INDEX "_PostToTag_AB_unique" ON "_PostToTag"("A", "B");
CREATE INDEX "_PostToTag_B_index" ON "_PostToTag"("B");`}
            />
            <CodeBlock
              title="Explicit version when you need a payload"
              language="typescript"
              code={`model PostTag {
  postId  Int
  tagId   Int
  addedAt DateTime @default(now())
  addedBy String

  post Post @relation(fields: [postId], references: [id])
  tag  Tag  @relation(fields: [tagId], references: [id])

  @@id([postId, tagId])
  @@index([tagId])
}`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="How do you query across a relation, and how do you filter by a related row?"
          >
            <p>
              Prisma gives three relation filters: <code>some</code>, <code>every</code>, and{' '}
              <code>none</code> for lists, and a direct object filter for a single parent. They compile to
              EXISTS style SQL, not to a JOIN that duplicates rows.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <code>some</code> means at least one child matches
              </li>
              <li>
                <code>every</code> means all children match, and it is also true when there are no children at
                all
              </li>
              <li>
                <code>none</code> means no child matches, which is the way to write a NOT EXISTS query
              </li>
              <li>
                For a single relation you filter it like a normal object, for example{' '}
                <code>{'{ author: { role: "ADMIN" } }'}</code>
              </li>
            </ul>
            <CodeBlock
              title="Relation filters"
              language="typescript"
              code={`// users who published at least one post
await prisma.user.findMany({
  where: { posts: { some: { published: true } } },
});

// users with no posts at all
await prisma.user.findMany({
  where: { posts: { none: {} } },
});

// posts written by an admin
await prisma.post.findMany({
  where: { author: { role: 'ADMIN' } },
});`}
            />
            <CodeBlock
              title="The SQL shape it maps to"
              language="sql"
              code={`SELECT * FROM "User" u
WHERE EXISTS (
  SELECT 1 FROM "Post" p
  WHERE p."authorId" = u.id AND p.published = true
);`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard
            level="Senior"
            question="What are referential actions (onDelete, onUpdate), and which one do you pick?"
          >
            <p>
              A referential action tells the database what to do with child rows when the parent is deleted or
              its key changes. In Prisma you set it on the <code>@relation</code> attribute, and Prisma writes
              it into the foreign key.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Restrict:</strong> block the delete while children exist. Safest default for money and
                audit data
              </li>
              <li>
                <strong>Cascade:</strong> delete the children too. Good for rows that cannot live alone, such
                as a profile or an order line
              </li>
              <li>
                <strong>SetNull:</strong> keep the child and clear the link. Requires the relation scalar to
                be optional
              </li>
              <li>
                <strong>NoAction:</strong> hand the decision to the database. On PostgreSQL it behaves much
                like Restrict but the check can be deferred
              </li>
              <li>
                Defaults if you say nothing: required relations get Restrict, optional relations get SetNull
              </li>
              <li>
                Senior point: a cascade on a huge child table is a long lock. For big deletes, batch them in
                the application instead of letting one statement cascade over millions of rows
              </li>
            </ul>
            <CodeBlock
              title="Choosing actions per relation"
              language="typescript"
              code={`model Profile {
  id     Int    @id @default(autoincrement())
  userId Int    @unique
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Order {
  id         Int   @id @default(autoincrement())
  customerId Int
  customer   User  @relation(fields: [customerId], references: [id], onDelete: Restrict)
}

model Post {
  id       Int   @id @default(autoincrement())
  editorId Int?
  editor   User? @relation(fields: [editorId], references: [id], onDelete: SetNull)
}`}
            />
            <CodeBlock
              title="The generated constraint"
              language="sql"
              code={`ALTER TABLE "Profile"
  ADD CONSTRAINT "Profile_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"(id)
  ON DELETE CASCADE ON UPDATE CASCADE;`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

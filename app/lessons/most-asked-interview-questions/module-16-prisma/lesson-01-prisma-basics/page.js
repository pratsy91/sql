import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 1: Prisma Basics - Module 16 - Most Asked Interview Questions',
  description:
    'Most asked Prisma basics interview questions: what an ORM is, Prisma Client vs Migrate vs Studio, schema.prisma attributes, prisma generate, where the generated client lives, and Prisma vs raw SQL',
};

export default function MaiqM16L01PrismaBasics() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 1: Prisma Basics</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Start here. What an ORM is, what the three Prisma tools do, how you describe tables in a schema
          file, and what the generate step actually produces.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="What is an ORM, and why do teams use one?">
            <p>
              ORM stands for Object Relational Mapper. It is a library that lets you work with database rows
              as normal objects in your programming language, instead of writing SQL text by hand for every
              read and write.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>You describe your tables once, and the ORM builds the SQL for you</li>
              <li>You get autocomplete and type checking, so typos are caught before the code runs</li>
              <li>It handles boring, repetitive work: mapping columns to fields, escaping values, joins</li>
              <li>The cost is a layer of abstraction. Hard queries can be easier to write directly in SQL</li>
            </ul>
            <CodeBlock
              title="Same read, two ways"
              language="sql"
              code={`-- Raw SQL
SELECT id, email FROM "User" WHERE email = 'a@b.com' LIMIT 1;`}
            />
            <CodeBlock
              title="Prisma version of the same read"
              language="typescript"
              code={`const user = await prisma.user.findUnique({
  where: { email: 'a@b.com' },
  select: { id: true, email: true },
});
// user is typed: { id: string; email: string } | null`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Junior"
            question="What is Prisma? How do Prisma Client, Prisma Migrate, and Prisma Studio differ?"
          >
            <p>
              Prisma is a tool that lets you query PostgreSQL from TypeScript without writing most SQL by
              hand. You describe tables in a schema file. Prisma then generates a typed client.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Prisma Client:</strong> the code you call in the app (<code>findMany</code>,{' '}
                <code>create</code>)
              </li>
              <li>
                <strong>Prisma Migrate:</strong> turns schema changes into SQL files (
                <code>migrate dev</code> locally, <code>migrate deploy</code> in production)
              </li>
              <li>
                <strong>Prisma Studio:</strong> a local screen to look at and edit rows
              </li>
              <li>
                Also: <code>schema.prisma</code>, <code>prisma generate</code>, and optional pooling
                (Accelerate)
              </li>
            </ul>
            <CodeBlock
              title="Typical workflow commands"
              language="bash"
              code={`npx prisma init
npx prisma migrate dev --name init   # create + apply migration (dev)
npx prisma generate                  # regenerate Client
npx prisma studio                    # open data browser
npx prisma migrate deploy            # apply pending migrations (prod/CI)`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Junior"
            question="Explain schema.prisma model basics: @id, @default, @unique, @relation."
          >
            <p>
              Models map to tables. Field attributes declare primary keys, defaults, uniqueness, and
              relationships. Table-level and index-level rules use <code>@@</code> attributes.
            </p>
            <CodeBlock
              title="schema.prisma essentials"
              language="typescript"
              code={`// schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid()) // or uuid(), autoincrement()
  email     String   @unique
  name      String?
  role      Role     @default(USER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  posts     Post[]
  profile   Profile?
}

model Profile {
  id     Int    @id @default(autoincrement())
  bio    String?
  userId String @unique
  user   User   @relation(fields: [userId], references: [id])
}

model Post {
  id       Int    @id @default(autoincrement())
  title    String
  authorId String
  author   User   @relation(fields: [authorId], references: [id])

  @@index([authorId])
}

enum Role {
  USER
  ADMIN
}`}
            />
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <code>@id</code> is the primary key. Use <code>@@id([a, b])</code> for a composite key
              </li>
              <li>
                <code>@default(...)</code> sets a default value, and <code>@updatedAt</code> automatically
                stamps the row on every update
              </li>
              <li>
                <code>@unique</code> and <code>@@unique</code> create a unique constraint, so no two rows can
                share that value
              </li>
              <li>
                <code>@relation</code> links two models. The side that holds the foreign key uses{' '}
                <code>fields</code> and <code>references</code>
              </li>
              <li>
                A question mark like <code>String?</code> means the column is nullable. Square brackets like{' '}
                <code>Post[]</code> mean a list of related rows
              </li>
            </ul>
          </InterviewQACard>

          <InterviewQACard level="Junior" question="What does prisma generate actually do?">
            <p>
              It reads <code>schema.prisma</code> and writes out the Prisma Client code that matches your
              models. Before you run it, <code>prisma.user</code> does not exist. After you run it, it exists
              with the exact fields you declared.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>It does not touch the database. It only writes client code on disk</li>
              <li>
                You must run it again after any schema change, or your types will describe the old schema
              </li>
              <li>
                <code>prisma migrate dev</code> runs it for you. <code>migrate deploy</code> does not, so CI
                usually runs both
              </li>
              <li>
                <code>npm install</code> triggers it through a postinstall hook in most Prisma projects
              </li>
            </ul>
            <CodeBlock
              title="When you need to regenerate"
              language="bash"
              code={`# after editing schema.prisma by hand
npx prisma generate

# watch mode while iterating on the schema
npx prisma generate --watch`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="Is Prisma an ORM or a query builder?">
            <p>
              Prisma calls itself an ORM, but it does not work like a classic ORM such as Hibernate or
              TypeORM. The honest answer in an interview is that it sits between the two.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                A classic ORM gives you model classes with methods and change tracking. You call{' '}
                <code>user.save()</code> and the ORM works out what changed
              </li>
              <li>
                Prisma returns plain JavaScript objects. There is no hidden tracking and no lazy loading. A
                query happens only when you call a Prisma method
              </li>
              <li>
                A query builder like Knex or Drizzle mirrors SQL clauses closely. Prisma is higher level than
                that. You describe the shape of the result, not the SQL
              </li>
              <li>
                Practical upside: fewer surprise queries. Practical downside: some SQL features need{' '}
                <code>$queryRaw</code>
              </li>
            </ul>
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="Where does the generated Prisma Client live, and why does that matter?"
          >
            <p>
              By default Prisma writes the client into <code>node_modules/.prisma/client</code>, and the
              package you import from, <code>@prisma/client</code>, simply re-exports it. Newer projects often
              point it at a folder inside <code>src</code> instead.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Because it lives in <code>node_modules</code>, it is not committed to git. Any fresh checkout
                or clean CI runner must run <code>prisma generate</code> before the build
              </li>
              <li>
                This is the number one cause of the error saying that Prisma Client did not initialise
              </li>
              <li>
                Setting a custom <code>output</code> path puts the client in your source tree, which makes
                Docker and monorepo builds easier to reason about
              </li>
              <li>
                Deleting <code>node_modules</code> deletes the client, so it must be regenerated
              </li>
            </ul>
            <CodeBlock
              title="Custom output location"
              language="typescript"
              code={`generator client {
  provider = "prisma-client-js"
  output   = "../src/generated/prisma"
}

// then import from your own path
// import { PrismaClient } from '@/generated/prisma';`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="Prisma or raw SQL — what would you tell a junior developer on the team?"
          >
            <p>
              Use Prisma for the everyday ninety percent, and drop to SQL for the hard ten percent. They are
              not rivals. Prisma ships a raw escape hatch exactly for this.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Prisma wins on: normal reads and writes, type safety, refactors, and protection against SQL
                injection because values are always sent as bound parameters
              </li>
              <li>
                SQL wins on: window functions, recursive CTEs, complex aggregation, and locking hints such as{' '}
                <code>FOR UPDATE SKIP LOCKED</code>
              </li>
              <li>
                You still need to know SQL. Prisma generates SQL, and when something is slow you read the
                query plan, not the Prisma call
              </li>
              <li>Never build SQL by joining user input into a string, in any tool</li>
            </ul>
            <CodeBlock
              title="Everyday Prisma, occasional raw SQL"
              language="typescript"
              code={`// 90% of the app
const recent = await prisma.post.findMany({
  where: { published: true },
  orderBy: { createdAt: 'desc' },
  take: 20,
});

// the hard 10% - parameters are still bound safely
const leaderboard = await prisma.$queryRawUnsafe(
  'SELECT "authorId", count(*) AS total FROM "Post" WHERE views > $1 GROUP BY 1 ORDER BY total DESC LIMIT 10',
  100
);`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard
            level="Senior"
            question="How do you handle prisma generate in Docker images and CI pipelines?"
          >
            <p>
              The generated client is platform specific. A client generated on a Mac will not always run
              inside a Linux container, so you generate inside the image you ship.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Copy <code>prisma/schema.prisma</code> into the image before <code>npm ci</code>, so the
                postinstall generate step can find it
              </li>
              <li>
                Set <code>binaryTargets</code> when the build machine and the runtime machine use different
                operating systems, for example a Debian build and an Alpine runtime
              </li>
              <li>
                In a multi stage build, copy the generated client along with{' '}
                <code>node_modules</code> into the final stage, or regenerate there
              </li>
              <li>
                Run <code>prisma migrate deploy</code> as a separate release step, not at container start, so
                ten replicas do not all try to migrate at once
              </li>
            </ul>
            <CodeBlock
              title="Dockerfile ordering that works"
              language="bash"
              code={`COPY package*.json ./
COPY prisma ./prisma          # schema must exist before install
RUN npm ci                    # postinstall runs prisma generate
COPY . .
RUN npm run build`}
            />
            <CodeBlock
              title="binaryTargets for cross platform builds"
              language="typescript"
              code={`generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "linux-musl-openssl-3.0.x"]
}`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

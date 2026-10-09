import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 5: Raw Queries and JSON - Module 16 - Most Asked Interview Questions',
  description:
    'Most asked Prisma interview questions on raw SQL: $queryRaw vs $executeRaw, $queryRawUnsafe and SQL injection, typing raw results, JSON and JSONB filtering, GIN indexes, and TypedSQL',
};

export default function MaiqM16L05RawQueriesAndJson() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 5: Raw Queries and JSON</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          The escape hatch. How to run real SQL through Prisma without opening a security hole, and how to
          work with JSON columns.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="When and how do you use $queryRaw and $executeRaw?">
            <p>
              Use raw SQL for things Prisma does not express well: complex CTEs, window functions, locking
              hints such as FOR UPDATE SKIP LOCKED, and database specific operators.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <code>$queryRaw</code> is for statements that return rows, so SELECT and anything with
                RETURNING. You get an array of plain objects back
              </li>
              <li>
                <code>$executeRaw</code> is for statements that do not return rows, so UPDATE, DELETE, and
                DDL. You get back the number of affected rows
              </li>
              <li>
                Both have a tagged template form, where values written inside the template are sent as bound
                parameters, and a positional form named <code>$queryRawUnsafe</code> and{' '}
                <code>$executeRawUnsafe</code>
              </li>
              <li>
                Prisma does not map the result to your models. Column names come back exactly as the database
                spells them, so quoted camelCase columns stay camelCase
              </li>
              <li>
                Numeric types can surprise you. A PostgreSQL <code>bigint</code> arrives as a JavaScript
                BigInt, and <code>count(*)</code> returns a bigint, so cast it in SQL or convert it in code
              </li>
            </ul>
            <CodeBlock
              title="Reading rows and running a write"
              language="typescript"
              code={`// SELECT - values are passed as bound parameters, never glued into the string
const rows = await prisma.$queryRawUnsafe(
  'SELECT id, title FROM "Post" WHERE views > $1 ORDER BY views DESC LIMIT 10',
  100
);

// UPDATE - returns a count
const affected = await prisma.$executeRawUnsafe(
  'UPDATE "Post" SET published = true WHERE "authorId" = $1',
  userId
);
console.log(affected); // number of rows changed

// count(*) is a bigint - cast it so you get a normal number
const [stats] = await prisma.$queryRawUnsafe(
  'SELECT count(*)::int AS total FROM "Post" WHERE published = $1',
  true
);`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard
            level="Mid"
            question="What is the safety difference between $queryRaw and $queryRawUnsafe?"
          >
            <p>
              Both can be safe and both can be dangerous. The difference is how easy it is to make a mistake.
              The word Unsafe refers to the API shape, not to a guarantee that the query is unsafe.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                The tagged template form of <code>$queryRaw</code> turns every value you drop into the
                template into a bound parameter automatically. Even if the value is user input, it can never
                become SQL
              </li>
              <li>
                <code>$queryRawUnsafe</code> takes a plain string plus a list of values. If you pass the
                values as extra arguments and reference them as <code>$1</code>, <code>$2</code>, it is just
                as safe
              </li>
              <li>
                It becomes unsafe the moment you build the string yourself by joining user input into it. That
                is textbook SQL injection
              </li>
              <li>
                Bound parameters can only stand in for values. Table names, column names, and the direction of
                an ORDER BY cannot be parameters
              </li>
              <li>
                So when a sort column or table name must vary, never pass the raw input through. Check it
                against an allow list of known good names first
              </li>
              <li>
                <code>Prisma.sql</code>, <code>Prisma.join</code>, and <code>Prisma.raw</code> help compose
                fragments. <code>Prisma.raw</code> inserts text with no escaping, so it should only ever see
                values you wrote yourself
              </li>
            </ul>
            <CodeBlock
              title="Safe, safe, and dangerous"
              language="typescript"
              code={`// SAFE - value is a bound parameter
const safe = await prisma.$queryRawUnsafe(
  'SELECT * FROM "Post" WHERE title = $1',
  userInput
);

// DANGEROUS - user input becomes part of the SQL text
// const bad = await prisma.$queryRawUnsafe(
//   'SELECT * FROM "Post" WHERE title = ' + "'" + userInput + "'"
// );
// input of:  x' OR '1'='1
// returns every row in the table`}
            />
            <CodeBlock
              title="Dynamic sort column done properly"
              language="typescript"
              code={`const ALLOWED_SORTS = {
  views: '"views"',
  created: '"createdAt"',
  title: '"title"',
};

const column = ALLOWED_SORTS[req.query.sort] ?? '"createdAt"';
const direction = req.query.dir === 'asc' ? 'ASC' : 'DESC';

const rows = await prisma.$queryRawUnsafe(
  'SELECT id, title FROM "Post" WHERE published = $1 ORDER BY ' +
    column + ' ' + direction + ' LIMIT $2',
  true,
  20
);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How do you type the result of a raw query?">
            <p>
              Prisma cannot know the shape of a raw result, so it defaults to <code>unknown</code>. You give
              it a type yourself with a generic parameter, and that type is a promise, not a check.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Pass the row type in angle brackets and always as an array, since a raw SELECT returns a list
              </li>
              <li>
                Nothing validates it at runtime. If you rename a column and forget the type, TypeScript stays
                happy and the value is undefined at runtime
              </li>
              <li>
                Give every computed column an alias, because otherwise Postgres names it something like{' '}
                <code>?column?</code> and it cannot be typed cleanly
              </li>
              <li>
                Remember the type differences: <code>bigint</code> becomes BigInt, <code>numeric</code> comes
                back as a Decimal or a string, and <code>date</code> becomes a JavaScript Date
              </li>
              <li>
                Safer options in order: derive the type from the generated Prisma model types, validate the
                result with a schema library such as Zod on critical paths, or use TypedSQL so the types are
                generated from the SQL itself
              </li>
            </ul>
            <CodeBlock
              title="Typing a raw result"
              language="typescript"
              code={`type TopAuthor = {
  authorId: number;
  total: number;
  lastPostAt: Date;
};

const rows = await prisma.$queryRawUnsafe<TopAuthor[]>(
  'SELECT "authorId", count(*)::int AS total, max("createdAt") AS "lastPostAt" ' +
    'FROM "Post" WHERE views > $1 GROUP BY "authorId" ORDER BY total DESC LIMIT 10',
  100
);

rows.forEach((r) => console.log(r.authorId, r.total));`}
            />
            <CodeBlock
              title="Reusing Prisma model types instead of hand writing them"
              language="typescript"
              code={`import type { Post } from '@prisma/client';

type PostSummary = Pick<Post, 'id' | 'title' | 'createdAt'>;

const recent = await prisma.$queryRawUnsafe<PostSummary[]>(
  'SELECT id, title, "createdAt" FROM "Post" ORDER BY "createdAt" DESC LIMIT $1',
  20
);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How do you filter JSON and JSONB fields in Prisma?">
            <p>
              Prisma maps a PostgreSQL JSONB column to the <code>Json</code> type. You filter it with a path
              plus a condition, or you drop to raw SQL for the more powerful operators.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <code>path</code> names the keys to walk into, and then you compare with{' '}
                <code>equals</code>, <code>string_contains</code>, <code>string_starts_with</code>,{' '}
                <code>array_contains</code>, <code>gt</code>, and friends
              </li>
              <li>
                Prefer <code>Jsonb</code> over <code>Json</code> in PostgreSQL. Jsonb is stored parsed, so it
                is faster to query and it can be indexed
              </li>
              <li>
                Setting a JSON field to SQL NULL rather than JSON null needs{' '}
                <code>Prisma.DbNull</code> and <code>Prisma.JsonNull</code>. This trips people up constantly
              </li>
              <li>
                Prisma cannot do a partial update of a JSON document. You read it, change it in JavaScript,
                and write the whole value back, or use raw SQL with jsonb_set
              </li>
              <li>
                Rule of thumb: if you filter or sort on a key often, it should be a real column, not a JSON
                key
              </li>
            </ul>
            <CodeBlock
              title="JSON filters"
              language="typescript"
              code={`model Event {
  id   Int  @id @default(autoincrement())
  meta Json
}

// meta looks like: a source key set to web, and a tags array
await prisma.event.findMany({
  where: {
    meta: {
      path: ['source'],
      equals: 'web',
    },
  },
});

// nested key and array membership
await prisma.event.findMany({
  where: {
    AND: [
      { meta: { path: ['user', 'plan'], equals: 'pro' } },
      { meta: { path: ['tags'], array_contains: ['beta'] } },
    ],
  },
});`}
            />
            <CodeBlock
              title="Raw SQL for containment and partial update"
              language="typescript"
              code={`// containment operator, fully indexable
const webEvents = await prisma.$queryRawUnsafe(
  'SELECT * FROM "Event" WHERE meta @> $1::jsonb',
  JSON.stringify({ source: 'web' })
);

// update one key without rewriting the document
await prisma.$executeRawUnsafe(
  'UPDATE "Event" SET meta = jsonb_set(meta, $1, $2::jsonb, true) WHERE id = $3',
  '{source}',
  JSON.stringify('mobile'),
  eventId
);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="When is raw SQL the right call rather than a Prisma query?">
            <p>
              Reach for raw SQL when the query needs something the Prisma API simply does not have, or when a
              hot path needs hand tuned SQL. Not because the Prisma version felt awkward to write.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Window functions:</strong> running totals, rank per group, lag and lead. Prisma has no
                equivalent
              </li>
              <li>
                <strong>Recursive CTEs:</strong> category trees, org charts, graph walks
              </li>
              <li>
                <strong>Locking hints:</strong> SELECT FOR UPDATE SKIP LOCKED is how you build a job queue
                safely, and Prisma cannot express it
              </li>
              <li>
                <strong>Bulk upsert:</strong> one INSERT with many rows plus ON CONFLICT DO UPDATE replaces a
                loop of upserts and is dramatically faster
              </li>
              <li>
                <strong>PostgreSQL specific features:</strong> full text search with tsvector, trigram
                similarity, DISTINCT ON, LATERAL joins, array operators
              </li>
              <li>
                <strong>A measured hot path:</strong> when the plan shows Prisma generated SQL is doing extra
                work you can remove
              </li>
              <li>
                Cost to accept: you lose type safety, you lose refactor safety when a column is renamed, and
                you must handle quoting of camelCase identifiers yourself. Keep raw queries in a small number
                of clearly named repository functions rather than scattered through controllers
              </li>
            </ul>
            <CodeBlock
              title="Job queue - genuinely needs raw SQL"
              language="sql"
              code={`UPDATE jobs
SET status = 'running', started_at = now()
WHERE id = (
  SELECT id FROM jobs
  WHERE status = 'pending'
  ORDER BY created_at
  FOR UPDATE SKIP LOCKED
  LIMIT 1
)
RETURNING *;`}
            />
            <CodeBlock
              title="Bulk upsert in one statement"
              language="sql"
              code={`INSERT INTO "Product" (sku, name, price)
SELECT * FROM unnest($1::text[], $2::text[], $3::numeric[])
ON CONFLICT (sku) DO UPDATE
SET name = EXCLUDED.name,
    price = EXCLUDED.price;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="What is TypedSQL, in one sentence?">
            <p>
              TypedSQL lets you keep real SQL in <code>.sql</code> files under{' '}
              <code>prisma/sql</code>, and <code>prisma generate --sql</code> turns each file into a typed
              function you import and call, so raw SQL finally gets the same argument and result types as the
              rest of Prisma Client.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                It arrived in Prisma 5.19 and it works by asking the database to describe the query, so the
                types come from PostgreSQL itself rather than from a guess
              </li>
              <li>
                A wrong column name or a renamed table fails at generate time, not at two in the morning in
                production
              </li>
              <li>
                Arguments are declared in an SQL comment, so the parameters are typed too
              </li>
              <li>
                Practical trade off: the generate step now needs a reachable database, and the SQL lives
                outside your TypeScript files
              </li>
              <li>
                Good senior framing: TypedSQL is the answer to the old complaint that raw SQL in Prisma is
                untyped. It is the preferred home for the small set of hand tuned queries an app really needs
              </li>
            </ul>
            <CodeBlock
              title="prisma/sql/topAuthors.sql"
              language="sql"
              code={`-- @param {Int} $1:minViews
SELECT "authorId", count(*)::int AS total
FROM "Post"
WHERE views > $1
GROUP BY "authorId"
ORDER BY total DESC
LIMIT 10;`}
            />
            <CodeBlock
              title="Calling it with full types"
              language="typescript"
              code={`import { topAuthors } from '@prisma/client/sql';

const rows = await prisma.$queryRawTyped(topAuthors(100));
// rows is typed as { authorId: number; total: number }[]

// generate with:
// npx prisma generate --sql`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="How do you make JSONB queries fast in PostgreSQL?">
            <p>
              A JSONB column is not automatically indexed. Without an index, every JSON filter is a sequential
              scan that parses the document for every row.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                A GIN index supports the containment operator and key existence checks across the whole
                document. It is large but very flexible
              </li>
              <li>
                The <code>jsonb_path_ops</code> variant is smaller and faster for containment only, which is
                usually all you need
              </li>
              <li>
                An expression index on one extracted key behaves like a normal B-tree index and supports
                ranges and sorting, which a GIN index cannot do
              </li>
              <li>
                Prisma path filters compile to the arrow operators, so they match an expression index but not
                a plain GIN index. Containment written in raw SQL is what uses the GIN index
              </li>
              <li>
                Confirm with EXPLAIN ANALYZE that a Bitmap Index Scan appears instead of a Seq Scan
              </li>
              <li>
                Long term: a key that is queried on every request belongs in a real column with a real index.
                A generated column is a clean way to promote it without changing writers
              </li>
            </ul>
            <CodeBlock
              title="Index JSONB in SQL"
              language="sql"
              code={`-- flexible, supports the containment operator
CREATE INDEX event_meta_gin ON "Event" USING GIN (meta);

-- smaller and faster when you only use containment
CREATE INDEX event_meta_path ON "Event" USING GIN (meta jsonb_path_ops);

-- expression index for one hot key, supports ranges and ORDER BY
CREATE INDEX event_meta_source ON "Event" ((meta->>'source'));

EXPLAIN ANALYZE
SELECT * FROM "Event" WHERE meta @> '{"source":"web"}'::jsonb;`}
            />
            <CodeBlock
              title="Promoting a hot key to a real column"
              language="sql"
              code={`ALTER TABLE "Event"
  ADD COLUMN source text
  GENERATED ALWAYS AS (meta->>'source') STORED;

CREATE INDEX event_source_idx ON "Event" (source);`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

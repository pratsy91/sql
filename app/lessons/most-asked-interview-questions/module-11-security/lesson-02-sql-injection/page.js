import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 2: SQL Injection - Module 11 - Most Asked Interview Questions',
  description:
    'Most asked SQL injection interview questions: what injection is, what a parameterized query really is, why concatenation is unsafe, Prisma raw query helpers, identifiers you cannot bind, and ORDER BY injection.',
};

export default function MaiqSecLesson02SqlInjection() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 2: SQL Injection</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          SQL injection is still the most asked database security question, and the most misunderstood.
          The real rule is simple: user input must always arrive as a value, never as part of the SQL text.
          This lesson covers the rule, the exceptions, and where an ORM still leaves the door open.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="What is SQL injection and how do you prevent it in PostgreSQL?">
            <p>
              SQL injection happens when untrusted input is glued into SQL text, which lets an attacker
              change the structure of the query instead of just its values. Prevention: always use{' '}
              <strong>parameterized queries</strong> with bound parameters, never build SQL strings from
              user input, and validate types and lengths in the application layer.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                The damage is not only data theft. Injection can delete rows, escalate privileges, or read
                server files if the role is too powerful
              </li>
              <li>
                Escaping quotes by hand is not a real defence. Encodings, numbers, and nested contexts break
                it
              </li>
              <li>
                Least privilege limits the blast radius: an app role that cannot <code>DROP</code> makes a
                successful injection much less damaging
              </li>
            </ul>
            <CodeBlock
              title="Unsafe vs parameterized SQL"
              language="sql"
              code={`-- UNSAFE: concatenating user input into SQL text
-- SELECT * FROM users WHERE email = '' || user_input || '';

-- SAFE: $1 is a bound parameter, not interpolated SQL
PREPARE find_user(text) AS
  SELECT id, email FROM users WHERE email = $1;
EXECUTE find_user('alice@example.com');`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="What is a parameterized query, actually?">
            <p>
              A parameterized query is SQL where the values are marked with placeholders such as{' '}
              <code>$1</code> and <code>$2</code>, and the actual values are sent separately. PostgreSQL
              parses and plans the SQL text first, and only then fills in the values. Because the structure
              is already decided, a value can never turn into a new clause, no matter what characters it
              contains.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                It is not string escaping. The value never becomes part of the SQL text at all
              </li>
              <li>
                Each parameter has a type, so a text value stays a single text value
              </li>
              <li>
                It is also faster: the server can reuse the plan for repeated calls with different values
              </li>
              <li>
                Every good driver does this for you. In Prisma Client every filter value is a parameter
              </li>
            </ul>
            <CodeBlock
              title="Parameters in PostgreSQL and in Node"
              language="sql"
              code={`-- Server side: parse once, execute many times with different values
PREPARE order_by_user(bigint, text) AS
  SELECT id, total_cents FROM orders WHERE user_id = $1 AND status = $2;

EXECUTE order_by_user(42, 'paid');
EXECUTE order_by_user(43, 'pending');

DEALLOCATE order_by_user;`}
            />
            <CodeBlock
              title="The same idea from application code"
              language="typescript"
              code={`// node-postgres: text plus a values array
const result = await pgClient.query(
  'SELECT id, email FROM users WHERE email = $1',
  [userInput]
);

// Prisma Client: values are always parameters
const user = await prisma.user.findUnique({ where: { email: userInput } });

// Prisma raw with explicit placeholders
const rows = await prisma.$queryRawUnsafe(
  'SELECT id, email FROM users WHERE email = $1',
  userInput
);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="Why is string concatenation unsafe, even with quotes around the value?">
            <p>
              Because the attacker controls what is inside the quotes, and therefore can end them. As soon
              as the input contains a single quote, the rest of what they typed is read as SQL code rather
              than data. Adding quotes in your template gives no protection at all.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                An input of <code>&apos; OR 1=1 --</code> turns a login check into a query that matches
                every row
              </li>
              <li>
                A semicolon can start a second statement if the driver allows multiple statements
              </li>
              <li>
                Numeric fields are worse, because no quotes are involved and any text is injected directly
              </li>
              <li>
                Hand-rolled escaping breaks on edge cases. If you truly must build SQL text, use{' '}
                <code>quote_literal</code> and <code>quote_ident</code> or the <code>format</code> function
                with <code>%L</code> and <code>%I</code>
              </li>
            </ul>
            <CodeBlock
              title="What the attacker actually builds"
              language="sql"
              code={`-- Template the developer wrote:
--   SELECT * FROM users WHERE email = '<input>' AND active = true;

-- Input: ' OR 1=1 --
-- Final SQL the server sees:
SELECT * FROM users WHERE email = '' OR 1=1 --' AND active = true;
-- The active check is now a comment, and every row matches.

-- Numeric field, input: 0 OR 1=1
SELECT * FROM orders WHERE user_id = 0 OR 1=1;`}
            />
            <CodeBlock
              title="If dynamic SQL is unavoidable, quote properly"
              language="sql"
              code={`CREATE OR REPLACE FUNCTION app.count_rows(tbl text, val text)
RETURNS bigint
LANGUAGE plpgsql
SET search_path = pg_catalog, app
AS $$
DECLARE
  n bigint;
BEGIN
  -- %I quotes an identifier, %L quotes a literal
  EXECUTE format('SELECT count(*) FROM %I WHERE status = %L', tbl, val) INTO n;
  RETURN n;
END;
$$;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="How does Prisma help prevent SQL injection by default?">
            <p>
              The Prisma Client methods such as <code>findMany</code>, <code>create</code>, and{' '}
              <code>update</code> always send values as bound parameters. You describe the query as an
              object, so there is no SQL string for input to escape from. You only reopen the risk when you
              drop down to the raw helpers, especially{' '}
              <code>$queryRawUnsafe</code> and <code>$executeRawUnsafe</code>.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Prisma also validates types against the schema, so a string cannot silently land in a number
                column
              </li>
              <li>
                Filter keys come from the generated types, so an attacker cannot invent a new filter by
                changing a string
              </li>
              <li>
                One real risk remains even without raw SQL: passing a whole request body straight into{' '}
                <code>where</code> or <code>data</code>, which lets a client filter or write fields you did
                not intend. Validate and pick fields explicitly
              </li>
            </ul>
            <CodeBlock
              title="Safe Prisma Client, and the raw helpers"
              language="typescript"
              code={`// Safe: parameterized by Prisma
const user = await prisma.user.findUnique({
  where: { email: userInput },
});

// Safe raw: placeholders with values passed as arguments
const rows = await prisma.$queryRawUnsafe(
  'SELECT id, email FROM users WHERE email = $1',
  userInput
);

// Dangerous: the value becomes part of the SQL text
const bad = await prisma.$queryRawUnsafe(
  "SELECT * FROM users WHERE email = '" + userInput + "'"
);`}
            />
            <CodeBlock
              title="Validate the shape of the input first"
              language="typescript"
              code={`import { z } from 'zod';

const ListQuery = z.object({
  status: z.enum(['pending', 'paid', 'shipped']),
  take: z.coerce.number().int().min(1).max(100).default(20),
});

const q = ListQuery.parse(request.query);

// Build the filter from validated fields, never from the raw body
const orders = await prisma.order.findMany({
  where: { status: q.status },
  take: q.take,
  select: { id: true, status: true, totalCents: true },
});`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What is the difference between $queryRaw and $queryRawUnsafe?">
            <p>
              <code>$queryRaw</code> is used as a tagged template. Every value you interpolate into it is
              turned into a bound parameter automatically, so it is safe by default.{' '}
              <code>$queryRawUnsafe</code> takes a plain SQL string and does <em>not</em> protect anything
              you glued into that string. With the unsafe version you must write the placeholders yourself
              and pass values as extra arguments.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Same pair exists for writes: <code>$executeRaw</code> and <code>$executeRawUnsafe</code>
              </li>
              <li>
                The word unsafe describes the API, not your query. It is fine to use it correctly with
                placeholders
              </li>
              <li>
                Use <code>Prisma.sql</code> and <code>Prisma.join</code> when you need to compose safe
                fragments, such as a variable length <code>IN</code> list
              </li>
              <li>
                Prefer the typed client and keep raw SQL for the few cases that truly need it, such as window
                functions or database-specific features
              </li>
            </ul>
            <CodeBlock
              title="Placeholders and values"
              language="typescript"
              code={`const email = request.query.email as string;

// Preferred when a raw string is needed: numbered placeholders plus arguments
await prisma.$queryRawUnsafe(
  'SELECT * FROM users WHERE email = $1',
  email
);

// A write, same rule
await prisma.$executeRawUnsafe(
  'UPDATE users SET last_seen_at = now() WHERE email = $1',
  email
);

// NEVER concatenate user input into the SQL string`}
            />
            <CodeBlock
              title="A variable length IN list, safely"
              language="typescript"
              code={`// Option A: let the typed client build the parameters
const users = await prisma.user.findMany({
  where: { id: { in: ids } },
  select: { id: true, email: true },
});

// Option B: raw SQL with one array parameter instead of N placeholders
const rows = await prisma.$queryRawUnsafe(
  'SELECT id, email FROM users WHERE id = ANY($1)',
  ids
);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Why can you not parameterize a table or column name?">
            <p>
              A bound parameter is always a <em>value</em>, and PostgreSQL needs the full structure of the
              query before parameters are supplied. Table names, column names, schema names, and keywords
              such as <code>ASC</code> are part of the structure, so there is no placeholder for them. That
              is why dynamic table or column names need a different defence: an allowlist.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <code>SELECT * FROM $1</code> is a syntax error, not a security feature
              </li>
              <li>
                Map the client-facing name to a real identifier through a lookup object, and reject anything
                not found
              </li>
              <li>
                Never filter with a blocklist of bad characters. Allow only known-good names
              </li>
              <li>
                Inside the database, <code>format</code> with <code>%I</code> or the{' '}
                <code>quote_ident</code> function quotes identifiers correctly
              </li>
              <li>
                A dynamic column name in an application is usually a design smell. A fixed set of endpoints or
                a view is safer and easier to index
              </li>
            </ul>
            <CodeBlock
              title="Allowlist, not interpolation"
              language="typescript"
              code={`const COLUMNS = {
  created: 'created_at',
  total: 'total_cents',
  status: 'status',
} as const;

type ColumnKey = keyof typeof COLUMNS;

function resolveColumn(key: string): string {
  if (!Object.prototype.hasOwnProperty.call(COLUMNS, key)) {
    throw new Error('Unknown column');
  }
  return COLUMNS[key as ColumnKey];
}

const col = resolveColumn(request.query.groupBy as string);

// Identifier comes from our own constant; the value stays a parameter
const rows = await prisma.$queryRawUnsafe(
  'SELECT ' + col + ' AS key, count(*) AS n FROM orders WHERE tenant_id = $1 GROUP BY 1',
  tenantId
);`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="How does ORDER BY injection happen through a sort parameter?">
            <p>
              Sorting is the most common real-world injection hole in otherwise safe codebases, because{' '}
              <code>ORDER BY</code> takes an identifier and a direction, and neither can be a bound
              parameter. Developers reach for concatenation, and the sort parameter comes straight from a
              query string.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                An attacker can append a subquery to leak data, for example ordering by a{' '}
                <code>CASE</code> expression that reveals whether a condition is true
              </li>
              <li>
                Even without reading rows, timing differences in the sort make a blind attack possible
              </li>
              <li>
                Validate both parts: the column against an allowlist, and the direction against exactly{' '}
                <code>ASC</code> or <code>DESC</code>
              </li>
              <li>
                Watch out for the same problem in <code>LIMIT</code>, <code>OFFSET</code>, group by keys,
                and dynamically built <code>WHERE</code> fragments
              </li>
              <li>
                With Prisma, the cleanest fix is to map the sort key to a typed <code>orderBy</code> object
                and never build SQL at all
              </li>
              <li>
                Make sure the allowed sort columns are indexed, otherwise you have replaced a security bug
                with a performance bug
              </li>
            </ul>
            <CodeBlock
              title="The vulnerable pattern and the payload"
              language="sql"
              code={`-- Code: 'SELECT id, email FROM users ORDER BY ' + sort
-- Attacker sends sort = (CASE WHEN (SELECT current_setting('is_superuser')) = 'on'
--                              THEN email ELSE id::text END)

-- Server sees a query whose row order leaks a secret:
SELECT id, email FROM users
ORDER BY (CASE WHEN (SELECT current_setting('is_superuser')) = 'on'
               THEN email ELSE id::text END);`}
            />
            <CodeBlock
              title="Safe dynamic ordering via allowlist"
              language="typescript"
              code={`const SORT_MAP = { createdAt: 'created_at', email: 'email' } as const;

const col = SORT_MAP[sortKey as keyof typeof SORT_MAP];
if (!col) throw new Error('Invalid sort');

const dir = sortDir === 'asc' ? 'ASC' : 'DESC';

// Identifier and direction come from our allowlist; the value is parameterized
const rows = await prisma.$queryRawUnsafe(
  'SELECT id, email FROM users ORDER BY ' + col + ' ' + dir + ' LIMIT $1',
  limit
);`}
            />
            <CodeBlock
              title="Better: no SQL string at all"
              language="typescript"
              code={`const ORDER_BY = {
  createdAt: { createdAt: 'desc' },
  email: { email: 'asc' },
} as const;

const orderBy = ORDER_BY[sortKey as keyof typeof ORDER_BY] ?? ORDER_BY.createdAt;

const users = await prisma.user.findMany({
  orderBy,
  take: Math.min(Number(limit) || 20, 100),
  select: { id: true, email: true, createdAt: true },
});`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="How would you answer: our API still has SQL injection despite using Prisma - what do you check?">
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Any use of <code>$queryRawUnsafe</code> or <code>$executeRawUnsafe</code> with
                concatenation
              </li>
              <li>
                Dynamic <code>ORDER BY</code>, column names, or table names built from strings, since
                identifiers cannot be bound. Use allowlists
              </li>
              <li>Raw SQL in migrations, seed scripts, or cron jobs that interpolates env or user data</li>
              <li>
                Other clients: admin tools, reporting jobs, BI connectors, and hand-rolled <code>pg</code>{' '}
                queries that never went through Prisma
              </li>
              <li>
                Database functions using <code>EXECUTE</code> with concatenated arguments, especially{' '}
                <code>SECURITY DEFINER</code> ones
              </li>
              <li>
                Whether an attacker can influence <code>search_path</code> or call elevated functions
              </li>
              <li>
                Request objects spread directly into <code>where</code> or <code>data</code>, which is
                filter and mass-assignment abuse rather than classic injection
              </li>
              <li>
                Then reduce the impact: run the app as a least-privilege role, turn on statement logging for
                the suspect paths, and add a test that asserts the raw helpers are not used with template
                strings
              </li>
            </ul>
            <CodeBlock
              title="Find the risky call sites"
              language="bash"
              code={`# Any unsafe helper usage at all
rg -n 'queryRawUnsafe|executeRawUnsafe' --glob '!node_modules'

# Raw helpers built by concatenation
rg -n 'RawUnsafe\\(\\s*[^,)]*\\+' --glob '!node_modules'

# Dynamic ordering built from request data
rg -n 'ORDER BY .*\\+|orderBy:\\s*req' --glob '!node_modules'

# Dynamic SQL inside the database
# SELECT proname FROM pg_proc WHERE prosrc ILIKE '%EXECUTE%';`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

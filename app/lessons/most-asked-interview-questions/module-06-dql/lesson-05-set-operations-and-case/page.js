import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 5: Set Operations and CASE - Module 6 - Most Asked Interview Questions',
  description:
    'Most asked interview questions on UNION vs UNION ALL, INTERSECT and EXCEPT, the column count and type rules for set operations, CASE expressions, and CASE inside SUM for conditional counts.',
};

export default function M6L5SetOperationsAndCase() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 5: Set Operations and CASE</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Set operations stack two result sets on top of each other. <code>CASE</code> is the if/else of SQL.
          Together they cover most “reshape this result” questions.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="UNION vs UNION ALL — which should you use?">
            <p>
              <code>UNION</code> stacks two results and removes duplicates, which is slower.
              <code>UNION ALL</code> stacks them and keeps duplicates, which is faster.
              Use <code>UNION ALL</code> unless you really need unique rows.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Removing duplicates means sorting or hashing every row, so <code>UNION</code> costs real time and memory on large results</li>
              <li><code>UNION</code> compares the whole row, not one column. Two rows are duplicates only if every column matches</li>
              <li>If you know the two sides cannot overlap, <code>UNION ALL</code> gives the same answer for free</li>
              <li>A join combines tables side by side, adding columns. A union stacks them vertically, adding rows. Interviewers like to hear that distinction</li>
            </ul>
            <CodeBlock
              title="UNION ALL"
              language="sql"
              code={`SELECT email FROM customers
UNION ALL
SELECT email FROM leads;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What do INTERSECT and EXCEPT do?">
            <p>
              <code>INTERSECT</code> keeps rows that appear in <strong>both</strong> results.
              <code>EXCEPT</code> keeps rows from the first result that are <strong>not</strong> in the second.
              Other databases call <code>EXCEPT</code> by the name <code>MINUS</code>.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Both remove duplicates by default. Add <code>ALL</code> to keep them</li>
              <li>They compare whole rows, and NULL counts as equal to NULL here — unlike a normal <code>=</code> comparison. That makes them handy for comparing datasets</li>
              <li>Order matters for <code>EXCEPT</code>: A except B is not B except A. Order does not matter for <code>INTERSECT</code></li>
              <li>Real uses: comparing a table before and after a migration, finding rows present in staging but missing in production, and checking two versions of a query return the same thing</li>
              <li>For a single-table filter, <code>EXISTS</code> and <code>NOT EXISTS</code> are usually faster, because these operators must materialise and deduplicate both sides. Reach for set operations when you are comparing whole result sets</li>
              <li>Precedence: <code>INTERSECT</code> binds tighter than <code>UNION</code> and <code>EXCEPT</code>, so use parentheses when you mix them</li>
            </ul>
            <CodeBlock
              title="INTERSECT and EXCEPT"
              language="sql"
              code={`-- Emails that are both a customer and a lead
SELECT email FROM customers
INTERSECT
SELECT email FROM leads;

-- Leads who never became customers
SELECT email FROM leads
EXCEPT
SELECT email FROM customers;

-- Are two queries identical? Both directions should return zero rows
(SELECT id, email FROM users_old EXCEPT SELECT id, email FROM users_new)
UNION ALL
(SELECT id, email FROM users_new EXCEPT SELECT id, email FROM users_old);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What are the column and type rules for set operations?">
            <p>
              Both sides must return the <strong>same number of columns</strong>, in the same order, with
              compatible types. Column names come from the first query.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Different column counts is an immediate error</li>
              <li>Matching is by <em>position</em>, not by name. Two queries with the same column names in a different order will silently pair up the wrong columns if the types happen to fit</li>
              <li>Types must be compatible or implicitly castable. <code>integer</code> and <code>numeric</code> resolve fine; <code>text</code> and <code>integer</code> do not</li>
              <li>If one side has no value for a column, supply a literal or <code>NULL</code>, and cast it so Postgres knows the type: <code>NULL::text</code></li>
              <li>There is one <code>ORDER BY</code> for the whole statement, and it goes at the very end. It can only reference output column names or positions, not columns from one side only</li>
              <li><code>LIMIT</code> at the end also applies to the combined result. To limit one branch, wrap that branch in parentheses or a subquery</li>
            </ul>
            <CodeBlock
              title="Making both sides line up"
              language="sql"
              code={`-- Same column count, compatible types, explicit casts for the missing parts
SELECT id, name, 'customer'::text AS source, signed_up_at
FROM customers
UNION ALL
SELECT id, name, 'lead'::text     AS source, NULL::timestamptz
FROM leads
ORDER BY source, name              -- one ORDER BY, at the very end
LIMIT 100;                         -- applies to the combined result

-- Limit one branch: wrap it
(SELECT id, email FROM customers ORDER BY id LIMIT 10)
UNION ALL
(SELECT id, email FROM leads ORDER BY id LIMIT 10);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How do you use CASE expressions in SELECT?">
            <p>
              <code>CASE</code> picks a value based on conditions, like an if/else inside the query.
              You can use it in <code>SELECT</code>, <code>ORDER BY</code>, or inside <code>SUM</code>.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Conditions are checked top to bottom and the first true one wins, so order your branches from most specific to least</li>
              <li>Without an <code>ELSE</code>, a row that matches nothing gets NULL</li>
              <li>All the result branches must share a compatible type</li>
              <li>The short “simple” form <code>CASE col WHEN &apos;a&apos; THEN ...</code> only tests equality. The searched form with full conditions after <code>WHEN</code> is more flexible</li>
              <li>In <code>ORDER BY</code> it gives you a custom sort order, for example putting a specific status first</li>
            </ul>
            <CodeBlock
              title="CASE"
              language="sql"
              code={`SELECT
  id,
  total_cents,
  CASE
    WHEN total_cents >= 10000 THEN 'high'
    WHEN total_cents >= 2500 THEN 'medium'
    ELSE 'low'
  END AS value_tier
FROM orders;`}
            />
            <CodeBlock
              title="CASE for a custom sort order"
              language="sql"
              code={`SELECT id, status
FROM orders
ORDER BY
  CASE status
    WHEN 'failed'  THEN 1
    WHEN 'pending' THEN 2
    WHEN 'paid'    THEN 3
    ELSE 4
  END,
  created_at DESC;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How do you count or sum only some rows using CASE inside an aggregate?">
            <p>
              Put the <code>CASE</code> inside <code>SUM</code> or <code>COUNT</code>. This gives you several
              different conditional totals from one pass over the data, which is called a pivot.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><code>SUM(CASE WHEN cond THEN 1 ELSE 0 END)</code> counts the matching rows</li>
              <li><code>COUNT(CASE WHEN cond THEN 1 END)</code> does the same thing, because <code>COUNT</code> skips the NULL from the missing <code>ELSE</code>. Do not write <code>ELSE 0</code> there, or you count every row</li>
              <li><code>SUM(CASE WHEN cond THEN amount ELSE 0 END)</code> totals only the matching amounts</li>
              <li>PostgreSQL has cleaner syntax for the same thing: the <code>FILTER</code> clause. Prefer it in Postgres-only code, and know the <code>CASE</code> form because it is portable and still what most interviewers ask for</li>
              <li>The big win is doing this once instead of running one query per status, then dividing to get rates in the same row</li>
              <li>This is the standard way to turn rows into columns when you do not want the <code>crosstab</code> extension</li>
            </ul>
            <CodeBlock
              title="Conditional counts in one pass"
              language="sql"
              code={`SELECT
  date_trunc('day', created_at) AS day,
  COUNT(*)                                                   AS orders,
  SUM(CASE WHEN status = 'paid'   THEN 1 ELSE 0 END)          AS paid,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END)          AS failed,
  SUM(CASE WHEN status = 'paid' THEN total_cents ELSE 0 END)  AS paid_cents,
  ROUND(
    100.0 * SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) / COUNT(*),
    1
  )                                                          AS paid_pct
FROM orders
GROUP BY 1
ORDER BY 1;`}
            />
            <CodeBlock
              title="Same result with FILTER (PostgreSQL)"
              language="sql"
              code={`SELECT
  date_trunc('day', created_at) AS day,
  COUNT(*)                                        AS orders,
  COUNT(*) FILTER (WHERE status = 'paid')         AS paid,
  COUNT(*) FILTER (WHERE status = 'failed')       AS failed,
  SUM(total_cents) FILTER (WHERE status = 'paid') AS paid_cents
FROM orders
GROUP BY 1
ORDER BY 1;`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

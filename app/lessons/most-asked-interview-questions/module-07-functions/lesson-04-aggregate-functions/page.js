import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 4: Aggregate Functions - Module 7 - Most Asked Interview Questions',
  description:
    'Most asked PostgreSQL aggregate interview questions: COUNT SUM AVG with NULL, COUNT(*) vs COUNT(column), MIN and MAX, empty sets, the FILTER clause, conditional aggregation, string_agg, array_agg, and DISTINCT ON.',
};

export default function M7L4AggregateFunctions() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 4: Aggregate Functions</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          An aggregate function takes many rows and returns one value. The interview questions here are almost
          always really about NULL: which rows get counted, what an empty group returns, and how to count only
          some of the rows.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="How do COUNT, SUM, and AVG behave with NULL?">
            <p>
              Aggregates ignore <code>NULL</code> inputs. The one exception is <code>COUNT(*)</code>, which counts
              rows rather than looking at any column value.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <code>COUNT(column)</code> counts only the rows where that column has a value.
              </li>
              <li>
                <code>SUM</code> skips NULL rows. It does not treat them as 0.
              </li>
              <li>
                <code>AVG</code> divides by the number of non-NULL values, not by the number of rows. So NULLs
                pull the average up or down compared to treating them as zero.
              </li>
              <li>
                <code>AVG</code> of an empty set is <code>NULL</code>, not 0.
              </li>
            </ul>
            <CodeBlock
              title="Aggregates"
              language="sql"
              code={`SELECT
  COUNT(*) AS all_rows,
  COUNT(deleted_at) AS soft_deleted,
  SUM(total_cents) AS revenue,
  AVG(total_cents) AS avg_order
FROM orders;`}
            />
            <p>
              If you want NULL to count as zero, say so explicitly with <code>COALESCE</code> inside the
              aggregate. Notice this changes the answer, which is exactly why interviewers ask.
            </p>
            <CodeBlock
              title="Treating NULL as zero"
              language="sql"
              code={`-- Rows: 10, 20, NULL
SELECT
  AVG(amount)               AS ignores_null, -- 15
  AVG(COALESCE(amount, 0))  AS null_is_zero  -- 10
FROM payments;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="What is the difference between COUNT(*), COUNT(column), and COUNT(DISTINCT column)?">
            <p>
              They answer three different questions, and mixing them up is one of the most common SQL mistakes.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <code>COUNT(*)</code> is &quot;how many rows&quot;. It never returns NULL and never skips a row.
              </li>
              <li>
                <code>COUNT(column)</code> is &quot;how many rows have a value in this column&quot;. NULLs are
                skipped.
              </li>
              <li>
                <code>COUNT(DISTINCT column)</code> is &quot;how many different values&quot;. Duplicates collapse
                and NULLs are still skipped.
              </li>
            </ul>
            <CodeBlock
              title="Three counts, three answers"
              language="sql"
              code={`-- phone values: '111', '111', NULL, '222'
SELECT
  COUNT(*)               AS rows_total,     -- 4
  COUNT(phone)           AS has_phone,      -- 3
  COUNT(DISTINCT phone)  AS unique_phones   -- 2
FROM users;`}
            />
            <p>
              A very common interview trap is counting rows on the many side of a join. After a join, one user with
              three orders becomes three rows, so <code>COUNT(*)</code> counts orders and not users.
            </p>
            <CodeBlock
              title="Counting through a join"
              language="sql"
              code={`SELECT
  COUNT(*)                 AS order_rows,
  COUNT(DISTINCT u.id)     AS distinct_users
FROM users u
JOIN orders o ON o.user_id = u.id;`}
            />
            <p>
              On performance: <code>COUNT(*)</code> is not free. PostgreSQL must check row visibility, so counting
              a huge table is a full scan. For a rough number, read the planner estimate instead.
            </p>
            <CodeBlock
              title="Approximate row count"
              language="sql"
              code={`SELECT reltuples::bigint AS approx_rows
FROM pg_class
WHERE relname = 'orders';`}
            />
            <CodeBlock
              title="Prisma"
              language="typescript"
              code={`// COUNT(*)
const total = await prisma.order.count();

// COUNT(column): only rows where the field is not null
const withPhone = await prisma.user.count({
  where: { phone: { not: null } },
});

// COUNT(DISTINCT column) needs distinct in the aggregate
const distinctUsers = await prisma.order.findMany({
  distinct: ['userId'],
  select: { userId: true },
});`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="How do MIN and MAX work, and what types can they use?">
            <p>
              <code>MIN</code> returns the smallest value in a group and <code>MAX</code> the largest. They skip
              NULL, and they work on anything that has an ordering: numbers, text, dates, timestamps, and even
              booleans.
            </p>
            <CodeBlock
              title="MIN and MAX"
              language="sql"
              code={`SELECT
  MIN(total_cents) AS cheapest,
  MAX(total_cents) AS priciest,
  MIN(created_at)  AS first_order_at,
  MAX(created_at)  AS last_order_at,
  MIN(status)      AS alphabetically_first
FROM orders;`}
            />
            <p>
              Do not confuse them with <code>LEAST</code> and <code>GREATEST</code>.
              <code>MIN</code> and <code>MAX</code> go down a column across many rows.
              <code>LEAST</code> and <code>GREATEST</code> go across several values inside one row.
            </p>
            <p>
              The classic trap: <code>MAX</code> gives you the largest value, not the row it came from. Selecting
              other columns alongside it does not give you that row&apos;s data.
            </p>
            <CodeBlock
              title="MAX gives a value, not a row"
              language="sql"
              code={`-- Wrong idea: id is not from the newest row
SELECT user_id, MAX(created_at), id FROM orders GROUP BY user_id, id;

-- Right: DISTINCT ON returns the whole newest row per user
SELECT DISTINCT ON (user_id) user_id, id, total_cents, created_at
FROM orders
ORDER BY user_id, created_at DESC;`}
            />
            <p>
              <code>MIN</code> and <code>MAX</code> on an indexed column with no <code>GROUP BY</code> are very
              fast, because PostgreSQL can jump straight to one end of the index instead of scanning.
            </p>
          </InterviewQACard>

          <InterviewQACard level="Junior" question="What does an aggregate return for an empty set?">
            <p>
              This depends on whether there is a <code>GROUP BY</code>, and it catches people out constantly.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                With no <code>GROUP BY</code>, an aggregate query always returns exactly one row.
                <code>COUNT</code> returns 0, but <code>SUM</code>, <code>AVG</code>, <code>MIN</code> and
                <code>MAX</code> return NULL.
              </li>
              <li>
                With a <code>GROUP BY</code>, no matching rows means no groups, so you get zero rows back. Not a
                row of zeroes.
              </li>
            </ul>
            <CodeBlock
              title="Empty set results"
              language="sql"
              code={`SELECT COUNT(*), SUM(total_cents), AVG(total_cents), MAX(total_cents)
FROM orders
WHERE 1 = 0;
-- 0, NULL, NULL, NULL  (one row)

SELECT status, COUNT(*)
FROM orders
WHERE 1 = 0
GROUP BY status;
-- no rows at all`}
            />
            <p>
              This is why dashboards show blank instead of a zero. Wrap the aggregate in <code>COALESCE</code> when
              a number is required.
            </p>
            <CodeBlock
              title="Always return a number"
              language="sql"
              code={`SELECT COALESCE(SUM(total_cents), 0) AS revenue
FROM orders
WHERE created_at >= NOW() - INTERVAL '1 day';`}
            />
            <p>
              Watch out for <code>SUM</code> over no rows in application code too. Prisma returns
              <code>null</code> for <code>_sum</code> when nothing matched, so guard it before doing arithmetic.
            </p>
            <CodeBlock
              title="Prisma"
              language="typescript"
              code={`const result = await prisma.order.aggregate({
  _sum: { totalCents: true },
  _avg: { totalCents: true },
  where: { status: 'paid' },
});

const revenue = result._sum.totalCents ?? 0; // null when no rows matched`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="What is the FILTER clause on aggregates?">
            <p>
              <code>FILTER (WHERE ...)</code> applies a condition to a single aggregate. It means you can count or
              sum different subsets of the same rows in one pass, instead of running several queries or joining
              subqueries together.
            </p>
            <CodeBlock
              title="FILTER"
              language="sql"
              code={`SELECT
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE status = 'paid') AS paid,
  SUM(total_cents) FILTER (WHERE status = 'paid') AS paid_revenue
FROM orders;`}
            />
            <p>
              The difference from a plain <code>WHERE</code> clause is important: <code>WHERE</code> removes rows
              from the whole query, so you would lose the overall total. <code>FILTER</code> narrows only that one
              aggregate.
            </p>
            <CodeBlock
              title="FILTER combined with GROUP BY"
              language="sql"
              code={`SELECT
  date_trunc('month', created_at) AS month,
  COUNT(*)                                        AS orders,
  COUNT(*) FILTER (WHERE status = 'refunded')     AS refunds,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE status = 'refunded')
    / NULLIF(COUNT(*), 0),
    2
  ) AS refund_percent
FROM orders
GROUP BY 1
ORDER BY 1;`}
            />
            <p>
              <code>FILTER</code> is standard SQL and works on any aggregate, including
              <code>array_agg</code> and <code>string_agg</code>. Prisma has no equivalent, so this is a raw query
              in an application.
            </p>
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How do you do conditional aggregation with CASE?">
            <p>
              Before <code>FILTER</code> existed, the standard trick was putting a <code>CASE</code> inside the
              aggregate. You still see it everywhere, and it still has uses, so you should be able to write both.
            </p>
            <p>
              The trick relies on aggregates skipping NULL. A <code>CASE</code> with no <code>ELSE</code> returns
              NULL when it does not match, so those rows drop out of the count.
            </p>
            <CodeBlock
              title="CASE inside an aggregate"
              language="sql"
              code={`SELECT
  COUNT(*)                                             AS total,
  COUNT(CASE WHEN status = 'paid' THEN 1 END)          AS paid,
  SUM(CASE WHEN status = 'paid' THEN total_cents ELSE 0 END) AS paid_revenue
FROM orders;`}
            />
            <p>Two mistakes to avoid with this pattern:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <code>SUM(CASE WHEN ... THEN 1 ELSE 0 END)</code> counts correctly, but
                <code>COUNT(CASE WHEN ... THEN 1 ELSE 0 END)</code> is wrong. <code>COUNT</code> counts the zeroes
                too, because 0 is a value, so you get the total row count every time.
              </li>
              <li>
                <code>AVG(CASE WHEN ... THEN amount ELSE 0 END)</code> is not the average of matching rows. The
                zeroes are included in the divisor. Use <code>FILTER</code>, or leave off the
                <code>ELSE</code>.
              </li>
            </ul>
            <CodeBlock
              title="The COUNT versus SUM mistake"
              language="sql"
              code={`SELECT
  SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END)   AS correct,
  COUNT(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) AS wrong,
  COUNT(*) FILTER (WHERE status = 'paid')            AS clearest
FROM orders;`}
            />
            <p>
              The other real use of <code>CASE</code> aggregation is pivoting, which means turning row values into
              columns. There is no <code>FILTER</code>-free alternative that reads as well for a wide report.
            </p>
            <CodeBlock
              title="Pivot statuses into columns"
              language="sql"
              code={`SELECT
  u.id,
  u.email,
  COUNT(*) FILTER (WHERE o.status = 'paid')     AS paid_orders,
  COUNT(*) FILTER (WHERE o.status = 'pending')  AS pending_orders,
  COUNT(*) FILTER (WHERE o.status = 'refunded') AS refunded_orders
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
GROUP BY u.id, u.email;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What is DISTINCT ON in PostgreSQL?">
            <p>
              <code>DISTINCT ON (expr)</code> keeps the first row for each distinct value of that expression,
              where &quot;first&quot; is decided by <code>ORDER BY</code>. It is the shortest way to get the
              latest row per group without a window function.
            </p>
            <p>
              The rule to remember: the leftmost <code>ORDER BY</code> expressions must match the
              <code>DISTINCT ON</code> expressions. Then you add the column that decides which row wins.
            </p>
            <CodeBlock
              title="DISTINCT ON — latest order per user"
              language="sql"
              code={`SELECT DISTINCT ON (user_id)
  user_id, id, total_cents, created_at
FROM orders
ORDER BY user_id, created_at DESC;`}
            />
            <p>
              It is PostgreSQL-specific. The portable equivalent uses <code>ROW_NUMBER</code>, which is more
              verbose but works everywhere and lets you keep the second or third row too.
            </p>
            <CodeBlock
              title="The portable version"
              language="sql"
              code={`SELECT user_id, id, total_cents, created_at
FROM (
  SELECT *,
         ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) AS rn
  FROM orders
) ranked
WHERE rn = 1;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="Compare string_agg and array_agg.">
            <p>
              Both collapse many rows into one value. <code>array_agg</code> builds a real array.
              <code>string_agg</code> builds one piece of text joined by a separator you choose, which is great
              for CSV-style output.
            </p>
            <p>
              Both accept their own <code>ORDER BY</code> inside the parentheses. Without it the order is whatever
              the executor happened to produce, which is a common source of flaky test failures.
            </p>
            <CodeBlock
              title="Advanced helpers"
              language="sql"
              code={`SELECT
  department_id,
  string_agg(name, ', ' ORDER BY name) AS names,
  array_agg(id) AS ids
FROM employees
GROUP BY department_id;`}
            />
            <CodeBlock
              title="Ordering, deduplicating, and skipping NULL"
              language="sql"
              code={`SELECT
  order_id,
  string_agg(DISTINCT sku, ',' ORDER BY sku)        AS skus,
  array_agg(sku ORDER BY created_at)                AS skus_in_order,
  array_agg(sku) FILTER (WHERE sku IS NOT NULL)     AS non_null_only,
  cardinality(array_agg(sku))                       AS item_count
FROM order_items
GROUP BY order_id;`}
            />
            <p>
              Practical guidance on which to use. Return an array when a program will consume the result, because
              a driver like Prisma hands it back as a real JavaScript array and there is nothing to parse. Return
              a string only when a human reads it, or when you are building an export file. If a value could
              itself contain the separator, an array avoids an ambiguous result.
            </p>
            <p>
              For nested objects, <code>jsonb_agg</code> is usually the better tool than either. Lesson 5 covers
              JSON in detail.
            </p>
            <CodeBlock
              title="One row per order with its items"
              language="sql"
              code={`SELECT
  o.id,
  jsonb_agg(
    jsonb_build_object('sku', i.sku, 'qty', i.quantity)
    ORDER BY i.sku
  ) FILTER (WHERE i.id IS NOT NULL) AS items
FROM orders o
LEFT JOIN order_items i ON i.order_id = o.id
GROUP BY o.id;`}
            />
            <p>
              The <code>FILTER</code> matters on that <code>LEFT JOIN</code>. Without it, an order with no items
              produces an array holding one object full of NULLs instead of an empty result.
            </p>
          </InterviewQACard>

        </section>
      </div>
    </LessonLayout>
  );
}

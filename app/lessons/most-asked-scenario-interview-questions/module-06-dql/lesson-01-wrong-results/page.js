import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: "Lesson 1: Wrong Results - Production Scenarios",
  description: "How to fix joins that drop or duplicate rows",
};

export default function ScenarioM06L01() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 1: Wrong Results</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Support says the number is wrong. The SQL ran without an error.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>
          <InterviewQACard level="Junior" question="A dashboard of orders is missing orders that have no line items. How do you fix it?">
            <p><strong>What you see:</strong> Orders with items show up. Empty orders do not. There is no error.</p>
            <p><strong>Why it happens:</strong> An INNER JOIN drops the parent when no child matches.</p>
            <p><strong>How to confirm:</strong> Count orders, then count the join. The difference is the missing set.</p>
            <p><strong>How to fix:</strong> Use LEFT JOIN from orders to items if you want every order. Filter child columns in the ON clause, not in WHERE, or you turn the left join back into an inner join.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SELECT o.id
FROM orders o
LEFT JOIN order_items i ON i.order_id = o.id
WHERE o.created_at > now() - interval '1 day';`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>
          <InterviewQACard level="Mid" question="Revenue is double or triple the payments report. How do you fix it?">
            <p><strong>What you see:</strong> The total grows when you add another join. One order with three items is counted three times.</p>
            <p><strong>Why it happens:</strong> You summed a parent column after joining children. The parent row is repeated once per child.</p>
            <p><strong>How to confirm:</strong> Select the order id and see duplicates before you aggregate. Compare sum of distinct orders with the joined sum.</p>
            <p><strong>How to fix:</strong> Aggregate the children in a subquery or CTE first, then join one row per order. Or sum only the child amounts, not the parent total.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SELECT o.id, o.total
FROM orders o
JOIN (
  SELECT order_id, sum(qty * price) AS items_total
  FROM order_items
  GROUP BY order_id
) i ON i.order_id = o.id;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>
          <InterviewQACard level="Senior" question="A customer search returns rows the user should not see, but only when a filter is omitted. How do you fix it?">
            <p><strong>What you see:</strong> With a status filter the list is right. Without it, other tenants appear.</p>
            <p><strong>Why it happens:</strong> The tenant predicate was added only on one branch of an OR, or a view does not include tenant_id and the app forgot the WHERE.</p>
            <p><strong>How to confirm:</strong> Print the SQL. Look for OR that makes the tenant check optional. EXPLAIN is not the bug. The predicate is.</p>
            <p><strong>How to fix:</strong> Put tenant_id in every query and in row level security so a missing filter cannot leak rows. Parenthesize OR carefully.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SELECT * FROM orders
WHERE tenant_id = 7
  AND (status = 'open' OR status = 'pending');`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: "Lesson 1: Cascade Deletes and Orphans - Production Scenarios",
  description: "How to fix cascade damage and orphan rows",
};

export default function ScenarioM19L01() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 1: Cascade Deletes and Orphans</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          The foreign key is either too sharp or missing.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>
          <InterviewQACard level="Junior" question="Deleting a category removed every product in it. How do you fix the data and the rule?">
            <p><strong>What you see:</strong> One DELETE on categories. Products are gone. The app did not delete products.</p>
            <p><strong>Why it happens:</strong> ON DELETE CASCADE did it.</p>
            <p><strong>How to confirm:</strong> The constraint definition says ON DELETE CASCADE.</p>
            <p><strong>How to fix:</strong> Restore products from backup into the table. Change the foreign key to RESTRICT or SET NULL, depending on whether a product may exist without a category. Soft-delete categories instead of deleting them.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`ALTER TABLE products DROP CONSTRAINT products_category_fk;
ALTER TABLE products
  ADD CONSTRAINT products_category_fk
  FOREIGN KEY (category_id) REFERENCES categories (id)
  ON DELETE RESTRICT;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>
          <InterviewQACard level="Mid" question="The product page crashes on some rows because the category id points at nothing. How do you fix it?">
            <p><strong>What you see:</strong> A join returns no category. The app assumes the category exists.</p>
            <p><strong>Why it happens:</strong> The column was added without a foreign key, or the key was dropped for a load and never put back. Categories were deleted anyway.</p>
            <p><strong>How to confirm:</strong> A left join anti-join finds product rows whose category_id is not in categories.</p>
            <p><strong>How to fix:</strong> Repair or null out the bad ids. Add the foreign key as NOT VALID, then VALIDATE after the data is clean. Fix the app to handle a missing category until validation finishes.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SELECT p.id FROM products p
LEFT JOIN categories c ON c.id = p.category_id
WHERE p.category_id IS NOT NULL AND c.id IS NULL;

ALTER TABLE products
  ADD CONSTRAINT products_category_fk
  FOREIGN KEY (category_id) REFERENCES categories (id)
  NOT VALID;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>
          <InterviewQACard level="Senior" question="You need to delete a tenant and everything they own, without cascading through shared lookup tables. How do you do it safely?">
            <p><strong>What you see:</strong> A tenant close-account request. Blind cascade would delete shared plans or shared tags.</p>
            <p><strong>Why it happens:</strong> Not every foreign key should cascade. Some children are private to the tenant. Some are global.</p>
            <p><strong>How to confirm:</strong> Draw the graph of foreign keys from the tenant. Mark which tables are tenant-owned.</p>
            <p><strong>How to fix:</strong> Delete tenant-owned tables in child-to-parent order inside a transaction, keyed by tenant_id. Do not cascade from a shared table. Dry-run with counts. Take a backup first. If the graph is huge, batch by tenant child ids and keep a job row so it can resume.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`DELETE FROM order_items oi
USING orders o
WHERE oi.order_id = o.id AND o.tenant_id = 42;`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

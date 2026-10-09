import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: "Lesson 2: Junction Tables and Hierarchies - Production Scenarios",
  description: "How to fix duplicate links and hierarchy cycles",
};

export default function ScenarioM19L02() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 2: Junction Tables and Hierarchies</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Many-to-many and trees fail in production when the constraint is missing or the load is unbounded.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>
          <InterviewQACard level="Junior" question="The same tag appears twice on one post. How do you fix it?">
            <p><strong>What you see:</strong> The UI shows duplicate tags. post_tags has two rows with the same pair.</p>
            <p><strong>Why it happens:</strong> The junction table has no primary key on (post_id, tag_id). The app retried an insert.</p>
            <p><strong>How to confirm:</strong> Group by the pair and look for count greater than 1.</p>
            <p><strong>How to fix:</strong> Delete the extra rows. Add a primary key on the pair. Use ON CONFLICT DO NOTHING on insert.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`DELETE FROM post_tags a
USING post_tags b
WHERE a.ctid < b.ctid
  AND a.post_id = b.post_id
  AND a.tag_id = b.tag_id;

ALTER TABLE post_tags ADD PRIMARY KEY (post_id, tag_id);`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>
          <InterviewQACard level="Mid" question="A category tree page times out or never returns. How do you fix it?">
            <p><strong>What you see:</strong> The query walks parent_id. One category is its own ancestor. The recursive CTE hits the recursion limit or loops until timeout.</p>
            <p><strong>Why it happens:</strong> Nothing stops a cycle. A bad update set parent_id to a descendant.</p>
            <p><strong>How to confirm:</strong> Walk the chain for that id and see a repeat.</p>
            <p><strong>How to fix:</strong> Break the cycle by setting the bad parent_id to null. Add a check or a trigger that rejects a parent that is already a descendant. Cap recursive queries with a depth limit so one bad row cannot hang the request.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`UPDATE categories SET parent_id = NULL WHERE id = 15;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>
          <InterviewQACard level="Senior" question="Prisma include on a many-to-many loads far more data than the screen needs and the API times out. How do you fix it?">
            <p><strong>What you see:</strong> One post request loads every tag, and each tag loads every post. Memory spikes.</p>
            <p><strong>Why it happens:</strong> The include follows the relation in both directions without a take or a select.</p>
            <p><strong>How to confirm:</strong> The SQL log shows a huge IN list or a second query that returns hundreds of thousands of link rows.</p>
            <p><strong>How to fix:</strong> Select only the fields the screen needs. Limit the relation. Do not include the reverse relation. If you need counts, query the count instead of the rows.</p>
            <CodeBlock
              title="App-side fix"
              language="typescript"
              code={`const post = await prisma.post.findUnique({
  where: { id },
  select: {
    id: true,
    title: true,
    tags: { select: { tag: { select: { name: true } } }, take: 20 },
  },
});`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

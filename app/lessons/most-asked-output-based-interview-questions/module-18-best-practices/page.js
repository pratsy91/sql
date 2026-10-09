import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';
import InterviewQACard from '../../../components/InterviewQACard';

export const metadata = {
  title: 'Module 18: Best Practices - Output-Based Interview Questions',
  description: 'Spot wrong pagination/SELECT */upsert patterns and give the corrected output-producing code',
};

export default function OutputModule18() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Module 18: Best Practices</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Given a “working” snippet, what surprising output does it cause, and what is the right code?
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard
            level="Junior"
            question="SELECT * FROM users in an API. What extra output risk?"
          >
            <p>
              Password hashes, tokens, PII columns leak. Prisma equivalent: <code>findMany()</code> with no{' '}
              <code>select</code> returns every scalar.
            </p>
            <CodeBlock
              title="Correct"
              language="typescript"
              code={`await prisma.user.findMany({
  select: { id: true, email: true, name: true },
});`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard
            level="Mid"
            question="Webhook handler: create() every time. Duplicate delivery output?"
          >
            <p>
              Second call: <code>P2002</code> or duplicate rows if no unique. Right: idempotent upsert /{' '}
              <code>ON CONFLICT DO NOTHING</code>.
            </p>
            <CodeBlock
              title="Correct"
              language="typescript"
              code={`await prisma.webhookEvent.upsert({
  where: { id: eventId },
  create: { id: eventId, payload },
  update: {},
});`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard
            level="Senior"
            question="paginate with skip: page * 20 on a busy table. User reports duplicate/missing rows between pages. Why?"
          >
            <p>
              OFFSET is unstable under concurrent inserts. Output set shifts. Keyset/cursor pagination is the fix.
            </p>
            <CodeBlock
              title="Correct"
              language="typescript"
              code={`await prisma.post.findMany({
  take: 20,
  skip: 1,
  cursor: { id: lastId },
  orderBy: { id: 'desc' },
});`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

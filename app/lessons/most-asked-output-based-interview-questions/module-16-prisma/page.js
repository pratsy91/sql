import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';
import InterviewQACard from '../../../components/InterviewQACard';

export const metadata = {
  title: 'Module 16: Prisma - Output-Based Interview Questions',
  description:
    'Given Prisma Client code, predict the result, error code, or write the corrected snippet — most asked',
};

export default function OutputModule16() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Module 16: Prisma ORM</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Densest Prisma output set: given Client code, what comes back — or the right version if it is wrong.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard
            level="Junior"
            question="findUnique({ where: { email: 'missing@x.com' } }). Return value?"
          >
            <p>
              <code>null</code>, not a throw. <code>findUniqueOrThrow</code> throws <code>P2025</code>.
            </p>
          </InterviewQACard>

          <InterviewQACard
            level="Junior"
            question="This code is supposed to load one user by name. What is wrong?"
          >
            <CodeBlock
              title="Given (wrong)"
              language="typescript"
              code={`await prisma.user.findUnique({ where: { name: 'Ann' } });`}
            />
            <p>
              <code>findUnique</code> requires a unique field / unique compound. <code>name</code> is not unique →
              compile/runtime validation error.
            </p>
            <CodeBlock
              title="Correct"
              language="typescript"
              code={`await prisma.user.findFirst({ where: { name: 'Ann' } });`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Junior"
            question="update({ where: { id: 1 }, data: { name: 'A' } }) when id 1 is missing. Output?"
          >
            <p>
              Throws <code>P2025</code> (record not found). <code>updateMany</code> returns <code>{'{ count: 0 }'}</code>{' '}
              and does not throw.
            </p>
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard
            level="Mid"
            question="create with email that already exists. Error code? What is the retry pattern?"
          >
            <p>
              <code>P2002</code>. Catch then <code>findUnique</code> or use <code>upsert</code>.
            </p>
            <CodeBlock
              title="Correct upsert"
              language="typescript"
              code={`await prisma.user.upsert({
  where: { email: 'a@x.com' },
  create: { email: 'a@x.com', name: 'Ann' },
  update: { name: 'Ann' },
});`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="delete({ where: { id: 1 } }) with child orders FK RESTRICT. Output?"
          >
            <p>
              <code>P2003</code> foreign key. Fix data (delete children) or set <code>onDelete: Cascade</code> in a
              migration — not only in TS.
            </p>
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="findMany({ where: { posts: { some: { published: true } } } }). Users with only unpublished posts?"
          >
            <p>
              They are <strong>excluded</strong>. <code>{'every: { published: true }'}</code> requires all posts
              published (users with zero posts: <code>every</code> is vacuously true — another gotcha).
            </p>
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="include: { posts: true } on a user with 10k posts. What is the output problem?"
          >
            <p>
              Huge payload / memory. Correct: nest <code>take</code> / <code>select</code>.
            </p>
            <CodeBlock
              title="Correct"
              language="typescript"
              code={`await prisma.user.findUnique({
  where: { id: 1 },
  select: {
    id: true,
    posts: { take: 20, orderBy: { createdAt: 'desc' }, select: { id: true, title: true } },
  },
});`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard
            level="Senior"
            question="$transaction array: second query throws. First create already ran. Final DB state?"
          >
            <p>
              Both rolled back (interactive/sequential transaction). If you used two awaits <em>outside</em>{' '}
              <code>$transaction</code>, the first commit stays — that is the wrong code.
            </p>
          </InterviewQACard>

          <InterviewQACard
            level="Senior"
            question="groupBy by status without having; you then filter in JS. Why do interviews still want having?"
          >
            <p>
              Client-side filter still loads all groups. <code>having</code> pushes the predicate to SQL (smaller
              result). Wrong: fetch everything then <code>.filter</code>.
            </p>
            <CodeBlock
              title="Correct"
              language="typescript"
              code={`await prisma.order.groupBy({
  by: ['status'],
  _count: { _all: true },
  having: { status: { _count: { gt: 10 } } },
});`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Senior"
            question="Prisma middleware vs client extension: old code uses $use. What is the modern output/API?"
          >
            <p>
              <code>$use</code> middleware is deprecated in Prisma 5. <code>$extends</code> query/model/result
              extensions are the replacement. Interviews at experienced level expect that name drop.
            </p>
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

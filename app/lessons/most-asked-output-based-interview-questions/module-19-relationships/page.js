import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';
import InterviewQACard from '../../../components/InterviewQACard';

export const metadata = {
  title: 'Module 19: Relationships - Output-Based Interview Questions',
  description: 'Predict join fan-out, cascade deletes, recursive CTE rows, Prisma include mistakes',
};

export default function OutputModule19() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Module 19: Relationships &amp; Schema Design</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Given schema + query, how many rows / which children remain / what Prisma returns.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard
            level="Junior"
            question="1:1 User-Profile. LEFT JOIN profile. User without profile. Output of p.id?"
          >
            <p>
              <code>NULL</code> profile columns. INNER JOIN would drop the user entirely.
            </p>
          </InterviewQACard>

          <InterviewQACard
            level="Junior"
            question="Prisma include: { profile: true } when profile is optional and missing. Shape of result?"
          >
            <p>
              <code>profile: null</code>, not omitted. Code that does <code>user.profile.bio</code> throws in JS —
              optional chain.
            </p>
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard
            level="Mid"
            question="Student-Course M:N via enrollments. JOIN all three without aggregating. Student in 3 courses. Row count?"
          >
            <p>
              <strong>3 rows</strong> for that student (fan-out). Interviewers ask why COUNT(*) overcounts students.
              Fix: <code>COUNT(DISTINCT student_id)</code> or aggregate first.
            </p>
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="This Prisma M:N connect is wrong. What happens?"
          >
            <CodeBlock
              title="Given (wrong)"
              language="typescript"
              code={`await prisma.student.update({
  where: { id: 1 },
  data: { courses: { create: { id: 9 } } },
});`}
            />
            <p>
              Tries to <strong>create a Course</strong> with PK 9, not enroll in existing course 9. Use{' '}
              <code>connect</code>.
            </p>
            <CodeBlock
              title="Correct"
              language="typescript"
              code={`await prisma.student.update({
  where: { id: 1 },
  data: { courses: { connect: { id: 9 } } },
});`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard
            level="Senior"
            question="Adjacency list: CEO → 2 VPs → 4 staff. Recursive CTE from CEO. How many rows if you forget UNION ALL termination?"
          >
            <p>
              A correct recursive CTE returns 1+2+4 = <strong>7</strong>. A cycle without a visited-set can{' '}
              <strong>infinite-loop</strong> until <code>max_recursion</code> / statement timeout.
            </p>
          </InterviewQACard>

          <InterviewQACard
            level="Senior"
            question="ON DELETE CASCADE from tenant → all child tables. DELETE tenant. Output row counts conceptually?"
          >
            <p>
              One tenant delete can remove orders, items, audit rows — often “too successful”. Interviews want
              Restrict + explicit jobs, or soft-delete, not surprise cascades.
            </p>
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

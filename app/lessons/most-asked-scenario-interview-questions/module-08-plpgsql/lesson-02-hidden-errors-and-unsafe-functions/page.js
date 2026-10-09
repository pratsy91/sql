import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: "Lesson 2: Hidden Errors and Unsafe Functions - Production Scenarios",
  description: "How to fix swallowed exceptions and unsafe definer functions",
};

export default function ScenarioM08L02() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 2: Hidden Errors and Unsafe Functions</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          The function returns success. The data or the permissions are wrong.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>
          <InterviewQACard level="Junior" question="A function returns empty instead of failing when the lookup misses. Bugs are invisible. How do you fix it?">
            <p><strong>What you see:</strong> The API returns 200 and an empty payload. The log is quiet.</p>
            <p><strong>Why it happens:</strong> An EXCEPTION WHEN OTHERS block swallows the error and returns NULL.</p>
            <p><strong>How to confirm:</strong> Read the function. Search for WHEN OTHERS.</p>
            <p><strong>How to fix:</strong> Remove the blanket handler. Catch only the error you expect, and re-raise anything else with RAISE.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`EXCEPTION
  WHEN unique_violation THEN
    RETURN NULL;
  WHEN OTHERS THEN
    RAISE;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>
          <InterviewQACard level="Mid" question="A function works in psql as admin and fails as the app with &quot;relation does not exist&quot;. How do you fix it?">
            <p><strong>What you see:</strong> Same function, two roles, two results.</p>
            <p><strong>Why it happens:</strong> search_path inside the function does not include the table schema. A SECURITY DEFINER function is especially unsafe if search_path is not pinned, because a user can shadow objects.</p>
            <p><strong>How to confirm:</strong> SHOW search_path as the app role. Read the function definition for SET search_path.</p>
            <p><strong>How to fix:</strong> Set search_path on the function to the schema you trust. Schema-qualify every table inside the function.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`ALTER FUNCTION app.place_order(bigint) SET search_path = app, pg_temp;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>
          <InterviewQACard level="Senior" question="A low-privilege user can read salaries through a function. How do you fix it?">
            <p><strong>What you see:</strong> The user cannot SELECT the salaries table, but SELECT app.payroll(id) returns the numbers.</p>
            <p><strong>Why it happens:</strong> The function is SECURITY DEFINER and runs as the owner, who can read salaries. It does not check who is calling.</p>
            <p><strong>How to confirm:</strong> prosecdef is true. The owner is a privileged role.</p>
            <p><strong>How to fix:</strong> Change it to SECURITY INVOKER unless definer is required. If it must be definer, check the caller, pin search_path, and grant EXECUTE only to the role that needs it. Revoke EXECUTE from PUBLIC.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`ALTER FUNCTION app.payroll(bigint) SECURITY INVOKER;
REVOKE ALL ON FUNCTION app.payroll(bigint) FROM PUBLIC;`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

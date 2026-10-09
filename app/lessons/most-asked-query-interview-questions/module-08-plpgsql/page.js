import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';
import InterviewQACard from '../../../components/InterviewQACard';

export const metadata = {
  title: 'Module 8: PL/pgSQL - Most Asked Query Interview Questions',
  description: 'Most asked function, trigger, and recursive SQL interview snippets with Prisma callouts',
};

export default function Module08PlpgsqlQueries() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Module 8: PL/pgSQL</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Most asked “write a function / trigger” interview problems. Prefer set-based SQL when possible.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="Write a SQL function that returns a scalar (bonus from salary).">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`CREATE OR REPLACE FUNCTION bonus(p_salary numeric)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT ROUND(p_salary * 0.10, 2);
$$;

SELECT name, salary, bonus(salary) FROM employees;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="Write a function that returns a table of users.">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`CREATE OR REPLACE FUNCTION active_users()
RETURNS TABLE (id bigint, email text)
LANGUAGE sql
AS $$
  SELECT id, email FROM users WHERE is_active = TRUE;
$$;

SELECT * FROM active_users();`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="Write a PL/pgSQL function with IF and EXCEPTION.">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`CREATE OR REPLACE FUNCTION debit(p_id bigint, p_amount numeric)
RETURNS numeric
LANGUAGE plpgsql
AS $$
DECLARE v_balance numeric;
BEGIN
  SELECT balance INTO STRICT v_balance FROM accounts WHERE id = p_id FOR UPDATE;
  IF v_balance < p_amount THEN
    RAISE EXCEPTION 'insufficient funds';
  END IF;
  UPDATE accounts SET balance = balance - p_amount WHERE id = p_id
    RETURNING balance INTO v_balance;
  RETURN v_balance;
EXCEPTION
  WHEN NO_DATA_FOUND THEN
    RAISE EXCEPTION 'account % not found', p_id;
END;
$$;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Write a BEFORE INSERT trigger that sets updated_at / lower(email).">
            <CodeBlock
              title="SQL"
              language="sql"
              code={`CREATE OR REPLACE FUNCTION users_biu()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.email := LOWER(NEW.email);
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER users_biu
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION users_biu();`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard
            level="Senior"
            question="Prefer a recursive CTE over a loop: walk a parent_id tree in one query."
          >
            <CodeBlock
              title="SQL"
              language="sql"
              code={`WITH RECURSIVE walk AS (
  SELECT id, parent_id, 1 AS depth FROM categories WHERE id = 42
  UNION ALL
  SELECT c.id, c.parent_id, w.depth + 1
  FROM categories c
  JOIN walk w ON c.parent_id = w.id
)
SELECT * FROM walk;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="Call a DB function from Prisma without nested template literals.">
            <CodeBlock
              title="Prisma"
              language="typescript"
              code={`const rows = await prisma.$queryRawUnsafe(
  'SELECT * FROM debit($1, $2)',
  10,
  25.5
);`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

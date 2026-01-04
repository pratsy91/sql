import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'CREATE PROCEDURE - PostgreSQL Learning',
  description: 'Learn about creating procedures in PostgreSQL and transaction control',
};

export default function CreateProcedure() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">CREATE PROCEDURE</h1>
        
        <CodeBlock
          title="SQL: Procedures"
          language="sql"
          code={`-- Create procedure
CREATE PROCEDURE update_user_status(user_id INTEGER, new_status VARCHAR)
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE users SET status = new_status WHERE id = user_id;
  COMMIT;
END;
$$;

-- Call procedure
CALL update_user_status(1, 'active');

-- Procedure with transaction control
CREATE PROCEDURE transfer_funds(from_account INTEGER, to_account INTEGER, amount DECIMAL)
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE accounts SET balance = balance - amount WHERE id = from_account;
  UPDATE accounts SET balance = balance + amount WHERE id = to_account;
  COMMIT;
END;
$$;`}
        />
      </div>
    </LessonLayout>
  );
}


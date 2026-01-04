import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'CREATE FUNCTION - PostgreSQL Learning',
  description: 'Learn about creating functions in PostgreSQL including SQL, PL/pgSQL, parameters, and return types',
};

export default function CreateFunction() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">CREATE FUNCTION</h1>
        
        <CodeBlock
          title="SQL: Functions"
          language="sql"
          code={`-- SQL function
CREATE FUNCTION add_numbers(a INTEGER, b INTEGER)
RETURNS INTEGER AS $$
  SELECT a + b;
$$ LANGUAGE SQL;

-- PL/pgSQL function
CREATE FUNCTION get_user_name(user_id INTEGER)
RETURNS VARCHAR AS $$
BEGIN
  RETURN (SELECT username FROM users WHERE id = user_id);
END;
$$ LANGUAGE plpgsql;

-- Function with OUT parameters
CREATE FUNCTION get_user_info(user_id INTEGER, OUT username VARCHAR, OUT email VARCHAR)
AS $$
BEGIN
  SELECT u.username, u.email INTO username, email
  FROM users u
  WHERE u.id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Function with VARIADIC
CREATE FUNCTION sum_all(VARIADIC numbers INTEGER[])
RETURNS INTEGER AS $$
  SELECT SUM(n) FROM unnest(numbers) AS n;
$$ LANGUAGE SQL;`}
        />
      </div>
    </LessonLayout>
  );
}


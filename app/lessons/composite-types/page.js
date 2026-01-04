import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Composite Types - PostgreSQL Learning',
  description: 'Learn about PostgreSQL composite types',
};

export default function CompositeTypes() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Composite Types</h1>
        
        <CodeBlock
          title="SQL: Composite Types"
          language="sql"
          code={`-- Create composite type
CREATE TYPE address AS (
  street VARCHAR(100),
  city VARCHAR(50),
  zip_code VARCHAR(10)
);

-- Use in table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50),
  user_address address
);

INSERT INTO users (username, user_address)
VALUES ('alice', ROW('123 Main St', 'New York', '10001')::address);

SELECT username, (user_address).city FROM users;`}
        />
      </div>
    </LessonLayout>
  );
}


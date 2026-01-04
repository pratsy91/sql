import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'CREATE TYPE - PostgreSQL Learning',
  description: 'Learn about creating types in PostgreSQL including composite types, enum types, and base types',
};

export default function CreateType() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">CREATE TYPE</h1>
        
        <CodeBlock
          title="SQL: Types"
          language="sql"
          code={`-- Create enum type
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'pending');

-- Create composite type
CREATE TYPE address AS (
  street VARCHAR(100),
  city VARCHAR(50),
  zip_code VARCHAR(10)
);

-- Use types
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50),
  status user_status,
  user_address address
);

-- Drop type
DROP TYPE user_status;
DROP TYPE address;`}
        />
      </div>
    </LessonLayout>
  );
}


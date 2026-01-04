import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'CREATE SEQUENCE - PostgreSQL Learning',
  description: 'Learn about creating sequences in PostgreSQL and sequence functions',
};

export default function CreateSequence() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">CREATE SEQUENCE</h1>
        
        <CodeBlock
          title="SQL: Sequences"
          language="sql"
          code={`-- Create sequence
CREATE SEQUENCE user_id_seq;

-- Create sequence with options
CREATE SEQUENCE user_id_seq
  START WITH 1
  INCREMENT BY 1
  MINVALUE 1
  MAXVALUE 1000000
  CACHE 20;

-- Use sequence
SELECT nextval('user_id_seq');
SELECT currval('user_id_seq');
SELECT setval('user_id_seq', 100);

-- Use in table
CREATE TABLE users (
  id INTEGER DEFAULT nextval('user_id_seq') PRIMARY KEY,
  name VARCHAR(100)
);

-- SERIAL types automatically create sequences
CREATE TABLE products (
  id SERIAL PRIMARY KEY  -- Creates products_id_seq automatically
);`}
        />
      </div>
    </LessonLayout>
  );
}


import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'CREATE DOMAIN - PostgreSQL Learning',
  description: 'Learn about creating domains in PostgreSQL with constraints',
};

export default function CreateDomain() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">CREATE DOMAIN</h1>
        
        <CodeBlock
          title="SQL: Domains"
          language="sql"
          code={`-- Create domain with constraint
CREATE DOMAIN positive_integer AS INTEGER
CHECK (VALUE > 0);

CREATE DOMAIN email_address AS VARCHAR(255)
CHECK (VALUE ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$');

-- Use domain
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  price positive_integer,
  contact_email email_address
);`}
        />
      </div>
    </LessonLayout>
  );
}


import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Domain Types - PostgreSQL Learning',
  description: 'Learn about PostgreSQL domain types',
};

export default function DomainTypes() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Domain Types</h1>
        
        <CodeBlock
          title="SQL: Domain Types"
          language="sql"
          code={`-- Create domain with constraint
CREATE DOMAIN positive_integer AS INTEGER
CHECK (VALUE > 0);

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  price positive_integer
);

INSERT INTO products (name, price) VALUES ('Laptop', 1000);  -- OK
INSERT INTO products (name, price) VALUES ('Phone', -100);   -- Error`}
        />
      </div>
    </LessonLayout>
  );
}


import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Custom Types - PostgreSQL Learning',
  description: 'Learn about creating custom types in PostgreSQL',
};

export default function CustomTypes() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Custom Types</h1>
        
        <CodeBlock
          title="SQL: Custom Types"
          language="sql"
          code={`-- Create base type (requires C extension)
-- Usually done via extensions like PostGIS

-- Create composite type (covered in composite-types lesson)
CREATE TYPE point_2d AS (
  x FLOAT,
  y FLOAT
);

-- Create enum type (covered in enum-types lesson)
CREATE TYPE status AS ENUM ('active', 'inactive');

-- Create domain type (covered in domain-types lesson)
CREATE DOMAIN email_address AS VARCHAR(255)
CHECK (VALUE ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$');`}
        />
      </div>
    </LessonLayout>
  );
}


import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Tablespaces - PostgreSQL Learning',
  description: 'Learn about creating and using tablespaces in PostgreSQL',
};

export default function Tablespaces() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Tablespaces</h1>
        
        <CodeBlock
          title="SQL: Tablespaces"
          language="sql"
          code={`-- Create tablespace
CREATE TABLESPACE fast_ssd
LOCATION '/var/lib/postgresql/fast_ssd';

-- Use tablespace
CREATE TABLE large_table (
  id SERIAL PRIMARY KEY,
  data TEXT
) TABLESPACE fast_ssd;

-- Set default tablespace for database
ALTER DATABASE mydb SET TABLESPACE fast_ssd;

-- List tablespaces
SELECT * FROM pg_tablespace;`}
        />
      </div>
    </LessonLayout>
  );
}


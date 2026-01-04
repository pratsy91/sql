import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'CREATE EXTENSION - PostgreSQL Learning',
  description: 'Learn about installing extensions in PostgreSQL including PostGIS, pg_trgm, and other popular extensions',
};

export default function CreateExtension() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">CREATE EXTENSION</h1>
        
        <CodeBlock
          title="SQL: Extensions"
          language="sql"
          code={`-- Install extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Popular extensions
CREATE EXTENSION postgis;        -- Geospatial data
CREATE EXTENSION pg_trgm;        -- Trigram matching
CREATE EXTENSION hstore;         -- Key-value store
CREATE EXTENSION pgcrypto;       -- Cryptographic functions

-- List installed extensions
SELECT * FROM pg_extension;

-- Drop extension
DROP EXTENSION IF EXISTS "uuid-ossp";`}
        />
      </div>
    </LessonLayout>
  );
}


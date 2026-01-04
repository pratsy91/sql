import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'XML Type - PostgreSQL Learning',
  description: 'Learn about PostgreSQL XML type',
};

export default function XMLType() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">XML Type</h1>
        
        <CodeBlock
          title="SQL: XML Type"
          language="sql"
          code={`-- Create table with XML
CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  content XML
);

INSERT INTO documents (content)
VALUES ('<book><title>PostgreSQL Guide</title></book>');

-- XML functions
SELECT xpath('//title/text()', content) FROM documents;`}
        />
      </div>
    </LessonLayout>
  );
}


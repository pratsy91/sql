import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'CREATE RULE - PostgreSQL Learning',
  description: 'Learn about creating rules in PostgreSQL for SELECT, INSERT, UPDATE, and DELETE operations',
};

export default function CreateRule() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">CREATE RULE</h1>
        
        <CodeBlock
          title="SQL: Rules"
          language="sql"
          code={`-- Rule for INSERT
CREATE RULE insert_users AS
ON INSERT TO users
DO INSTEAD
INSERT INTO users_archive VALUES (NEW.*);

-- Rule for UPDATE
CREATE RULE update_users AS
ON UPDATE TO users
DO ALSO
INSERT INTO users_audit VALUES (OLD.*, NEW.*, NOW());

-- Rule for DELETE
CREATE RULE delete_users AS
ON DELETE TO users
DO INSTEAD
UPDATE users SET deleted_at = NOW() WHERE id = OLD.id;

-- Drop rule
DROP RULE IF EXISTS insert_users ON users;`}
        />
      </div>
    </LessonLayout>
  );
}


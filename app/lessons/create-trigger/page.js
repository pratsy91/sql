import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'CREATE TRIGGER - PostgreSQL Learning',
  description: 'Learn about creating triggers in PostgreSQL including BEFORE/AFTER triggers, INSTEAD OF triggers, and trigger functions',
};

export default function CreateTrigger() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">CREATE TRIGGER</h1>
        
        <CodeBlock
          title="SQL: Triggers"
          language="sql"
          code={`-- Create trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- BEFORE trigger
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- AFTER trigger
CREATE TRIGGER log_user_changes
AFTER INSERT OR UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION log_changes();

-- INSTEAD OF trigger (for views)
CREATE TRIGGER insert_user_view
INSTEAD OF INSERT ON user_view
FOR EACH ROW
EXECUTE FUNCTION handle_view_insert();`}
        />
      </div>
    </LessonLayout>
  );
}


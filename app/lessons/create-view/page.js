import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'CREATE VIEW - PostgreSQL Learning',
  description: 'Learn about creating views in PostgreSQL including regular views, updatable views, and WITH CHECK OPTION',
};

export default function CreateView() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">CREATE VIEW</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Regular Views</h2>

          <CodeBlock
            title="SQL: CREATE VIEW"
            language="sql"
            code={`-- Create simple view
CREATE VIEW active_users AS
SELECT id, username, email
FROM users
WHERE status = 'active';

-- Use view
SELECT * FROM active_users;

-- Create view with column aliases
CREATE VIEW user_summary (user_id, name, email_address) AS
SELECT id, username, email
FROM users;

-- Create or replace view
CREATE OR REPLACE VIEW active_users AS
SELECT id, username, email, created_at
FROM users
WHERE status = 'active';

-- Drop view
DROP VIEW active_users;

-- Drop view if exists
DROP VIEW IF EXISTS active_users;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Updatable Views</h2>

          <CodeBlock
            title="SQL: Updatable Views"
            language="sql"
            code={`-- Simple updatable view
CREATE VIEW user_emails AS
SELECT id, email
FROM users;

-- Insert through view
INSERT INTO user_emails (id, email) VALUES (100, 'new@example.com');

-- Update through view
UPDATE user_emails SET email = 'updated@example.com' WHERE id = 1;

-- Delete through view
DELETE FROM user_emails WHERE id = 1;

-- View is updatable if:
-- - Based on single table
-- - Contains all NOT NULL columns
-- - No aggregates, DISTINCT, GROUP BY, etc.
-- - No UNION, EXCEPT, INTERSECT`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">WITH CHECK OPTION</h2>

          <CodeBlock
            title="SQL: WITH CHECK OPTION"
            language="sql"
            code={`-- View with check option
CREATE VIEW active_users AS
SELECT id, username, email, status
FROM users
WHERE status = 'active'
WITH CHECK OPTION;

-- WITH CHECK OPTION ensures:
-- - INSERTs must satisfy WHERE condition
-- - UPDATEs must satisfy WHERE condition

-- This will fail (status must be 'active')
INSERT INTO active_users (id, username, email, status) 
VALUES (101, 'newuser', 'new@example.com', 'inactive');

-- This will succeed
INSERT INTO active_users (id, username, email, status) 
VALUES (102, 'newuser', 'new@example.com', 'active');

-- LOCAL vs CASCADED
CREATE VIEW view1 AS SELECT * FROM users WHERE status = 'active' WITH LOCAL CHECK OPTION;
CREATE VIEW view2 AS SELECT * FROM view1 WITH CASCADED CHECK OPTION;`}
          />
        </section>
      </div>
    </LessonLayout>
  );
}


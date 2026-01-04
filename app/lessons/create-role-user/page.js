import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'CREATE ROLE / USER - PostgreSQL Learning',
  description: 'Learn about creating roles and users in PostgreSQL with attributes like LOGIN, SUPERUSER, etc.',
};

export default function CreateRoleUser() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">CREATE ROLE / USER</h1>
        
        <CodeBlock
          title="SQL: Roles and Users"
          language="sql"
          code={`-- Create role
CREATE ROLE myrole;

-- Create user (role with LOGIN)
CREATE USER myuser WITH PASSWORD 'mypassword';

-- Create role with attributes
CREATE ROLE adminuser WITH
  LOGIN
  PASSWORD 'adminpass'
  CREATEDB
  CREATEROLE
  SUPERUSER;

-- Role attributes:
-- LOGIN, SUPERUSER, CREATEDB, CREATEROLE, REPLICATION, etc.

-- Grant privileges
GRANT SELECT ON TABLE users TO myrole;

-- Alter role
ALTER ROLE myuser WITH PASSWORD 'newpassword';`}
        />
      </div>
    </LessonLayout>
  );
}


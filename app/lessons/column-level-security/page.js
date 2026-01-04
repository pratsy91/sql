import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Column-Level Security - PostgreSQL Learning',
  description: 'Learn about PostgreSQL column-level security including column privileges and access control',
};

export default function ColumnLevelSecurity() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Column-Level Security</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">What is Column-Level Security?</h2>
          <p className="mb-4">
            Column-level security allows you to control access to specific columns in a table. 
            You can grant or revoke privileges on individual columns, allowing fine-grained control 
            over what data users can see or modify. This is useful for protecting sensitive columns 
            like passwords, SSNs, or financial data.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Column Privileges</h2>

          <CodeBlock
            title="SQL: Column-Level Privileges"
            language="sql"
            code={`-- Grant SELECT on specific columns
GRANT SELECT (id, name, email) ON users TO app_user;
-- app_user can only SELECT these columns

-- Grant UPDATE on specific columns
GRANT UPDATE (name, email) ON users TO app_user;
-- app_user can only UPDATE these columns

-- Grant INSERT on specific columns
GRANT INSERT (name, email) ON users TO app_user;
-- app_user can only INSERT these columns

-- Multiple column privileges
GRANT SELECT (id, name, email, created_at) ON users TO app_readonly;
GRANT UPDATE (name, email) ON users TO app_user;
GRANT INSERT (name, email, status) ON users TO app_user;

-- Column privileges with INSERT
-- When inserting, you can only specify columns you have INSERT privilege on
INSERT INTO users (name, email) VALUES ('John', 'john@example.com');
-- Works if user has INSERT on name and email

-- Column privileges with SELECT
-- When selecting, you can only see columns you have SELECT privilege on
SELECT id, name, email FROM users;
-- Only returns columns user has SELECT privilege on

-- Column privileges with UPDATE
-- When updating, you can only modify columns you have UPDATE privilege on
UPDATE users SET name = 'John Doe' WHERE id = 1;
-- Works if user has UPDATE on name

-- Revoke column privileges
REVOKE SELECT (email) ON users FROM app_user;
-- app_user can no longer SELECT email column

-- Revoke all column privileges
REVOKE ALL PRIVILEGES ON users FROM app_user;
-- Removes all privileges including column-level`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Column Privilege Examples</h2>

          <CodeBlock
            title="SQL: Column Security Patterns"
            language="sql"
            code={`-- Example 1: Hide sensitive columns
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT,
  email TEXT,
  password_hash TEXT,
  ssn TEXT,
  salary NUMERIC
);

-- Public users can see basic info
GRANT SELECT (id, name, email) ON users TO public_user;

-- HR can see more
GRANT SELECT (id, name, email, salary) ON users TO hr_user;

-- Admins can see everything
GRANT SELECT ON users TO admin_user;

-- Example 2: Restrict updates
-- Users can update their own name and email
GRANT UPDATE (name, email) ON users TO app_user;

-- Only admins can update sensitive fields
GRANT UPDATE (password_hash, ssn, salary) ON users TO admin_user;

-- Example 3: Audit columns
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  total NUMERIC,
  created_at TIMESTAMP,
  created_by INTEGER,
  updated_at TIMESTAMP,
  updated_by INTEGER
);

-- Regular users can't modify audit columns
GRANT SELECT, INSERT, UPDATE (user_id, total) ON orders TO app_user;
-- Cannot update created_at, created_by, updated_at, updated_by

-- System can update audit columns
GRANT UPDATE (updated_at, updated_by) ON orders TO system_user;

-- Example 4: Partial column access
CREATE TABLE profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  public_bio TEXT,
  private_notes TEXT,
  admin_notes TEXT
);

-- Public can see public_bio
GRANT SELECT (id, user_id, public_bio) ON profiles TO public_user;

-- Users can see their own private_notes
GRANT SELECT (id, user_id, public_bio, private_notes) ON profiles TO app_user;

-- Admins see everything
GRANT SELECT ON profiles TO admin_user;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Column Privileges with RLS</h2>

          <CodeBlock
            title="SQL: Combining Column Privileges and RLS"
            language="sql"
            code={`-- Combine column privileges with Row-Level Security
CREATE TABLE user_data (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  public_data TEXT,
  private_data TEXT,
  sensitive_data TEXT
);

-- Enable RLS
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

-- RLS policy for row access
CREATE POLICY user_data_policy ON user_data
  FOR SELECT
  USING (user_id = current_user_id());

-- Column privileges for column access
GRANT SELECT (id, user_id, public_data) ON user_data TO app_user;
GRANT SELECT (id, user_id, public_data, private_data) ON user_data TO app_user
  WHERE user_id = current_user_id();

-- Note: Column privileges work with RLS
-- First RLS filters rows, then column privileges filter columns

-- Example: Multi-level access
-- Level 1: RLS - users see only their rows
-- Level 2: Column privileges - users see only allowed columns

CREATE POLICY user_policy ON user_data
  FOR SELECT
  USING (user_id = current_user_id());

GRANT SELECT (id, public_data) ON user_data TO basic_user;
GRANT SELECT (id, public_data, private_data) ON user_data TO premium_user;
GRANT SELECT ON user_data TO admin_user;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Viewing Column Privileges</h2>

          <CodeBlock
            title="SQL: Checking Column Privileges"
            language="sql"
            code={`-- View column privileges
SELECT 
  grantee,
  table_schema,
  table_name,
  column_name,
  privilege_type
FROM information_schema.column_privileges
WHERE table_name = 'users'
ORDER BY grantee, column_name, privilege_type;

-- Check if user has column privilege
SELECT 
  has_column_privilege('app_user', 'users', 'email', 'SELECT') AS can_select_email,
  has_column_privilege('app_user', 'users', 'email', 'UPDATE') AS can_update_email,
  has_column_privilege('app_user', 'users', 'password_hash', 'SELECT') AS can_select_password;

-- List all column privileges for current user
SELECT 
  table_schema,
  table_name,
  column_name,
  privilege_type
FROM information_schema.column_privileges
WHERE grantee = current_user
ORDER BY table_name, column_name;

-- Compare table vs column privileges
SELECT 
  'Table' AS privilege_level,
  grantee,
  privilege_type
FROM information_schema.table_privileges
WHERE table_name = 'users'
UNION ALL
SELECT 
  'Column' AS privilege_level,
  grantee,
  privilege_type
FROM information_schema.column_privileges
WHERE table_name = 'users'
ORDER BY privilege_level, grantee;

-- Find columns without SELECT privilege
SELECT 
  column_name
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name NOT IN (
    SELECT column_name
    FROM information_schema.column_privileges
    WHERE table_name = 'users'
      AND grantee = current_user
      AND privilege_type = 'SELECT'
  );`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Views for Column Security</h2>

          <CodeBlock
            title="SQL: Using Views for Column Security"
            language="sql"
            code={`-- Alternative approach: Use views to hide columns
CREATE TABLE users_full (
  id SERIAL PRIMARY KEY,
  name TEXT,
  email TEXT,
  password_hash TEXT,
  ssn TEXT,
  salary NUMERIC
);

-- Public view (hides sensitive columns)
CREATE VIEW users_public AS
SELECT id, name, email
FROM users_full;

-- User view (shows more columns)
CREATE VIEW users_app AS
SELECT id, name, email, created_at
FROM users_full;

-- Admin view (shows all columns)
CREATE VIEW users_admin AS
SELECT * FROM users_full;

-- Grant access to views instead of table
GRANT SELECT ON users_public TO public_user;
GRANT SELECT ON users_app TO app_user;
GRANT SELECT ON users_admin TO admin_user;

-- Revoke direct table access
REVOKE ALL ON users_full FROM public_user, app_user;

-- Views can combine column filtering with RLS
CREATE VIEW user_data_public AS
SELECT id, user_id, public_data
FROM user_data
WHERE user_id = current_user_id();

-- Views with column-level security
CREATE VIEW users_limited AS
SELECT 
  id,
  name,
  email,
  CASE 
    WHEN current_user = 'admin' THEN ssn
    ELSE NULL
  END AS ssn
FROM users_full;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Prisma: Column-Level Security</h2>

          <CodeBlock
            title="Prisma: Column Privileges"
            language="prisma"
            code={`// Prisma doesn't have direct column privilege support
// Use raw SQL for column-level security

// Grant column privileges
await prisma.$executeRaw\`
  GRANT SELECT (id, name, email) ON "User" TO app_user
\`;

await prisma.$executeRaw\`
  GRANT UPDATE (name, email) ON "User" TO app_user
\`;

// Check column privileges
const columnPrivs = await prisma.$queryRaw\`
  SELECT 
    grantee,
    column_name,
    privilege_type
  FROM information_schema.column_privileges
  WHERE table_name = 'User'
  ORDER BY grantee, column_name
\`;

// Check if user has column privilege
const hasPriv = await prisma.$queryRaw\`
  SELECT has_column_privilege($1, $2, $3, $4) AS has_privilege
\`, 'app_user', 'User', 'email', 'SELECT';

// Revoke column privileges
await prisma.$executeRaw\`
  REVOKE SELECT (password_hash) ON "User" FROM app_user
\`;

// Create views for column security
await prisma.$executeRaw\`
  CREATE VIEW "UserPublic" AS
  SELECT id, name, email
  FROM "User"
\`;

// Grant on view
await prisma.$executeRaw\`
  GRANT SELECT ON "UserPublic" TO public_user
\`;

// Note: Prisma queries will respect column privileges
// If user doesn't have SELECT on a column, it won't be returned
// Make sure Prisma connection uses appropriate database user

// Example: Multi-tenant with column security
await prisma.$executeRaw\`
  GRANT SELECT (id, name, public_data) ON "TenantData" TO tenant_user
\`;

// Prisma will only return columns user has access to
const data = await prisma.tenantData.findMany();
// Only returns id, name, public_data columns`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Use column privileges</strong> to protect sensitive data</li>
              <li><strong>Grant minimum access</strong> - only necessary columns</li>
              <li><strong>Combine with RLS</strong> for row and column-level security</li>
              <li><strong>Use views</strong> as alternative to column privileges</li>
              <li><strong>Document column access</strong> - track who can see what</li>
              <li><strong>Test column access</strong> - verify users see correct columns</li>
              <li><strong>Audit column privileges</strong> - regularly review access</li>
              <li><strong>Consider performance</strong> - column checks add overhead</li>
              <li><strong>Use consistent naming</strong> - make sensitive columns obvious</li>
            </ul>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}


import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Roles and Privileges - PostgreSQL Learning',
  description: 'Learn about PostgreSQL roles and privileges including CREATE ROLE, GRANT, REVOKE, and privilege types',
};

export default function RolesPrivileges() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Roles and Privileges</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">What are Roles?</h2>
          <p className="mb-4">
            In PostgreSQL, roles are used to manage database access and permissions. A role can be a user 
            (can log in) or a group (cannot log in). Roles can own database objects and have privileges 
            granted to them. PostgreSQL uses a role-based access control (RBAC) system.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">CREATE ROLE</h2>

          <CodeBlock
            title="SQL: Creating Roles"
            language="sql"
            code={`-- Create a role (user)
CREATE ROLE app_user WITH LOGIN PASSWORD 'secure_password';

-- Create a role without login (group)
CREATE ROLE app_readonly;

-- Create role with multiple attributes
CREATE ROLE admin_user WITH
  LOGIN
  PASSWORD 'admin_password'
  CREATEDB
  CREATEROLE
  SUPERUSER;

-- Create role with connection limit
CREATE ROLE limited_user WITH
  LOGIN
  PASSWORD 'password'
  CONNECTION LIMIT 10;

-- Create role with expiration
CREATE ROLE temp_user WITH
  LOGIN
  PASSWORD 'password'
  VALID UNTIL '2025-12-31';

-- View all roles
SELECT 
  rolname,
  rolsuper,
  rolinherit,
  rolcreaterole,
  rolcreatedb,
  rolcanlogin,
  rolreplication,
  rolconnlimit,
  rolpassword,
  rolvaliduntil
FROM pg_roles
ORDER BY rolname;

-- View current role
SELECT current_user;
SELECT session_user;

-- Alter role
ALTER ROLE app_user WITH PASSWORD 'new_password';
ALTER ROLE app_user WITH CREATEDB;
ALTER ROLE app_user VALID UNTIL '2025-12-31';

-- Rename role
ALTER ROLE app_user RENAME TO application_user;

-- Drop role
DROP ROLE app_user;
DROP ROLE IF EXISTS app_user;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">GRANT Privileges</h2>

          <CodeBlock
            title="SQL: GRANT Privileges"
            language="sql"
            code={`-- Grant table privileges
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO app_user;

-- Grant all privileges
GRANT ALL PRIVILEGES ON users TO app_user;

-- Grant privileges on all tables in schema
GRANT SELECT ON ALL TABLES IN SCHEMA public TO app_readonly;

-- Grant privileges on future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;

-- Grant schema privileges
GRANT USAGE ON SCHEMA public TO app_user;
GRANT CREATE ON SCHEMA public TO app_user;

-- Grant database privileges
GRANT CONNECT ON DATABASE mydb TO app_user;
GRANT CREATE ON DATABASE mydb TO app_user;

-- Grant sequence privileges
GRANT USAGE, SELECT ON SEQUENCE users_id_seq TO app_user;

-- Grant function privileges
GRANT EXECUTE ON FUNCTION get_user_stats(INTEGER) TO app_user;

-- Grant role membership
GRANT app_readonly TO app_user;
-- app_user inherits privileges from app_readonly

-- Grant with GRANT OPTION (allows granting to others)
GRANT SELECT ON users TO app_user WITH GRANT OPTION;
-- app_user can now grant SELECT to other roles

-- View granted privileges
SELECT 
  grantee,
  table_schema,
  table_name,
  privilege_type
FROM information_schema.table_privileges
WHERE grantee = 'app_user'
ORDER BY table_name, privilege_type;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">REVOKE Privileges</h2>

          <CodeBlock
            title="SQL: REVOKE Privileges"
            language="sql"
            code={`-- Revoke specific privileges
REVOKE DELETE ON users FROM app_user;

-- Revoke all privileges
REVOKE ALL PRIVILEGES ON users FROM app_user;

-- Revoke privileges on all tables
REVOKE SELECT ON ALL TABLES IN SCHEMA public FROM app_readonly;

-- Revoke default privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLES FROM app_user;

-- Revoke schema privileges
REVOKE CREATE ON SCHEMA public FROM app_user;

-- Revoke database privileges
REVOKE CREATE ON DATABASE mydb FROM app_user;

-- Revoke role membership
REVOKE app_readonly FROM app_user;

-- Revoke GRANT OPTION
REVOKE GRANT OPTION FOR SELECT ON users FROM app_user;

-- CASCADE revoke (revokes from dependent objects)
REVOKE SELECT ON users FROM app_user CASCADE;

-- Check current privileges
SELECT 
  has_table_privilege('app_user', 'users', 'SELECT') AS can_select,
  has_table_privilege('app_user', 'users', 'INSERT') AS can_insert,
  has_table_privilege('app_user', 'users', 'UPDATE') AS can_update,
  has_table_privilege('app_user', 'users', 'DELETE') AS can_delete;

-- List all privileges for current user
SELECT 
  table_schema,
  table_name,
  privilege_type
FROM information_schema.table_privileges
WHERE grantee = current_user;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Privilege Types</h2>

          <CodeBlock
            title="SQL: Privilege Types"
            language="sql"
            code={`-- Table privileges
-- SELECT: Read data
-- INSERT: Insert rows
-- UPDATE: Update rows
-- DELETE: Delete rows
-- TRUNCATE: Truncate table
-- REFERENCES: Create foreign keys
-- TRIGGER: Create triggers

GRANT SELECT, INSERT, UPDATE, DELETE ON users TO app_user;
GRANT TRUNCATE ON users TO admin_user;
GRANT REFERENCES ON users TO app_user;

-- Column privileges
GRANT SELECT (id, name) ON users TO app_readonly;
GRANT UPDATE (name, email) ON users TO app_user;

-- Sequence privileges
-- USAGE: Use sequence (NEXTVAL, CURRVAL)
-- SELECT: Read sequence values

GRANT USAGE, SELECT ON SEQUENCE users_id_seq TO app_user;

-- Database privileges
-- CONNECT: Connect to database
-- CREATE: Create objects
-- TEMPORARY: Create temporary objects

GRANT CONNECT, CREATE ON DATABASE mydb TO app_user;

-- Schema privileges
-- USAGE: Access objects in schema
-- CREATE: Create objects in schema

GRANT USAGE, CREATE ON SCHEMA public TO app_user;

-- Function privileges
-- EXECUTE: Execute function

GRANT EXECUTE ON FUNCTION calculate_total(NUMERIC, INTEGER) TO app_user;

-- Language privileges
-- USAGE: Use language

GRANT USAGE ON LANGUAGE plpgsql TO app_user;

-- Type privileges
-- USAGE: Use type

GRANT USAGE ON TYPE user_status_enum TO app_user;

-- View all privilege types
SELECT DISTINCT privilege_type
FROM information_schema.table_privileges
ORDER BY privilege_type;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Role Membership</h2>

          <CodeBlock
            title="SQL: Role Membership"
            language="sql"
            code={`-- Create group roles
CREATE ROLE managers;
CREATE ROLE employees;

-- Grant privileges to groups
GRANT SELECT, INSERT, UPDATE ON users TO managers;
GRANT SELECT ON users TO employees;

-- Add users to groups
GRANT managers TO manager_user;
GRANT employees TO employee_user;

-- Users inherit group privileges
-- manager_user has managers privileges
-- employee_user has employees privileges

-- Check role membership
SELECT 
  r.rolname AS role,
  m.rolname AS member
FROM pg_roles r
JOIN pg_auth_members am ON r.oid = am.roleid
JOIN pg_roles m ON m.oid = am.member
WHERE r.rolname = 'managers';

-- View all memberships
SELECT 
  r.rolname AS role,
  m.rolname AS member
FROM pg_roles r
JOIN pg_auth_members am ON r.oid = am.roleid
JOIN pg_roles m ON m.oid = am.member
ORDER BY r.rolname, m.rolname;

-- Remove from group
REVOKE managers FROM manager_user;

-- WITH ADMIN OPTION (can grant membership)
GRANT managers TO admin_user WITH ADMIN OPTION;
-- admin_user can grant managers role to others

-- Check if role can login
SELECT 
  rolname,
  rolcanlogin,
  rolpassword IS NOT NULL AS has_password
FROM pg_roles
WHERE rolcanlogin = true;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Prisma: Roles and Privileges</h2>

          <CodeBlock
            title="Prisma: Managing Roles and Privileges"
            language="prisma"
            code={`// Prisma doesn't have direct role management
// Use raw SQL for role and privilege operations

// Create role
await prisma.$executeRaw\`
  CREATE ROLE IF NOT EXISTS app_user WITH LOGIN PASSWORD $1
\`, 'secure_password';

// Grant table privileges
await prisma.$executeRaw\`
  GRANT SELECT, INSERT, UPDATE, DELETE ON "User" TO app_user
\`;

// Grant schema privileges
await prisma.$executeRaw\`
  GRANT USAGE ON SCHEMA public TO app_user
\`;

// Grant default privileges
await prisma.$executeRaw\`
  ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user
\`;

// Check privileges
const privileges = await prisma.$queryRaw\`
  SELECT 
    grantee,
    table_schema,
    table_name,
    privilege_type
  FROM information_schema.table_privileges
  WHERE grantee = $1
\`, 'app_user';

// Check if user has privilege
const hasSelect = await prisma.$queryRaw\`
  SELECT has_table_privilege($1, $2, 'SELECT') AS can_select
\`, 'app_user', 'User';

// Revoke privileges
await prisma.$executeRaw\`
  REVOKE DELETE ON "User" FROM app_user
\`;

// Create group role
await prisma.$executeRaw\`
  CREATE ROLE IF NOT EXISTS readonly_users
\`;

// Grant to group
await prisma.$executeRaw\`
  GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_users
\`;

// Add user to group
await prisma.$executeRaw\`
  GRANT readonly_users TO app_user
\`;

// Note: Prisma connection uses a specific database user
// Configure connection string with appropriate user
// DATABASE_URL="postgresql://app_user:password@localhost:5432/mydb"`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Use role-based access</strong> - create roles for different access levels</li>
              <li><strong>Grant minimum privileges</strong> - only what's needed</li>
              <li><strong>Use group roles</strong> - organize users into groups</li>
              <li><strong>Use default privileges</strong> - automatically grant to new objects</li>
              <li><strong>Regularly audit privileges</strong> - review who has access</li>
              <li><strong>Use strong passwords</strong> - enforce password policies</li>
              <li><strong>Set connection limits</strong> - prevent resource exhaustion</li>
              <li><strong>Use VALID UNTIL</strong> - set expiration for temporary users</li>
              <li><strong>Document role structure</strong> - maintain clear hierarchy</li>
            </ul>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}


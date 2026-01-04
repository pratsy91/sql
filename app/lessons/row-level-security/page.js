import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Row-Level Security (RLS) - PostgreSQL Learning',
  description: 'Learn about PostgreSQL Row-Level Security including enabling RLS, creating policies, and examples',
};

export default function RowLevelSecurity() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Row-Level Security (RLS)</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">What is Row-Level Security?</h2>
          <p className="mb-4">
            Row-Level Security (RLS) allows you to control access to individual rows in a table based on 
            policies. When RLS is enabled, users can only see and modify rows that satisfy the policies. 
            This provides fine-grained access control beyond table-level privileges.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Enabling RLS</h2>

          <CodeBlock
            title="SQL: Enabling Row-Level Security"
            language="sql"
            code={`-- Enable RLS on a table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Disable RLS
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'users';

-- Or check directly
SELECT relrowsecurity 
FROM pg_class 
WHERE relname = 'users';

-- Important: When RLS is enabled, all rows are hidden by default
-- You must create policies to allow access

-- Superusers and table owners bypass RLS
-- They can always see all rows regardless of policies`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Creating Policies</h2>

          <CodeBlock
            title="SQL: RLS Policies"
            language="sql"
            code={`-- Policy for SELECT (read access)
CREATE POLICY user_select_policy ON users
  FOR SELECT
  USING (id = current_user_id());
-- Users can only SELECT their own rows

-- Policy for INSERT
CREATE POLICY user_insert_policy ON users
  FOR INSERT
  WITH CHECK (true);
-- Anyone can insert (adjust as needed)

-- Policy for UPDATE
CREATE POLICY user_update_policy ON users
  FOR UPDATE
  USING (id = current_user_id())
  WITH CHECK (id = current_user_id());
-- Users can only UPDATE their own rows

-- Policy for DELETE
CREATE POLICY user_delete_policy ON users
  FOR DELETE
  USING (id = current_user_id());
-- Users can only DELETE their own rows

-- Policy for ALL operations
CREATE POLICY user_all_policy ON users
  FOR ALL
  USING (id = current_user_id())
  WITH CHECK (id = current_user_id());

-- Policy with role check
CREATE POLICY manager_policy ON users
  FOR ALL
  USING (
    current_user = 'manager' OR 
    id = current_user_id()
  );

-- Policy with function
CREATE POLICY active_users_policy ON users
  FOR SELECT
  USING (is_user_active(id));

-- View all policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'users';

-- Drop policy
DROP POLICY user_select_policy ON users;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Policy Examples</h2>

          <CodeBlock
            title="SQL: Common RLS Policy Patterns"
            language="sql"
            code={`-- Example 1: Users see only their own data
CREATE TABLE user_data (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  data TEXT
);

ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_data_policy ON user_data
  FOR ALL
  USING (user_id = current_setting('app.current_user_id')::INTEGER)
  WITH CHECK (user_id = current_setting('app.current_user_id')::INTEGER);

-- Set user context
SET app.current_user_id = '123';
SELECT * FROM user_data;  -- Only sees user 123's data

-- Example 2: Department-based access
CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  department TEXT,
  content TEXT
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY department_policy ON documents
  FOR SELECT
  USING (
    department = current_setting('app.user_department') OR
    current_user = 'admin'
  );

-- Example 3: Time-based access
CREATE POLICY time_based_policy ON orders
  FOR SELECT
  USING (
    created_at >= CURRENT_DATE - INTERVAL '1 year' OR
    current_user = 'admin'
  );

-- Example 4: Status-based access
CREATE POLICY status_policy ON orders
  FOR SELECT
  USING (
    status = 'public' OR
    user_id = current_user_id() OR
    current_user = 'admin'
  );

-- Example 5: Multi-tenant application
CREATE TABLE tenant_data (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER,
  data TEXT
);

ALTER TABLE tenant_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_policy ON tenant_data
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id')::INTEGER)
  WITH CHECK (tenant_id = current_setting('app.tenant_id')::INTEGER);`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Policy Types</h2>

          <CodeBlock
            title="SQL: Policy Types and Options"
            language="sql"
            code={`-- PERMISSIVE policy (default, allows access)
CREATE POLICY permissive_policy ON users
  FOR SELECT
  USING (status = 'active');
-- Allows access if condition is true

-- RESTRICTIVE policy (denies access)
CREATE POLICY restrictive_policy ON users
  FOR SELECT
  USING (status = 'deleted')
  WITH RESTRICTIVE;
-- Denies access if condition is true

-- Multiple policies combine with OR (permissive) or AND (restrictive)
-- At least one permissive policy must pass
-- All restrictive policies must pass

-- Policy for specific roles
CREATE POLICY role_based_policy ON users
  FOR SELECT
  TO app_user, app_admin
  USING (true);
-- Only applies to app_user and app_admin roles

-- Policy for all roles except specified
CREATE POLICY exclude_role_policy ON users
  FOR SELECT
  TO PUBLIC
  USING (current_user != 'guest');

-- Policy with USING clause (for SELECT, UPDATE, DELETE)
CREATE POLICY using_policy ON users
  FOR SELECT
  USING (id = current_user_id());
-- Checks existing rows

-- Policy with WITH CHECK clause (for INSERT, UPDATE)
CREATE POLICY with_check_policy ON users
  FOR INSERT
  WITH CHECK (id = current_user_id());
-- Checks new/modified rows

-- Combined USING and WITH CHECK
CREATE POLICY update_policy ON users
  FOR UPDATE
  USING (id = current_user_id())  -- Can see row
  WITH CHECK (id = current_user_id());  -- Can modify to this value`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">RLS with Functions</h2>

          <CodeBlock
            title="SQL: RLS and Functions"
            language="sql"
            code={`-- Functions run with definer privileges by default
-- May bypass RLS unless SECURITY DEFINER is not used

-- Function that respects RLS
CREATE FUNCTION get_user_data(user_id INTEGER)
RETURNS TABLE(id INTEGER, data TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT user_data.id, user_data.data
  FROM user_data
  WHERE user_data.user_id = get_user_data.user_id;
END;
$$;
-- SECURITY DEFINER runs with function owner's privileges
-- May bypass RLS

-- Function that uses invoker privileges
CREATE FUNCTION get_user_data_invoker(user_id INTEGER)
RETURNS TABLE(id INTEGER, data TEXT)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  RETURN QUERY
  SELECT user_data.id, user_data.data
  FROM user_data
  WHERE user_data.user_id = get_user_data_invoker.user_id;
END;
$$;
-- SECURITY INVOKER runs with caller's privileges
-- Respects RLS

-- Use current_setting for user context
CREATE FUNCTION current_user_id()
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
  SELECT current_setting('app.current_user_id', true)::INTEGER;
$$;

-- Use in policies
CREATE POLICY user_policy ON user_data
  FOR ALL
  USING (user_id = current_user_id());`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Prisma: Row-Level Security</h2>

          <CodeBlock
            title="Prisma: Working with RLS"
            language="prisma"
            code={`// Prisma doesn't have direct RLS support
// Use raw SQL for RLS setup

// Enable RLS
await prisma.$executeRaw\`
  ALTER TABLE "User" ENABLE ROW LEVEL SECURITY
\`;

// Create policy
await prisma.$executeRaw\`
  CREATE POLICY user_select_policy ON "User"
  FOR SELECT
  USING (id = current_setting('app.current_user_id', true)::INTEGER)
\`;

// Set user context before queries
await prisma.$executeRaw\`SET app.current_user_id = $1\`, '123';

// Now queries respect RLS
const users = await prisma.user.findMany();
// Only returns rows matching policy

// Check if RLS is enabled
const rlsStatus = await prisma.$queryRaw\`
  SELECT relrowsecurity 
  FROM pg_class 
  WHERE relname = 'User'
\`;

// View policies
const policies = await prisma.$queryRaw\`
  SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual
  FROM pg_policies
  WHERE tablename = 'User'
\`;

// Drop policy
await prisma.$executeRaw\`
  DROP POLICY IF EXISTS user_select_policy ON "User"
\`;

// Create helper function for user context
await prisma.$executeRaw\`
  CREATE OR REPLACE FUNCTION current_user_id()
  RETURNS INTEGER
  LANGUAGE sql
  STABLE
  AS $$
    SELECT current_setting('app.current_user_id', true)::INTEGER;
  $$;
\`;

// Use in Prisma queries
// Note: Prisma queries will respect RLS policies
// Make sure to set user context before queries

// Example: Multi-tenant application
await prisma.$executeRaw\`SET app.tenant_id = $1\`, tenantId;
const data = await prisma.tenantData.findMany();
// Only returns data for current tenant`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Enable RLS</strong> on tables with sensitive data</li>
              <li><strong>Test policies thoroughly</strong> - incorrect policies can hide all data</li>
              <li><strong>Use current_setting</strong> for user context in policies</li>
              <li><strong>Create helper functions</strong> for common policy conditions</li>
              <li><strong>Use SECURITY INVOKER</strong> for functions that should respect RLS</li>
              <li><strong>Document policies</strong> - complex policies can be hard to understand</li>
              <li><strong>Test with different users</strong> - verify access is correct</li>
              <li><strong>Monitor policy performance</strong> - policies add overhead</li>
              <li><strong>Use indexes</strong> on columns used in policy conditions</li>
            </ul>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}


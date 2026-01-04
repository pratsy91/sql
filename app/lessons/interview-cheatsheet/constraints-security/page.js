import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';

export const metadata = {
  title: 'Constraints & Security - Interview Cheatsheet',
  description: 'Constraints and security concepts for PostgreSQL interviews',
};

export default function ConstraintsSecurity() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Constraints & Security - Interview Cheatsheet</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Constraints Overview</h2>
          
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">PRIMARY KEY</h3>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>Uniquely identifies each row</li>
              <li>NOT NULL automatically</li>
              <li>Only one per table</li>
              <li>Creates unique index automatically</li>
            </ul>
            <CodeBlock
              title="PRIMARY KEY Examples"
              language="sql"
              code={`-- Single column primary key
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100)
);

-- Composite primary key
CREATE TABLE order_items (
  order_id INT,
  product_id INT,
  quantity INT,
  PRIMARY KEY (order_id, product_id)
);

-- Add primary key to existing table
ALTER TABLE users ADD PRIMARY KEY (id);`}
            />
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">FOREIGN KEY</h3>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>Enforces referential integrity</li>
              <li>References PRIMARY KEY or UNIQUE column</li>
              <li>Can be NULL (unless NOT NULL constraint)</li>
              <li>ON DELETE/ON UPDATE actions: CASCADE, SET NULL, RESTRICT, NO ACTION</li>
            </ul>
            <CodeBlock
              title="FOREIGN KEY Examples"
              language="sql"
              code={`-- Foreign key with CASCADE
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  total DECIMAL(10,2),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Foreign key with SET NULL
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  author_id INT,
  title VARCHAR(200),
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Composite foreign key
CREATE TABLE order_items (
  order_id INT,
  product_id INT,
  FOREIGN KEY (order_id, product_id) REFERENCES orders(id, product_id)
);`}
            />
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">UNIQUE Constraint</h3>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>Ensures all values are unique</li>
              <li>Allows NULL (NULL != NULL in SQL)</li>
              <li>Multiple UNIQUE constraints per table</li>
              <li>Creates index automatically</li>
            </ul>
            <CodeBlock
              title="UNIQUE Examples"
              language="sql"
              code={`-- Single column unique
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(100) UNIQUE,
  username VARCHAR(50) UNIQUE
);

-- Composite unique constraint
CREATE TABLE user_roles (
  user_id INT,
  role_id INT,
  UNIQUE (user_id, role_id)  -- User can't have same role twice
);

-- Unique constraint with name
ALTER TABLE users ADD CONSTRAINT uk_users_email UNIQUE (email);`}
            />
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">CHECK Constraint</h3>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>Validates data meets condition</li>
              <li>Can reference multiple columns</li>
              <li>Cannot use subqueries or functions that reference other tables</li>
            </ul>
            <CodeBlock
              title="CHECK Examples"
              language="sql"
              code={`-- Single column check
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  price DECIMAL(10,2) CHECK (price > 0),
  discount DECIMAL(5,2) CHECK (discount >= 0 AND discount <= 100)
);

-- Multi-column check
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  order_date DATE,
  delivery_date DATE,
  CHECK (delivery_date >= order_date)  -- Delivery must be after order
);

-- Named check constraint
ALTER TABLE products ADD CONSTRAINT chk_price_positive 
  CHECK (price > 0);`}
            />
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">NOT NULL Constraint</h3>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>Prevents NULL values</li>
              <li>Can be added/removed with ALTER TABLE</li>
            </ul>
            <CodeBlock
              title="NOT NULL Examples"
              language="sql"
              code={`-- Column-level
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL
);

-- Alter to add/remove
ALTER TABLE users ALTER COLUMN name SET NOT NULL;
ALTER TABLE users ALTER COLUMN name DROP NOT NULL;`}
            />
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">EXCLUDE Constraint (PostgreSQL Specific)</h3>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>Prevents overlapping ranges or conflicting values</li>
              <li>Uses operators like && (overlaps), =, etc.</li>
              <li>Common use: prevent overlapping time ranges</li>
            </ul>
            <CodeBlock
              title="EXCLUDE Example"
              language="sql"
              code={`-- Prevent overlapping reservations
CREATE TABLE reservations (
  id SERIAL PRIMARY KEY,
  room_id INT,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  EXCLUDE USING GIST (
    room_id WITH =,
    tstzrange(start_time, end_time) WITH &&
  )
);`}
            />
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Security: Roles & Privileges</h2>
          
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Roles vs Users</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li><strong>Role:</strong> Generic term for user or group of users</li>
              <li><strong>User:</strong> Role that can login (has LOGIN privilege)</li>
              <li><strong>Group:</strong> Role that contains other roles (no LOGIN)</li>
              <li>In PostgreSQL, users and groups are both roles</li>
            </ul>
          </div>

          <CodeBlock
            title="Role Management"
            language="sql"
            code={`-- Create role (user that can login)
CREATE ROLE app_user WITH LOGIN PASSWORD 'password';
CREATE USER app_user WITH PASSWORD 'password';  -- Same as above

-- Create role without login (group)
CREATE ROLE readonly_group;

-- Grant privileges
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_group;
GRANT SELECT, INSERT, UPDATE ON TABLE users TO app_user;

-- Revoke privileges
REVOKE DELETE ON TABLE users FROM app_user;

-- Grant role to another role
GRANT readonly_group TO app_user;

-- List roles
SELECT rolname FROM pg_roles;

-- List current user privileges
SELECT * FROM information_schema.role_table_grants 
WHERE grantee = current_user;`}
          />

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Privilege Types</h3>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Privilege</th>
                  <th className="text-left p-2">Description</th>
                  <th className="text-left p-2">Applies To</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-2">SELECT</td>
                  <td className="p-2">Read data</td>
                  <td className="p-2">Tables, views, sequences</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">INSERT</td>
                  <td className="p-2">Add new rows</td>
                  <td className="p-2">Tables</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">UPDATE</td>
                  <td className="p-2">Modify existing rows</td>
                  <td className="p-2">Tables</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">DELETE</td>
                  <td className="p-2">Remove rows</td>
                  <td className="p-2">Tables</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">TRUNCATE</td>
                  <td className="p-2">Remove all rows</td>
                  <td className="p-2">Tables</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">REFERENCES</td>
                  <td className="p-2">Create foreign keys</td>
                  <td className="p-2">Tables</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">TRIGGER</td>
                  <td className="p-2">Create triggers</td>
                  <td className="p-2">Tables</td>
                </tr>
                <tr>
                  <td className="p-2">ALL</td>
                  <td className="p-2">All privileges</td>
                  <td className="p-2">Tables, schemas, databases</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Row-Level Security (RLS)</h2>
          
          <div className="bg-blue-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">What is RLS?</h3>
            <p className="text-sm mb-2">
              Row-Level Security allows you to control access to individual rows based on policies. 
              Users see only rows that match the policy conditions.
            </p>
          </div>

          <CodeBlock
            title="RLS Setup Example"
            language="sql"
            code={`-- Enable RLS on table
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policy: users can only see their own orders
CREATE POLICY user_orders_policy ON orders
  FOR SELECT
  USING (user_id = current_user_id());

-- Create policy: users can insert their own orders
CREATE POLICY user_orders_insert ON orders
  FOR INSERT
  WITH CHECK (user_id = current_user_id());

-- Create policy: admins can see all orders
CREATE POLICY admin_orders_policy ON orders
  FOR ALL
  TO admin_role
  USING (true);

-- Drop policy
DROP POLICY user_orders_policy ON orders;

-- List policies
SELECT * FROM pg_policies WHERE tablename = 'orders';`}
          />

          <div className="bg-yellow-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">RLS Important Points</h3>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>Superuser and table owner bypass RLS</li>
              <li>RLS must be enabled per table</li>
              <li>WITH CHECK applies to INSERT/UPDATE</li>
              <li>USING applies to SELECT/UPDATE/DELETE</li>
              <li>Multiple policies are combined with OR</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Common Interview Questions</h2>
          
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Q: What is the difference between PRIMARY KEY and UNIQUE?</h3>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Feature</th>
                  <th className="text-left p-2">PRIMARY KEY</th>
                  <th className="text-left p-2">UNIQUE</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-2">NULL values</td>
                  <td className="p-2">Not allowed</td>
                  <td className="p-2">Allowed (one NULL)</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">Number per table</td>
                  <td className="p-2">One</td>
                  <td className="p-2">Multiple</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">Index type</td>
                  <td className="p-2">Usually clustered</td>
                  <td className="p-2">Non-clustered</td>
                </tr>
                <tr>
                  <td className="p-2">Purpose</td>
                  <td className="p-2">Row identifier</td>
                  <td className="p-2">Data uniqueness</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Q: Explain FOREIGN KEY CASCADE actions</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li><strong>RESTRICT/NO ACTION:</strong> Prevent deletion if referenced (default)</li>
              <li><strong>CASCADE:</strong> Delete/update child rows when parent is deleted/updated</li>
              <li><strong>SET NULL:</strong> Set foreign key to NULL when parent is deleted</li>
              <li><strong>SET DEFAULT:</strong> Set foreign key to default value when parent is deleted</li>
            </ul>
            <CodeBlock
              title="CASCADE Example"
              language="sql"
              code={`-- When user is deleted, delete all their orders
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE
);

-- When user is deleted, set orders.user_id to NULL
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE SET NULL
);`}
            />
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Q: What is Row-Level Security and when would you use it?</h3>
            <p className="text-sm mb-2">
              RLS allows fine-grained access control at the row level. Use cases:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>Multi-tenant applications (users see only their data)</li>
              <li>Department-based access control</li>
              <li>Data privacy regulations (GDPR, etc.)</li>
              <li>Restricting access based on user roles</li>
            </ul>
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Q: How do you manage database security in PostgreSQL?</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li><strong>Roles and privileges:</strong> Grant minimal required permissions</li>
              <li><strong>Row-Level Security:</strong> Fine-grained access control</li>
              <li><strong>Column-level security:</strong> Restrict access to specific columns</li>
              <li><strong>Encryption:</strong> Encrypt data at rest and in transit (SSL/TLS)</li>
              <li><strong>Audit logging:</strong> Track access and changes</li>
              <li><strong>Connection security:</strong> pg_hba.conf for authentication</li>
            </ul>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}


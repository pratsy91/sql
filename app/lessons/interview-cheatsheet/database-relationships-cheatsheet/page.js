import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';

export const metadata = {
  title: 'Database Relationships Cheatsheet - Interview Cheatsheet',
  description: 'Quick reference cheatsheet for database relationships for interviews',
};

export default function DatabaseRelationshipsCheatsheet() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Database Relationships Cheatsheet</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Quick Reference: Relationship Types</h2>
          
          <table className="w-full text-sm border-collapse mb-4">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Type</th>
                <th className="text-left p-2">Description</th>
                <th className="text-left p-2">Implementation</th>
                <th className="text-left p-2">Foreign Key Location</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-2"><strong>1:1</strong></td>
                <td className="p-2">One record in A relates to exactly one in B</td>
                <td className="p-2">Foreign key with UNIQUE constraint, or merge tables</td>
                <td className="p-2">Either table (usually detail table)</td>
              </tr>
              <tr className="border-b">
                <td className="p-2"><strong>1:N</strong></td>
                <td className="p-2">One record in A relates to many in B</td>
                <td className="p-2">Foreign key on "many" side</td>
                <td className="p-2">Always on "many" side</td>
              </tr>
              <tr>
                <td className="p-2"><strong>M:N</strong></td>
                <td className="p-2">Many in A relate to many in B</td>
                <td className="p-2">Junction table with two foreign keys</td>
                <td className="p-2">Both FKs in junction table</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">One-to-One (1:1) Pattern</h2>
          
          <CodeBlock
            title="1:1 Implementation"
            language="sql"
            code={`-- Option 1: Foreign key with UNIQUE (or PRIMARY KEY)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE user_profiles (
  user_id INT PRIMARY KEY,  -- PRIMARY KEY enforces uniqueness
  bio TEXT,
  avatar_url VARCHAR(255),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Use when: Separating optional/extended data, performance optimization`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">One-to-Many (1:N) Pattern</h2>
          
          <div className="bg-red-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <p className="text-sm font-semibold text-red-600 dark:text-red-400">
              ⚠️ KEY RULE: Foreign key ALWAYS goes on the "many" side!
            </p>
          </div>

          <CodeBlock
            title="1:N Implementation"
            language="sql"
            code={`-- One side: users
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(100) UNIQUE NOT NULL
);

-- Many side: orders (has foreign key)
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,  -- Foreign key on "many" side
  order_date TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- One user → many orders
-- Each order → one user`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Many-to-Many (M:N) Pattern</h2>
          
          <div className="bg-red-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <p className="text-sm font-semibold text-red-600 dark:text-red-400">
              ⚠️ KEY RULE: M:N relationships REQUIRE a junction/bridge table!
            </p>
          </div>

          <CodeBlock
            title="M:N Implementation"
            language="sql"
            code={`-- Table A: students
CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

-- Table B: courses
CREATE TABLE courses (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL
);

-- Junction table (REQUIRED for M:N)
CREATE TABLE enrollments (
  student_id INT NOT NULL,
  course_id INT NOT NULL,
  enrolled_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (student_id, course_id),  -- Composite PK
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- One student → many courses (via enrollments)
-- One course → many students (via enrollments)`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Foreign Key Cascade Options</h2>
          
          <table className="w-full text-sm border-collapse mb-4">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Option</th>
                <th className="text-left p-2">Behavior</th>
                <th className="text-left p-2">Use When</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-2"><strong>RESTRICT/NO ACTION</strong></td>
                <td className="p-2">Prevents deletion if child rows exist</td>
                <td className="p-2">Default - most cases</td>
              </tr>
              <tr className="border-b">
                <td className="p-2"><strong>CASCADE</strong></td>
                <td className="p-2">Deletes child rows when parent deleted</td>
                <td className="p-2">Child has no meaning without parent</td>
              </tr>
              <tr className="border-b">
                <td className="p-2"><strong>SET NULL</strong></td>
                <td className="p-2">Sets FK to NULL when parent deleted</td>
                <td className="p-2">Relationship is optional</td>
              </tr>
              <tr>
                <td className="p-2"><strong>SET DEFAULT</strong></td>
                <td className="p-2">Sets FK to default value</td>
                <td className="p-2">Have fallback value</td>
              </tr>
            </tbody>
          </table>

          <CodeBlock
            title="Cascade Examples"
            language="sql"
            code={`-- RESTRICT: Prevent deleting category with products
FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT

-- CASCADE: Delete order items when order deleted
FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE

-- SET NULL: Product can exist without category
FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Self-Referencing Relationships</h2>
          
          <CodeBlock
            title="Self-Referencing Patterns"
            language="sql"
            code={`-- 1:N Self-Referencing: Employee Hierarchy
CREATE TABLE employees (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  manager_id INT,  -- References same table!
  FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE SET NULL
);

-- M:N Self-Referencing: User Follows
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE user_follows (
  follower_id INT NOT NULL,
  following_id INT NOT NULL,
  PRIMARY KEY (follower_id, following_id),
  FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
  CHECK (follower_id != following_id)  -- Prevent self-following
);

-- Hierarchical: Categories
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  parent_id INT,  -- Self-referencing
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Critical Best Practices</h2>
          
          <div className="bg-green-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">✅ Always Index Foreign Keys</h3>
            <CodeBlock
              title="Index Foreign Keys"
              language="sql"
              code={`-- PostgreSQL doesn't auto-index foreign keys!
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);`}
            />
          </div>

          <div className="bg-green-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">✅ Use Named Constraints</h3>
            <CodeBlock
              title="Named Constraints"
              language="sql"
              code={`-- Good: Named constraint
ALTER TABLE orders
ADD CONSTRAINT fk_orders_user_id 
FOREIGN KEY (user_id) REFERENCES users(id);

-- Easy to drop:
ALTER TABLE orders DROP CONSTRAINT fk_orders_user_id;`}
            />
          </div>

          <div className="bg-green-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">✅ Composite Primary Key in Junction Tables</h3>
            <CodeBlock
              title="Junction Table Pattern"
              language="sql"
              code={`CREATE TABLE product_tags (
  product_id INT NOT NULL,
  tag_id INT NOT NULL,
  PRIMARY KEY (product_id, tag_id),  -- Prevents duplicates
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (tag_id) REFERENCES tags(id)
);`}
            />
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Common Mistakes</h2>
          
          <div className="bg-red-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">❌ Mistake 1: Foreign Key on Wrong Side (1:N)</h3>
            <CodeBlock
              title="Wrong vs Right"
              language="sql"
              code={`-- WRONG: FK on "one" side
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  order_id INT  -- WRONG! User can have many orders
);

-- RIGHT: FK on "many" side
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL  -- CORRECT!
);`}
            />
          </div>

          <div className="bg-red-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">❌ Mistake 2: Missing Junction Table (M:N)</h3>
            <CodeBlock
              title="Wrong Approach"
              language="sql"
              code={`-- WRONG: Can't do M:N with single FK
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  tag_id INT  -- WRONG! Product can have MANY tags
);

-- RIGHT: Use junction table
CREATE TABLE product_tags (
  product_id INT NOT NULL,
  tag_id INT NOT NULL,
  PRIMARY KEY (product_id, tag_id)
);`}
            />
          </div>

          <div className="bg-red-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">❌ Mistake 3: Forgetting to Index Foreign Keys</h3>
            <p className="text-sm">Always create indexes on foreign key columns for performance!</p>
          </div>

          <div className="bg-red-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">❌ Mistake 4: Circular Dependencies</h3>
            <CodeBlock
              title="Circular Dependency Problem"
              language="sql"
              code={`-- WRONG: Circular reference
CREATE TABLE table_a (
  id SERIAL PRIMARY KEY,
  b_id INT NOT NULL,
  FOREIGN KEY (b_id) REFERENCES table_b(id)
);

CREATE TABLE table_b (
  id SERIAL PRIMARY KEY,
  a_id INT NOT NULL,
  FOREIGN KEY (a_id) REFERENCES table_a(id)
);
-- Can't insert into either table!

-- SOLUTION: Use junction table or make one optional`}
            />
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Common Interview Questions</h2>
          
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Q: How do you implement a many-to-many relationship?</h3>
            <p className="text-sm mb-2">
              Use a junction/bridge table with two foreign keys - one for each related table. 
              The junction table typically has a composite primary key consisting of both foreign keys.
            </p>
            <CodeBlock
              title="M:N Implementation Answer"
              language="sql"
              code={`CREATE TABLE students (id SERIAL PRIMARY KEY, name VARCHAR(100));
CREATE TABLE courses (id SERIAL PRIMARY KEY, title VARCHAR(200));

CREATE TABLE enrollments (
  student_id INT NOT NULL,
  course_id INT NOT NULL,
  PRIMARY KEY (student_id, course_id),
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (course_id) REFERENCES courses(id)
);`}
            />
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Q: Where do you place the foreign key in a one-to-many relationship?</h3>
            <p className="text-sm mb-2">
              The foreign key always goes on the "many" side. For example, if one user can have many orders, 
              the user_id foreign key goes in the orders table, not the users table.
            </p>
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Q: Explain the different ON DELETE cascade options</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li><strong>RESTRICT:</strong> Prevents deletion if child rows exist (default, safest)</li>
              <li><strong>CASCADE:</strong> Automatically deletes child rows (use carefully)</li>
              <li><strong>SET NULL:</strong> Sets foreign key to NULL in child rows (requires nullable FK)</li>
              <li><strong>SET DEFAULT:</strong> Sets foreign key to default value</li>
            </ul>
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Q: How would you model a self-referencing relationship (like employee-manager)?</h3>
            <CodeBlock
              title="Self-Referencing Answer"
              language="sql"
              code={`CREATE TABLE employees (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  manager_id INT,  -- References same table
  FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE SET NULL
);

-- Root employees have manager_id = NULL
-- Use recursive CTEs to query hierarchies`}
            />
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Q: What is a junction table and when do you need it?</h3>
            <p className="text-sm mb-2">
              A junction table (also called bridge or associative table) is needed for many-to-many relationships. 
              It contains two foreign keys - one to each related table. It can also store additional attributes 
              about the relationship (e.g., enrollment date, quantity).
            </p>
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Q: Should you index foreign keys?</h3>
            <p className="text-sm mb-2">
              Yes! Always create indexes on foreign key columns. PostgreSQL doesn't do this automatically 
              (unlike primary keys). Indexes improve JOIN performance, CASCADE operations, and constraint checking.
            </p>
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Q: How do you prevent circular dependencies between tables?</h3>
            <p className="text-sm mb-2">
              Avoid having Table A reference Table B while Table B references Table A. Solutions:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>Use a junction table for the relationship</li>
              <li>Make one of the relationships optional (nullable foreign key)</li>
              <li>Rethink the design - circular dependencies often indicate a design flaw</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Quick Design Decision Guide</h2>
          
          <div className="bg-blue-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Identifying Relationship Type</h3>
            <ol className="list-decimal pl-6 space-y-2 text-sm">
              <li>Can one record in A relate to multiple records in B?
                <ul className="list-disc pl-6 mt-1">
                  <li>NO → 1:1 relationship</li>
                  <li>YES → Continue</li>
                </ul>
              </li>
              <li>Can one record in B relate to multiple records in A?
                <ul className="list-disc pl-6 mt-1">
                  <li>NO → 1:N relationship (FK on B side)</li>
                  <li>YES → M:N relationship (need junction table)</li>
                </ul>
              </li>
            </ol>
          </div>

          <div className="bg-blue-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Choosing Cascade Option</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li><strong>Child has no meaning without parent</strong> → CASCADE</li>
              <li><strong>Child data is important, parent shouldn't be deleted</strong> → RESTRICT</li>
              <li><strong>Child can exist independently</strong> → SET NULL</li>
              <li><strong>Default/fallback exists</strong> → SET DEFAULT</li>
              <li><strong>Unsure?</strong> → Use RESTRICT (safest)</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Common Patterns Reference</h2>
          
          <CodeBlock
            title="E-Commerce Pattern Example"
            language="sql"
            code={`-- Users → Orders (1:N)
CREATE TABLE orders (
  user_id INT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Orders ↔ Products (M:N via OrderItems with attributes)
CREATE TABLE order_items (
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2),
  PRIMARY KEY (order_id, product_id),
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Products → Category (1:N)
CREATE TABLE products (
  category_id INT NOT NULL,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Categories (self-referencing hierarchy)
CREATE TABLE categories (
  parent_id INT,
  FOREIGN KEY (parent_id) REFERENCES categories(id)
);`}
          />
        </section>
      </div>
    </LessonLayout>
  );
}


import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';

export const metadata = {
  title: 'Self-Referencing & Hierarchical Relationships - Database Relationships',
  description: 'Learn about self-referencing relationships and hierarchical data structures',
};

export default function SelfReferencingHierarchical() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Self-Referencing & Hierarchical Relationships</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">What is a Self-Referencing Relationship?</h2>
          <p className="mb-4">
            A self-referencing relationship is when a table references itself through a foreign key. 
            This is used to model hierarchical structures like organizational charts, category trees, 
            or threaded comments.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">One-to-Many Self-Referencing: Employee Hierarchy</h2>
          
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Structure: Employees and Managers</h3>
            <p className="text-sm mb-2">
              Each employee has one manager, but a manager can have many employees. 
              This is a 1:N relationship within the same table.
            </p>
          </div>

          <CodeBlock
            title="Employee Hierarchy Table"
            language="sql"
            code={`CREATE TABLE employees (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  manager_id INT,  -- References another employee (same table!)
  department VARCHAR(50),
  salary DECIMAL(10, 2),
  FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE SET NULL
);

-- Insert CEO (no manager)
INSERT INTO employees (name, email, manager_id) 
VALUES ('Alice CEO', 'alice@company.com', NULL);

-- Insert managers (reporting to CEO)
INSERT INTO employees (name, email, manager_id) 
VALUES 
  ('Bob Manager', 'bob@company.com', 1),
  ('Carol Manager', 'carol@company.com', 1);

-- Insert employees (reporting to managers)
INSERT INTO employees (name, email, manager_id) 
VALUES 
  ('Dave Employee', 'dave@company.com', 2),
  ('Eve Employee', 'eve@company.com', 2),
  ('Frank Employee', 'frank@company.com', 3);

-- Hierarchy:
-- Alice (CEO, manager_id = NULL)
--   ├── Bob (manager_id = 1)
--   │   ├── Dave (manager_id = 2)
--   │   └── Eve (manager_id = 2)
--   └── Carol (manager_id = 1)
--       └── Frank (manager_id = 3)`}
          />

          <CodeBlock
            title="Querying Employee Hierarchy"
            language="sql"
            code={`-- Get employee with their manager
SELECT 
  e.id,
  e.name AS employee_name,
  m.name AS manager_name
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.id;

-- Get all employees reporting to a specific manager
SELECT * 
FROM employees 
WHERE manager_id = 2;  -- All employees reporting to Bob

-- Get all direct reports for a manager (with count)
SELECT 
  m.name AS manager_name,
  COUNT(e.id) AS direct_reports
FROM employees m
LEFT JOIN employees e ON m.id = e.manager_id
GROUP BY m.id, m.name
ORDER BY direct_reports DESC;

-- Find employees who are managers (have reports)
SELECT DISTINCT m.*
FROM employees m
WHERE EXISTS (
  SELECT 1 FROM employees e 
  WHERE e.manager_id = m.id
);`}
          />

          <CodeBlock
            title="Recursive Query: Find All Subordinates"
            language="sql"
            code={`-- Using recursive CTE to find all subordinates of a manager
WITH RECURSIVE employee_hierarchy AS (
  -- Anchor: Start with the manager
  SELECT id, name, manager_id, 0 AS level
  FROM employees
  WHERE id = 2  -- Bob's ID
  
  UNION ALL
  
  -- Recursive: Find subordinates
  SELECT e.id, e.name, e.manager_id, eh.level + 1
  FROM employees e
  INNER JOIN employee_hierarchy eh ON e.manager_id = eh.id
)
SELECT * FROM employee_hierarchy
ORDER BY level, name;

-- Result: Bob and all his direct/indirect reports
-- id | name           | manager_id | level
-- 2  | Bob Manager    | 1          | 0
-- 4  | Dave Employee  | 2          | 1
-- 5  | Eve Employee   | 2          | 1`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Many-to-Many Self-Referencing: User Following</h2>
          
          <CodeBlock
            title="Users Following Users"
            language="sql"
            code={`CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL
);

-- Junction table for self-referencing many-to-many
CREATE TABLE user_follows (
  follower_id INT NOT NULL,
  following_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
  CHECK (follower_id != following_id)  -- Prevent self-following
);

-- User 1 follows User 2 and User 3
INSERT INTO user_follows (follower_id, following_id) VALUES
  (1, 2),
  (1, 3);

-- User 2 follows User 1
INSERT INTO user_follows (follower_id, following_id) VALUES (2, 1);

-- Query: Who does user 1 follow?
SELECT u.*
FROM users u
JOIN user_follows uf ON u.id = uf.following_id
WHERE uf.follower_id = 1;

-- Query: Who follows user 1?
SELECT u.*
FROM users u
JOIN user_follows uf ON u.id = uf.follower_id
WHERE uf.following_id = 1;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Hierarchical Categories: Adjacency List</h2>
          
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Adjacency List Pattern</h3>
            <p className="text-sm mb-2">
              Each category has a reference to its parent category. Simple but requires recursive queries 
              to traverse the tree.
            </p>
          </div>

          <CodeBlock
            title="Category Hierarchy with Adjacency List"
            language="sql"
            code={`CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  parent_id INT,  -- Self-referencing foreign key
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- Top-level categories (no parent)
INSERT INTO categories (name, slug, parent_id) VALUES
  ('Electronics', 'electronics', NULL),
  ('Clothing', 'clothing', NULL);

-- Subcategories
INSERT INTO categories (name, slug, parent_id) VALUES
  ('Laptops', 'laptops', 1),        -- Under Electronics
  ('Phones', 'phones', 1),          -- Under Electronics
  ('Men', 'men', 2),                -- Under Clothing
  ('Women', 'women', 2);            -- Under Clothing

-- Sub-subcategories
INSERT INTO categories (name, slug, parent_id) VALUES
  ('Gaming Laptops', 'gaming-laptops', 3),  -- Under Laptops
  ('Business Laptops', 'business-laptops', 3);  -- Under Laptops

-- Structure:
-- Electronics (parent_id = NULL)
--   ├── Laptops (parent_id = 1)
--   │   ├── Gaming Laptops (parent_id = 3)
--   │   └── Business Laptops (parent_id = 3)
--   └── Phones (parent_id = 1)
-- Clothing (parent_id = NULL)
--   ├── Men (parent_id = 2)
--   └── Women (parent_id = 2)`}
          />

          <CodeBlock
            title="Querying Category Hierarchy"
            language="sql"
            code={`-- Get all top-level categories (no parent)
SELECT * FROM categories WHERE parent_id IS NULL;

-- Get direct children of a category
SELECT * FROM categories WHERE parent_id = 1;  -- Children of Electronics

-- Get category with its parent
SELECT 
  c.id,
  c.name AS category_name,
  p.name AS parent_name
FROM categories c
LEFT JOIN categories p ON c.parent_id = p.id;

-- Recursive query: Get full path to root
WITH RECURSIVE category_path AS (
  -- Start with category
  SELECT id, name, parent_id, ARRAY[name] AS path
  FROM categories
  WHERE id = 5  -- Gaming Laptops
  
  UNION ALL
  
  -- Go up to parent
  SELECT c.id, c.name, c.parent_id, cp.path || c.name
  FROM categories c
  JOIN category_path cp ON c.id = cp.parent_id
)
SELECT * FROM category_path WHERE parent_id IS NULL;

-- Result: Shows path from root to current category`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Threaded Comments: Self-Referencing</h2>
          
          <CodeBlock
            title="Comment Threading Structure"
            language="sql"
            code={`CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  post_id INT NOT NULL,
  user_id INT NOT NULL,
  parent_id INT,  -- Self-referencing: reply to another comment
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
);

-- Top-level comment (reply to post)
INSERT INTO comments (post_id, user_id, parent_id, content) 
VALUES (1, 1, NULL, 'Great post!');

-- Reply to comment (parent_id = 1)
INSERT INTO comments (post_id, user_id, parent_id, content) 
VALUES (1, 2, 1, 'I agree!');

-- Reply to reply (nested)
INSERT INTO comments (post_id, user_id, parent_id, content) 
VALUES (1, 3, 2, 'Me too!');

-- Structure:
-- Comment 1 (parent_id = NULL) - top level
--   └── Comment 2 (parent_id = 1) - reply to Comment 1
--       └── Comment 3 (parent_id = 2) - reply to Comment 2`}
          />

          <CodeBlock
            title="Querying Threaded Comments"
            language="sql"
            code={`-- Get all top-level comments for a post
SELECT * FROM comments 
WHERE post_id = 1 AND parent_id IS NULL
ORDER BY created_at;

-- Get replies to a specific comment
SELECT * FROM comments 
WHERE parent_id = 1
ORDER BY created_at;

-- Get comment with its parent comment
SELECT 
  c.id,
  c.content,
  c.created_at,
  u1.username AS author,
  c.parent_id,
  parent.content AS parent_content,
  u2.username AS parent_author
FROM comments c
JOIN users u1 ON c.user_id = u1.id
LEFT JOIN comments parent ON c.parent_id = parent.id
LEFT JOIN users u2 ON parent.user_id = u2.id
WHERE c.post_id = 1
ORDER BY c.created_at;

-- Recursive query: Get entire thread
WITH RECURSIVE comment_thread AS (
  -- Start with top-level comment
  SELECT id, parent_id, content, created_at, 0 AS depth
  FROM comments
  WHERE id = 1  -- Root comment
  
  UNION ALL
  
  -- Get all replies
  SELECT c.id, c.parent_id, c.content, c.created_at, ct.depth + 1
  FROM comments c
  JOIN comment_thread ct ON c.parent_id = ct.id
)
SELECT * FROM comment_thread
ORDER BY depth, created_at;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Best Practices for Self-Referencing Relationships</h2>
          
          <div className="bg-green-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">1. Use NULL for Root Nodes</h3>
            <p className="text-sm">
              Root nodes (top-level items) should have NULL in the self-referencing foreign key column.
            </p>
          </div>

          <div className="bg-green-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">2. Index the Self-Referencing Column</h3>
            <CodeBlock
              title="Index Self-Referencing Foreign Key"
              language="sql"
              code={`CREATE INDEX idx_employees_manager_id ON employees(manager_id);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);`}
            />
          </div>

          <div className="bg-green-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">3. Use ON DELETE CASCADE Carefully</h3>
            <p className="text-sm mb-2">
              For hierarchies, CASCADE will delete entire subtrees. Consider SET NULL for managers 
              or use a soft delete pattern.
            </p>
            <CodeBlock
              title="SET NULL vs CASCADE for Hierarchies"
              language="sql"
              code={`-- CASCADE: Deleting a manager deletes all employees
-- Use when: Deleting should remove entire branch
FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE CASCADE

-- SET NULL: Deleting a manager makes employees orphaned
-- Use when: Employees should be reassigned, not deleted
FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE SET NULL`}
            />
          </div>

          <div className="bg-green-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">4. Prevent Circular References</h3>
            <CodeBlock
              title="Check Constraint to Prevent Cycles"
              language="sql"
              code={`-- For user follows (prevent self-following)
CREATE TABLE user_follows (
  follower_id INT NOT NULL,
  following_id INT NOT NULL,
  CHECK (follower_id != following_id),  -- Can't follow yourself
  PRIMARY KEY (follower_id, following_id),
  FOREIGN KEY (follower_id) REFERENCES users(id),
  FOREIGN KEY (following_id) REFERENCES users(id)
);

-- For hierarchies, cycles are harder to prevent with simple CHECK
-- Consider application-level validation or triggers`}
            />
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Alternative: Closure Table Pattern</h2>
          <p className="mb-4">
            For very deep hierarchies with frequent queries, consider the Closure Table pattern 
            which stores all ancestor-descendant relationships explicitly.
          </p>
          
          <CodeBlock
            title="Closure Table for Categories"
            language="sql"
            code={`-- Categories table (same as before)
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  parent_id INT,
  FOREIGN KEY (parent_id) REFERENCES categories(id)
);

-- Closure table: stores ALL ancestor-descendant relationships
CREATE TABLE category_closure (
  ancestor_id INT NOT NULL,
  descendant_id INT NOT NULL,
  depth INT NOT NULL,  -- How many levels apart
  PRIMARY KEY (ancestor_id, descendant_id),
  FOREIGN KEY (ancestor_id) REFERENCES categories(id),
  FOREIGN KEY (descendant_id) REFERENCES categories(id)
);

-- Query: Get all descendants (no recursion needed!)
SELECT c.*
FROM categories c
JOIN category_closure cc ON c.id = cc.descendant_id
WHERE cc.ancestor_id = 1;  -- All descendants of category 1

-- Trade-off: More storage, but faster queries for deep hierarchies`}
          />
        </section>
      </div>
    </LessonLayout>
  );
}


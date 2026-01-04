import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';

export const metadata = {
  title: 'Relationship Types & Fundamentals - Database Relationships',
  description: 'Learn about one-to-one, one-to-many, and many-to-many relationships',
};

export default function RelationshipTypesFundamentals() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Relationship Types & Fundamentals</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Understanding Database Relationships</h2>
          <p className="mb-4">
            Relationships define how tables are connected to each other. Understanding relationship types 
            is crucial for designing efficient database schemas.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">One-to-One (1:1) Relationships</h2>
          
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Definition</h3>
            <p className="text-sm mb-2">
              Each record in Table A relates to exactly one record in Table B, and vice versa.
            </p>
          </div>

          <h3 className="text-xl font-semibold mb-3">Implementation Options</h3>
          
          <div className="bg-blue-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h4 className="font-semibold mb-2">Option 1: Foreign Key with UNIQUE Constraint</h4>
            <CodeBlock
              title="One-to-One with Foreign Key"
              language="sql"
              code={`-- User table (main entity)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User profile (detailed info, 1:1 with users)
CREATE TABLE user_profiles (
  user_id INT PRIMARY KEY,  -- PRIMARY KEY enforces uniqueness
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  bio TEXT,
  avatar_url VARCHAR(255),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Each user has exactly one profile
-- Each profile belongs to exactly one user`}
            />
          </div>

          <div className="bg-blue-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h4 className="font-semibold mb-2">Option 2: Merge Into Single Table</h4>
            <CodeBlock
              title="One-to-One by Merging Tables"
              language="sql"
              code={`-- When 1:1 relationship is mandatory, consider merging
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  -- Profile fields directly in users table
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  bio TEXT,
  avatar_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Use separate table only when:
-- 1. Profile is optional (some users might not have profiles)
-- 2. Profile data is rarely accessed (performance optimization)
-- 3. Profile fields are large or complex`}
            />
          </div>

          <div className="bg-yellow-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">When to Use One-to-One</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>Separating frequently accessed data from rarely accessed data (performance)</li>
              <li>Optional extended information (not all records need the additional data)</li>
              <li>Security (separate sensitive information)</li>
              <li>Table size management (avoiding very wide tables)</li>
            </ul>
          </div>

          <h3 className="text-xl font-semibold mb-3 mt-6">Real-World Example: Users and Passports</h3>
          <CodeBlock
            title="One-to-One: User and Passport"
            language="sql"
            code={`CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL
);

-- Each user can have at most one passport
-- Each passport belongs to exactly one user
CREATE TABLE passports (
  id SERIAL PRIMARY KEY,
  user_id INT UNIQUE NOT NULL,  -- UNIQUE ensures 1:1
  passport_number VARCHAR(50) UNIQUE NOT NULL,
  country VARCHAR(100),
  issue_date DATE,
  expiry_date DATE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">One-to-Many (1:N) Relationships</h2>
          
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Definition</h3>
            <p className="text-sm mb-2">
              One record in Table A can relate to many records in Table B, but each record in Table B 
              relates to only one record in Table A.
            </p>
          </div>

          <h3 className="text-xl font-semibold mb-3">Implementation Pattern</h3>
          <div className="bg-green-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <p className="text-sm mb-2">
              <strong>Key Rule:</strong> The foreign key always goes on the "many" side!
            </p>
          </div>

          <CodeBlock
            title="One-to-Many: Users and Orders"
            language="sql"
            code={`-- One side: users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL
);

-- Many side: orders table (has foreign key to users)
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,  -- Foreign key on the "many" side
  order_date TIMESTAMP DEFAULT NOW(),
  total_amount DECIMAL(10, 2),
  status VARCHAR(50),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- One user can have many orders
-- Each order belongs to exactly one user
-- The foreign key (user_id) is in the orders table`}
          />

          <h3 className="text-xl font-semibold mb-3 mt-6">More Examples</h3>
          
          <CodeBlock
            title="One-to-Many: Categories and Products"
            language="sql"
            code={`CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  category_id INT NOT NULL,  -- Foreign key on "many" side
  name VARCHAR(200) NOT NULL,
  price DECIMAL(10, 2),
  description TEXT,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- One category can have many products
-- Each product belongs to one category`}
          />

          <CodeBlock
            title="One-to-Many: Authors and Blog Posts"
            language="sql"
            code={`CREATE TABLE authors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE blog_posts (
  id SERIAL PRIMARY KEY,
  author_id INT NOT NULL,  -- Foreign key on "many" side
  title VARCHAR(200) NOT NULL,
  content TEXT,
  published_at TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE CASCADE
);

-- One author can write many posts
-- Each post has one author`}
          />

          <div className="bg-yellow-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Key Points for One-to-Many</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>Foreign key is always on the "many" side</li>
              <li>Foreign key can be NOT NULL (required relationship) or nullable (optional)</li>
              <li>Most common relationship type in database design</li>
              <li>Index the foreign key column for better JOIN performance</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Many-to-Many (M:N) Relationships</h2>
          
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Definition</h3>
            <p className="text-sm mb-2">
              One record in Table A can relate to many records in Table B, and one record in Table B 
              can relate to many records in Table A.
            </p>
          </div>

          <div className="bg-red-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Implementation Pattern</h3>
            <p className="text-sm mb-2">
              <strong>Key Rule:</strong> Many-to-many relationships require a junction/bridge table 
              (also called join table, linking table, or associative table)!
            </p>
          </div>

          <h3 className="text-xl font-semibold mb-3">Basic Many-to-Many Pattern</h3>
          <CodeBlock
            title="Many-to-Many: Students and Courses"
            language="sql"
            code={`-- Table A: Students
CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL
);

-- Table B: Courses
CREATE TABLE courses (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  credits INT
);

-- Junction Table: enrollments (links students to courses)
CREATE TABLE enrollments (
  student_id INT NOT NULL,
  course_id INT NOT NULL,
  enrolled_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (student_id, course_id),  -- Composite primary key
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
);

-- One student can enroll in many courses
-- One course can have many students
-- Junction table connects them`}
          />

          <h3 className="text-xl font-semibold mb-3 mt-6">Many-to-Many with Additional Attributes</h3>
          <CodeBlock
            title="Many-to-Many with Attributes: Orders and Products"
            language="sql"
            code={`CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  order_date TIMESTAMP DEFAULT NOW(),
  total_amount DECIMAL(10, 2),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  price DECIMAL(10, 2),
  stock_quantity INT
);

-- Junction table with additional attributes
CREATE TABLE order_items (
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),  -- Additional attribute
  unit_price DECIMAL(10, 2) NOT NULL,          -- Additional attribute (price at time of order)
  PRIMARY KEY (order_id, product_id),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

-- One order can have many products (via order_items)
-- One product can be in many orders (via order_items)
-- Junction table stores the relationship AND additional data`}
          />

          <h3 className="text-xl font-semibold mb-3 mt-6">More Real-World Examples</h3>
          
          <CodeBlock
            title="Many-to-Many: Posts and Tags"
            language="sql"
            code={`CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  content TEXT,
  author_id INT NOT NULL,
  published_at TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES authors(id)
);

CREATE TABLE tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL
);

-- Junction table (simple, no extra attributes needed)
CREATE TABLE post_tags (
  post_id INT NOT NULL,
  tag_id INT NOT NULL,
  PRIMARY KEY (post_id, tag_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- One post can have many tags
-- One tag can be used by many posts`}
          />

          <CodeBlock
            title="Many-to-Many: Users Following Users (Self-Referencing)"
            language="sql"
            code={`CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL
);

-- Self-referencing many-to-many with junction table
CREATE TABLE user_follows (
  follower_id INT NOT NULL,
  following_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
  CHECK (follower_id != following_id)  -- Prevent users from following themselves
);

-- One user can follow many users
-- One user can be followed by many users`}
          />

          <div className="bg-yellow-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Junction Table Design Principles</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>Always has foreign keys to both related tables</li>
              <li>Usually has a composite primary key (both foreign keys together)</li>
              <li>Can have additional columns for relationship-specific data</li>
              <li>Naming: Use descriptive names like "enrollments", "order_items", "post_tags"</li>
              <li>Consider adding timestamps if relationship creation time matters</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Identifying Relationship Types</h2>
          
          <div className="bg-blue-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Questions to Ask</h3>
            <ol className="list-decimal pl-6 space-y-2 text-sm">
              <li><strong>Can one record in Table A relate to multiple records in Table B?</strong>
                <ul className="list-disc pl-6 mt-1">
                  <li>If NO → One-to-One (1:1)</li>
                  <li>If YES → Continue to question 2</li>
                </ul>
              </li>
              <li><strong>Can one record in Table B relate to multiple records in Table A?</strong>
                <ul className="list-disc pl-6 mt-1">
                  <li>If NO → One-to-Many (1:N)</li>
                  <li>If YES → Many-to-Many (M:N)</li>
                </ul>
              </li>
            </ol>
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Practice Examples</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li><strong>Customer → Orders:</strong> One customer can have many orders, each order belongs to one customer = <strong>1:N</strong></li>
              <li><strong>Student → Course:</strong> One student takes many courses, one course has many students = <strong>M:N</strong></li>
              <li><strong>User → UserProfile:</strong> One user has one profile, one profile belongs to one user = <strong>1:1</strong></li>
              <li><strong>Product → Category:</strong> One product has one category, one category has many products = <strong>1:N</strong></li>
              <li><strong>Employee → Manager:</strong> One employee has one manager, one manager manages many employees = <strong>1:N</strong> (self-referencing)</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Summary</h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Relationship Type</th>
                <th className="text-left p-2">Implementation</th>
                <th className="text-left p-2">Foreign Key Location</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-2"><strong>One-to-One (1:1)</strong></td>
                <td className="p-2">Foreign key with UNIQUE constraint, or merge tables</td>
                <td className="p-2">Either table (usually the "detail" table)</td>
              </tr>
              <tr className="border-b">
                <td className="p-2"><strong>One-to-Many (1:N)</strong></td>
                <td className="p-2">Foreign key on "many" side</td>
                <td className="p-2">Always on the "many" side</td>
              </tr>
              <tr>
                <td className="p-2"><strong>Many-to-Many (M:N)</strong></td>
                <td className="p-2">Junction table with two foreign keys</td>
                <td className="p-2">Both foreign keys in junction table</td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>
    </LessonLayout>
  );
}


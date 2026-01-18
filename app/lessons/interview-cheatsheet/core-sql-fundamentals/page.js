import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';

export const metadata = {
  title: 'Core SQL Fundamentals - Interview Cheatsheet',
  description: 'Essential SQL fundamentals with Prisma equivalents for interviews',
};

export default function CoreSQLFundamentals() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Core SQL Fundamentals - Interview Cheatsheet</h1>
        <p className="mb-4 text-lg">
          Complete reference with SQL and Prisma equivalents for interview preparation.
        </p>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Prisma Setup & Basics</h2>
          <div className="bg-blue-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Prisma Client Initialization</h3>
            <CodeBlock
              title="Prisma Client Setup"
              language="typescript"
              code={`// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default prisma

// Usage
import prisma from './lib/prisma'`}
            />
          </div>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">SQL Command Categories</h2>
          
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">DDL (Data Definition Language)</h3>
            <p className="text-sm mb-2">Commands that define database structure:</p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li><strong>CREATE:</strong> CREATE TABLE, DATABASE, INDEX, VIEW, etc.</li>
              <li><strong>ALTER:</strong> ALTER TABLE, DATABASE, etc.</li>
              <li><strong>DROP:</strong> DROP TABLE, DATABASE, INDEX, etc.</li>
              <li><strong>TRUNCATE:</strong> Remove all rows from a table</li>
            </ul>
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">DML (Data Manipulation Language)</h3>
            <p className="text-sm mb-2">Commands that manipulate data:</p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li><strong>INSERT:</strong> Add new rows</li>
              <li><strong>UPDATE:</strong> Modify existing rows</li>
              <li><strong>DELETE:</strong> Remove rows</li>
              <li><strong>UPSERT:</strong> INSERT ... ON CONFLICT (PostgreSQL)</li>
            </ul>
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">DQL (Data Query Language)</h3>
            <p className="text-sm mb-2">Commands that query data:</p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li><strong>SELECT:</strong> Retrieve data from tables</li>
            </ul>
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">DCL (Data Control Language)</h3>
            <p className="text-sm mb-2">Commands that control access:</p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li><strong>GRANT:</strong> Give privileges to users</li>
              <li><strong>REVOKE:</strong> Remove privileges from users</li>
            </ul>
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">TCL (Transaction Control Language)</h3>
            <p className="text-sm mb-2">Commands that manage transactions:</p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li><strong>BEGIN/START TRANSACTION:</strong> Start a transaction</li>
              <li><strong>COMMIT:</strong> Save changes permanently</li>
              <li><strong>ROLLBACK:</strong> Undo changes</li>
              <li><strong>SAVEPOINT:</strong> Create a point to rollback to</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">SELECT Statement Syntax</h2>
          <CodeBlock
            title="SQL: Complete SELECT Syntax"
            language="sql"
            code={`SELECT 
  [DISTINCT | ALL]
  [* | column_list]
FROM 
  table_name [alias]
  [JOIN ...]
[WHERE 
  condition]
[GROUP BY 
  column_list]
[HAVING 
  condition]
[ORDER BY 
  column_list [ASC | DESC]]
[LIMIT 
  count [OFFSET offset]]
[FOR UPDATE | FOR SHARE];`}
          />

          <CodeBlock
            title="Prisma: Equivalent SELECT Pattern"
            language="typescript"
            code={`// Prisma findMany (equivalent to SELECT)
await prisma.model.findMany({
  distinct: ['column'],      // DISTINCT
  select: {                  // column_list (instead of *)
    column1: true,
    column2: true,
  },
  where: {                   // WHERE
    condition: value,
  },
  orderBy: {                 // ORDER BY
    column: 'asc' | 'desc',
  },
  take: 10,                  // LIMIT
  skip: 20,                  // OFFSET
});

// include for JOINs
await prisma.model.findMany({
  include: {
    relation: true,          // JOIN equivalent
  },
});`}
          />

          <h3 className="text-xl font-semibold mb-3 mt-6">SELECT Execution Order</h3>
          <div className="bg-blue-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <p className="text-sm mb-2"><strong>Important for Interviews:</strong> SQL executes clauses in this order:</p>
            <ol className="list-decimal pl-6 space-y-1 text-sm">
              <li><strong>FROM</strong> - Select tables</li>
              <li><strong>JOIN</strong> - Combine tables</li>
              <li><strong>WHERE</strong> - Filter rows</li>
              <li><strong>GROUP BY</strong> - Group rows</li>
              <li><strong>HAVING</strong> - Filter groups</li>
              <li><strong>SELECT</strong> - Select columns</li>
              <li><strong>DISTINCT</strong> - Remove duplicates</li>
              <li><strong>ORDER BY</strong> - Sort results</li>
              <li><strong>LIMIT/OFFSET</strong> - Limit results</li>
            </ol>
            <p className="text-sm mt-2 text-red-600 dark:text-red-400">
              <strong>Key Point:</strong> You cannot use column aliases from SELECT in WHERE clause because WHERE executes before SELECT!
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">JOIN Types</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">SQL: INNER JOIN</h3>
              <p className="text-sm mb-2">Returns only matching rows from both tables</p>
              <CodeBlock
                title="INNER JOIN Example"
                language="sql"
                code={`SELECT * 
FROM users u
INNER JOIN orders o ON u.id = o.user_id;`}
              />
              <div className="mt-2">
                <p className="text-xs font-semibold mb-1">Prisma Equivalent:</p>
                <CodeBlock
                  title="Prisma: INNER JOIN"
                  language="typescript"
                  code={`await prisma.user.findMany({
  include: {
    orders: true,  // INNER JOIN behavior if required relation
  },
});`}
                />
              </div>
            </div>

            <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">SQL: LEFT JOIN</h3>
              <p className="text-sm mb-2">Returns all rows from left table + matching rows from right</p>
              <CodeBlock
                title="LEFT JOIN Example"
                language="sql"
                code={`SELECT * 
FROM users u
LEFT JOIN orders o ON u.id = o.user_id;`}
              />
              <div className="mt-2">
                <p className="text-xs font-semibold mb-1">Prisma Equivalent:</p>
                <CodeBlock
                  title="Prisma: LEFT JOIN"
                  language="typescript"
                  code={`await prisma.user.findMany({
  include: {
    orders: true,  // LEFT JOIN - all users, even without orders
  },
});`}
                />
              </div>
            </div>

            <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">SQL: RIGHT JOIN</h3>
              <p className="text-sm mb-2">Returns all rows from right table + matching rows from left</p>
              <CodeBlock
                title="RIGHT JOIN Example"
                language="sql"
                code={`SELECT * 
FROM users u
RIGHT JOIN orders o ON u.id = o.user_id;`}
              />
              <div className="mt-2">
                <p className="text-xs font-semibold mb-1">Prisma Equivalent:</p>
                <CodeBlock
                  title="Prisma: RIGHT JOIN"
                  language="typescript"
                  code={`// Reverse the query
await prisma.order.findMany({
  include: {
    user: true,  // Start from orders table
  },
});`}
                />
              </div>
            </div>

            <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">SQL: FULL OUTER JOIN</h3>
              <p className="text-sm mb-2">Returns all rows from both tables</p>
              <CodeBlock
                title="FULL OUTER JOIN Example"
                language="sql"
                code={`SELECT * 
FROM users u
FULL OUTER JOIN orders o ON u.id = o.user_id;`}
              />
              <div className="mt-2">
                <p className="text-xs font-semibold mb-1">Prisma Equivalent:</p>
                <CodeBlock
                  title="Prisma: FULL OUTER JOIN"
                  language="typescript"
                  code={`// Use raw query or UNION
await prisma.$queryRaw\`\`
  SELECT * FROM "User" u
  FULL OUTER JOIN "Order" o ON u.id = o.user_id
\`\`;`}
                />
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Interview Tip: JOIN vs Subquery</h3>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li><strong>JOIN:</strong> Better for combining columns from multiple tables</li>
              <li><strong>Subquery:</strong> Better for filtering or aggregating before joining</li>
              <li><strong>EXISTS:</strong> Better for checking existence (often faster than JOIN)</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Aggregate Functions</h2>
          <CodeBlock
            title="SQL: Common Aggregate Functions"
            language="sql"
            code={`-- COUNT: Count rows
SELECT COUNT(*) FROM users;
SELECT COUNT(DISTINCT email) FROM users;

-- SUM: Sum of numeric values
SELECT SUM(amount) FROM orders;

-- AVG: Average of numeric values
SELECT AVG(price) FROM products;

-- MIN/MAX: Minimum/Maximum values
SELECT MIN(created_at), MAX(created_at) FROM orders;

-- GROUP_CONCAT (PostgreSQL: string_agg)
SELECT string_agg(name, ', ') FROM categories;`}
          />

          <CodeBlock
            title="Prisma: Aggregate Functions"
            language="typescript"
            code={`// COUNT
const totalUsers = await prisma.user.count();
const usersWithEmail = await prisma.user.count({
  where: { email: { not: null } },
});

// Aggregate (SUM, AVG, MIN, MAX)
const stats = await prisma.order.aggregate({
  _sum: { amount: true },
  _avg: { amount: true },
  _min: { createdAt: true },
  _max: { createdAt: true },
  _count: { id: true },
});

// Access results
stats._sum.amount;   // Sum
stats._avg.amount;   // Average
stats._min.createdAt; // Minimum
stats._max.createdAt; // Maximum
stats._count.id;     // Count

// Group by with aggregates
const roleStats = await prisma.user.groupBy({
  by: ['role'],
  _count: { id: true },
  _avg: { age: true },
});`}
          />

          <div className="bg-blue-50 dark:bg-zinc-800 p-4 rounded-lg mb-4 mt-4">
            <h3 className="font-semibold mb-2">GROUP BY Rules</h3>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>All non-aggregated columns in SELECT must be in GROUP BY</li>
              <li>You can GROUP BY multiple columns</li>
              <li>HAVING filters groups (WHERE filters rows before grouping)</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Window Functions</h2>
          <CodeBlock
            title="Window Functions Syntax"
            language="sql"
            code={`SELECT 
  column1,
  column2,
  aggregate_function(column3) OVER (
    PARTITION BY column1
    ORDER BY column2
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS window_result
FROM table_name;`}
          />

          <CodeBlock
            title="SQL: Common Window Functions"
            language="sql"
            code={`-- ROW_NUMBER: Sequential number for each row
SELECT 
  name,
  ROW_NUMBER() OVER (ORDER BY salary DESC) AS rank
FROM employees;

-- RANK: Rank with gaps for ties
SELECT 
  name,
  RANK() OVER (ORDER BY salary DESC) AS rank
FROM employees;

-- DENSE_RANK: Rank without gaps
SELECT 
  name,
  DENSE_RANK() OVER (ORDER BY salary DESC) AS rank
FROM employees;

-- LAG/LEAD: Access previous/next row
SELECT 
  date,
  amount,
  LAG(amount) OVER (ORDER BY date) AS prev_amount,
  LEAD(amount) OVER (ORDER BY date) AS next_amount
FROM sales;

-- SUM/AVG/COUNT: Running totals
SELECT 
  date,
  amount,
  SUM(amount) OVER (ORDER BY date) AS running_total,
  AVG(amount) OVER (PARTITION BY region) AS region_avg
FROM sales;`}
          />

          <div className="bg-yellow-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Prisma: Window Functions</h3>
            <p className="text-sm mb-2">
              <strong>Important:</strong> Prisma doesn't support window functions directly. Use raw queries.
            </p>
            <CodeBlock
              title="Prisma: Window Functions (Raw Query)"
              language="typescript"
              code={`// Window functions require raw queries
const rankedUsers = await prisma.$queryRaw\`\`
  SELECT 
    name,
    RANK() OVER (ORDER BY salary DESC) AS rank
  FROM "Employee"
  WHERE salary IS NOT NULL
\`\`;

// Or calculate in application after fetching
const employees = await prisma.employee.findMany({
  orderBy: {
    salary: 'desc',
  },
});

// Calculate rank in JavaScript
const ranked = employees.map((emp, index) => ({
  ...emp,
  rank: index + 1,
}));`}
            />
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Subqueries</h2>
          
          <h3 className="text-xl font-semibold mb-3">Types of Subqueries</h3>
          <CodeBlock
            title="Scalar Subquery (Returns single value)"
            language="sql"
            code={`-- Returns single value, can be used in SELECT, WHERE, HAVING
SELECT 
  name,
  (SELECT AVG(salary) FROM employees) AS avg_salary
FROM employees
WHERE salary > (SELECT AVG(salary) FROM employees);`}
          />

          <CodeBlock
            title="Row Subquery (Returns single row)"
            language="sql"
            code={`-- Returns single row with multiple columns
SELECT * 
FROM employees
WHERE (department, salary) = (
  SELECT department, MAX(salary)
  FROM employees
  GROUP BY department
  LIMIT 1
);`}
          />

          <CodeBlock
            title="Column Subquery (Returns single column)"
            language="sql"
            code={`-- Returns multiple rows, single column
SELECT * 
FROM products
WHERE category_id IN (
  SELECT id FROM categories WHERE active = true
);`}
          />

          <CodeBlock
            title="Table Subquery (Returns table)"
            language="sql"
            code={`-- Returns table, used in FROM clause
SELECT * 
FROM (
  SELECT department, AVG(salary) AS avg_sal
  FROM employees
  GROUP BY department
) AS dept_avg
WHERE avg_sal > 50000;`}
          />

          <CodeBlock
            title="SQL: EXISTS vs IN - Interview Favorite"
            language="sql"
            code={`-- EXISTS: Stops after first match (often faster)
SELECT * 
FROM customers c
WHERE EXISTS (
  SELECT 1 FROM orders o 
  WHERE o.customer_id = c.id
);

-- IN: Must evaluate all values
SELECT * 
FROM customers
WHERE id IN (
  SELECT customer_id FROM orders
);

-- Interview Tip: EXISTS is generally faster for large datasets
-- Use IN when you need to check against a small, static list`}
          />

          <CodeBlock
            title="Prisma: EXISTS vs IN Pattern"
            language="typescript"
            code={`// EXISTS equivalent: Use some/none
const customersWithOrders = await prisma.customer.findMany({
  where: {
    orders: {
      some: {},  // EXISTS - at least one order
    },
  },
});

// NOT EXISTS equivalent
const customersWithoutOrders = await prisma.customer.findMany({
  where: {
    orders: {
      none: {},  // NOT EXISTS - no orders
    },
  },
});

// IN equivalent: Use in
const customersInList = await prisma.customer.findMany({
  where: {
    id: {
      in: [1, 2, 3, 4, 5],  // Static list
    },
  },
});

// Interview Tip: Prisma's some/none are optimized similar to EXISTS`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Common Table Expressions (CTEs)</h2>
          <CodeBlock
            title="SQL: CTE Syntax"
            language="sql"
            code={`WITH cte_name AS (
  SELECT ...
),
another_cte AS (
  SELECT ...
)
SELECT * FROM cte_name;`}
          />

          <div className="bg-yellow-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Prisma: CTEs</h3>
            <p className="text-sm mb-2">
              Prisma doesn't support CTEs directly. Use raw queries or break into multiple queries.
            </p>
            <CodeBlock
              title="Prisma: CTEs (Raw Query)"
              language="typescript"
              code={`// CTEs require raw queries
const result = await prisma.$queryRaw\`\`
  WITH active_users AS (
    SELECT * FROM "User" WHERE age >= 18
  ),
  published_posts AS (
    SELECT * FROM "Post" WHERE published = true
  )
  SELECT * FROM active_users
\`\`;

// Or use multiple Prisma queries
const activeUsers = await prisma.user.findMany({
  where: { age: { gte: 18 } },
});

const publishedPosts = await prisma.post.findMany({
  where: { published: true },
  include: { author: true },
});

// Then combine in application code`}
            />
          </div>

          <CodeBlock
            title="SQL: Recursive CTE (Important for Interviews!)"
            language="sql"
            code={`-- Find all ancestors of an employee
WITH RECURSIVE employee_hierarchy AS (
  -- Anchor: Start with CEO
  SELECT id, name, manager_id, 1 AS level
  FROM employees
  WHERE manager_id IS NULL
  
  UNION ALL
  
  -- Recursive: Find subordinates
  SELECT e.id, e.name, e.manager_id, eh.level + 1
  FROM employees e
  INNER JOIN employee_hierarchy eh ON e.manager_id = eh.id
)
SELECT * FROM employee_hierarchy;`}
          />

          <div className="bg-yellow-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Prisma: Recursive CTEs</h3>
            <p className="text-sm mb-2">
              Recursive CTEs <strong>must</strong> use raw queries in Prisma.
            </p>
            <CodeBlock
              title="Prisma: Recursive CTE (Raw Query Only)"
              language="typescript"
              code={`// Recursive CTEs require raw queries
interface EmployeeHierarchy {
  id: number;
  name: string;
  manager_id: number | null;
  level: number;
}

const hierarchy = await prisma.$queryRaw<EmployeeHierarchy[]>\`\`
  WITH RECURSIVE employee_hierarchy AS (
    SELECT id, name, manager_id, 1 AS level
    FROM "Employee"
    WHERE manager_id IS NULL
    
    UNION ALL
    
    SELECT e.id, e.name, e.manager_id, eh.level + 1
    FROM "Employee" e
    INNER JOIN employee_hierarchy eh ON e.manager_id = eh.id
  )
  SELECT * FROM employee_hierarchy
\`\`;`}
            />
          </div>

          <div className="bg-green-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">CTE vs Subquery - Interview Questions</h3>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li><strong>CTE:</strong> More readable, reusable in same query, can be recursive</li>
              <li><strong>Subquery:</strong> More compact, sometimes better performance</li>
              <li><strong>Use CTE:</strong> Complex queries, recursive queries, multiple references</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Set Operations</h2>
          <CodeBlock
            title="UNION, INTERSECT, EXCEPT"
            language="sql"
            code={`-- UNION: Combine results, removes duplicates
SELECT name FROM table1
UNION
SELECT name FROM table2;

-- UNION ALL: Combine results, keeps duplicates (faster)
SELECT name FROM table1
UNION ALL
SELECT name FROM table2;

-- INTERSECT: Common rows in both queries
SELECT id FROM table1
INTERSECT
SELECT id FROM table2;

-- EXCEPT: Rows in first query but not in second
SELECT id FROM table1
EXCEPT
SELECT id FROM table2;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Common Interview Questions</h2>
          
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Q: Difference between WHERE and HAVING?</h3>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li><strong>WHERE:</strong> Filters rows before grouping (can't use aggregate functions)</li>
              <li><strong>HAVING:</strong> Filters groups after grouping (can use aggregate functions)</li>
              <li><strong>Both:</strong> Can be used together - WHERE first, then HAVING</li>
            </ul>
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Q: Difference between DELETE, TRUNCATE, and DROP?</h3>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li><strong>DELETE:</strong> Removes rows, can be rolled back, can have WHERE clause, slower</li>
              <li><strong>TRUNCATE:</strong> Removes all rows, faster, resets auto-increment, can be rolled back (in transaction)</li>
              <li><strong>DROP:</strong> Removes entire table structure, cannot be rolled back</li>
            </ul>
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Q: Difference between RANK, DENSE_RANK, and ROW_NUMBER?</h3>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li><strong>ROW_NUMBER:</strong> Sequential numbers (1, 2, 3, 4, 5)</li>
              <li><strong>RANK:</strong> Same rank for ties, gaps after ties (1, 2, 2, 4, 5)</li>
              <li><strong>DENSE_RANK:</strong> Same rank for ties, no gaps (1, 2, 2, 3, 4)</li>
            </ul>
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Q: How to find duplicate rows?</h3>
            <CodeBlock
              title="Finding Duplicates"
              language="sql"
              code={`-- Method 1: GROUP BY with HAVING
SELECT email, COUNT(*) 
FROM users 
GROUP BY email 
HAVING COUNT(*) > 1;

-- Method 2: Window function
SELECT * FROM (
  SELECT *, 
    ROW_NUMBER() OVER (PARTITION BY email ORDER BY id) AS rn
  FROM users
) t WHERE rn > 1;`}
            />
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Q: How to delete duplicates?</h3>
            <CodeBlock
              title="Deleting Duplicates"
              language="sql"
              code={`-- Keep one row, delete others
DELETE FROM users 
WHERE id NOT IN (
  SELECT MIN(id) 
  FROM users 
  GROUP BY email
);

-- Or using CTID (PostgreSQL specific)
DELETE FROM users 
WHERE ctid NOT IN (
  SELECT MIN(ctid) 
  FROM users 
  GROUP BY email
);`}
            />
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}


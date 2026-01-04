import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'WHERE clause - PostgreSQL Learning',
  description: 'Learn about WHERE clause in PostgreSQL including comparison operators, logical operators, IN, BETWEEN, LIKE, and NULL checks',
};

export default function WhereClause() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">WHERE clause</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Comparison Operators</h2>

          <CodeBlock
            title="SQL: Comparison Operators"
            language="sql"
            code={`-- Equality
SELECT * FROM users WHERE id = 1;
SELECT * FROM users WHERE username = 'johndoe';

-- Inequality
SELECT * FROM users WHERE id != 1;
SELECT * FROM users WHERE id <> 1;  -- Alternative syntax

-- Greater than / Less than
SELECT * FROM products WHERE price > 100;
SELECT * FROM products WHERE price < 50;
SELECT * FROM products WHERE price >= 100;
SELECT * FROM products WHERE price <= 50;

-- Comparison with dates
SELECT * FROM orders WHERE created_at > '2024-01-01';
SELECT * FROM orders WHERE created_at >= CURRENT_DATE;`}
          />
          <CodeBlock
            title="Prisma: Comparison Operators"
            language="prisma"
            code={`// Equality
const user = await prisma.user.findMany({
  where: { id: 1 },
});

// Greater than / Less than
const products = await prisma.product.findMany({
  where: {
    price: {
      gt: 100,  // greater than
      lt: 1000, // less than
      gte: 100, // greater than or equal
      lte: 1000, // less than or equal
    },
  },
});

// Date comparisons
const orders = await prisma.order.findMany({
  where: {
    createdAt: {
      gt: new Date('2024-01-01'),
      gte: new Date(),
    },
  },
});`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Logical Operators</h2>

          <CodeBlock
            title="SQL: Logical Operators"
            language="sql"
            code={`-- AND
SELECT * FROM users WHERE status = 'active' AND age >= 18;

-- OR
SELECT * FROM users WHERE status = 'active' OR status = 'pending';

-- NOT
SELECT * FROM users WHERE NOT status = 'inactive';
SELECT * FROM products WHERE NOT price > 100;

-- Combined
SELECT * FROM users 
WHERE (status = 'active' OR status = 'pending')
  AND age >= 18
  AND email IS NOT NULL;`}
          />
          <CodeBlock
            title="Prisma: Logical Operators"
            language="prisma"
            code={`// AND (default when multiple conditions)
const users = await prisma.user.findMany({
  where: {
    status: 'active',
    age: { gte: 18 },
  },
});

// OR
const users = await prisma.user.findMany({
  where: {
    OR: [
      { status: 'active' },
      { status: 'pending' },
    ],
  },
});

// NOT
const users = await prisma.user.findMany({
  where: {
    NOT: {
      status: 'inactive',
    },
  },
});

// Combined
const users = await prisma.user.findMany({
  where: {
    OR: [
      { status: 'active' },
      { status: 'pending' },
    ],
    age: { gte: 18 },
    email: { not: null },
  },
});`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">IN and NOT IN</h2>

          <CodeBlock
            title="SQL: IN and NOT IN"
            language="sql"
            code={`-- IN
SELECT * FROM users WHERE id IN (1, 2, 3, 4, 5);
SELECT * FROM users WHERE status IN ('active', 'pending');

-- NOT IN
SELECT * FROM users WHERE id NOT IN (1, 2, 3);
SELECT * FROM products WHERE category_id NOT IN (1, 2);

-- IN with subquery
SELECT * FROM users WHERE id IN (
  SELECT user_id FROM orders WHERE total > 100
);

-- NOT IN with subquery
SELECT * FROM users WHERE id NOT IN (
  SELECT user_id FROM orders
);`}
          />
          <CodeBlock
            title="Prisma: IN and NOT IN"
            language="prisma"
            code={`// IN
const users = await prisma.user.findMany({
  where: {
    id: { in: [1, 2, 3, 4, 5] },
  },
});

// NOT IN
const users = await prisma.user.findMany({
  where: {
    id: { notIn: [1, 2, 3] },
  },
});

// IN with subquery (use raw SQL)
const users = await prisma.$queryRaw\`
  SELECT * FROM users 
  WHERE id IN (
    SELECT user_id FROM orders WHERE total > 100
  )
\`;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">BETWEEN</h2>

          <CodeBlock
            title="SQL: BETWEEN"
            language="sql"
            code={`-- BETWEEN (inclusive)
SELECT * FROM products WHERE price BETWEEN 10 AND 100;
SELECT * FROM orders WHERE created_at BETWEEN '2024-01-01' AND '2024-12-31';

-- NOT BETWEEN
SELECT * FROM products WHERE price NOT BETWEEN 10 AND 100;

-- BETWEEN with dates
SELECT * FROM events 
WHERE event_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days';`}
          />
          <CodeBlock
            title="Prisma: BETWEEN"
            language="prisma"
            code={`// BETWEEN
const products = await prisma.product.findMany({
  where: {
    price: {
      gte: 10,
      lte: 100,
    },
  },
});

// Date range
const orders = await prisma.order.findMany({
  where: {
    createdAt: {
      gte: new Date('2024-01-01'),
      lte: new Date('2024-12-31'),
    },
  },
});`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">LIKE and ILIKE</h2>

          <CodeBlock
            title="SQL: LIKE and ILIKE"
            language="sql"
            code={`-- LIKE (case-sensitive)
SELECT * FROM users WHERE username LIKE 'john%';
SELECT * FROM users WHERE email LIKE '%@example.com';
SELECT * FROM users WHERE username LIKE 'j_n%';  -- _ matches single character

-- ILIKE (case-insensitive)
SELECT * FROM users WHERE username ILIKE 'john%';
SELECT * FROM users WHERE email ILIKE '%EXAMPLE.COM';

-- NOT LIKE / NOT ILIKE
SELECT * FROM users WHERE username NOT LIKE 'admin%';
SELECT * FROM users WHERE email NOT ILIKE '%test%';`}
          />
          <CodeBlock
            title="Prisma: LIKE and ILIKE"
            language="prisma"
            code={`// LIKE (contains, startsWith, endsWith)
const users = await prisma.user.findMany({
  where: {
    username: {
      contains: 'john',
      mode: 'insensitive',  // ILIKE
    },
  },
});

// startsWith
const users = await prisma.user.findMany({
  where: {
    email: {
      startsWith: 'john',
      mode: 'insensitive',
    },
  },
});

// endsWith
const users = await prisma.user.findMany({
  where: {
    email: {
      endsWith: '@example.com',
      mode: 'insensitive',
    },
  },
});

// Use raw SQL for complex patterns
const users = await prisma.$queryRaw\`
  SELECT * FROM users WHERE username LIKE 'j_n%'
\`;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">SIMILAR TO</h2>

          <CodeBlock
            title="SQL: SIMILAR TO"
            language="sql"
            code={`-- SIMILAR TO (SQL standard pattern matching)
SELECT * FROM users WHERE username SIMILAR TO 'j%';
SELECT * FROM users WHERE email SIMILAR TO '%@example\.com';

-- SIMILAR TO with character classes
SELECT * FROM users WHERE username SIMILAR TO '[a-z]+';
SELECT * FROM users WHERE phone SIMILAR TO '[0-9]{3}-[0-9]{3}-[0-9]{4}';

-- NOT SIMILAR TO
SELECT * FROM users WHERE username NOT SIMILAR TO 'admin%';`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">IS NULL and IS NOT NULL</h2>

          <CodeBlock
            title="SQL: NULL Checks"
            language="sql"
            code={`-- IS NULL
SELECT * FROM users WHERE email IS NULL;
SELECT * FROM products WHERE description IS NULL;

-- IS NOT NULL
SELECT * FROM users WHERE email IS NOT NULL;
SELECT * FROM orders WHERE completed_at IS NOT NULL;

-- NULL in comparisons (doesn't work as expected)
SELECT * FROM users WHERE email = NULL;  -- Always false!
SELECT * FROM users WHERE email != NULL;  -- Always false!
-- Always use IS NULL or IS NOT NULL`}
          />
          <CodeBlock
            title="Prisma: NULL Checks"
            language="prisma"
            code={`// IS NULL
const users = await prisma.user.findMany({
  where: {
    email: null,
  },
});

// IS NOT NULL
const users = await prisma.user.findMany({
  where: {
    email: { not: null },
  },
});

// Or use isSet
const users = await prisma.user.findMany({
  where: {
    email: { isSet: true },
  },
});`}
          />
        </section>
      </div>
    </LessonLayout>
  );
}


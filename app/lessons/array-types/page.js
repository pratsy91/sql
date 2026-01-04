import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Array Types - PostgreSQL Learning',
  description: 'Learn about PostgreSQL array types, operators, and functions',
};

export default function ArrayTypes() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Array Types</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Array Overview</h2>
          <p className="mb-4">
            PostgreSQL supports arrays of any data type, including multidimensional arrays.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Array Declaration and Usage</h2>

          <CodeBlock
            title="SQL: Array Types"
            language="sql"
            code={`-- Create table with arrays
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  tags TEXT[],
  prices INTEGER[],
  dimensions INTEGER[][]
);

-- Insert array values
INSERT INTO products (name, tags, prices, dimensions)
VALUES 
  ('Laptop', ARRAY['electronics', 'computers'], ARRAY[999, 1299, 1499], ARRAY[[10, 20], [15, 25]]),
  ('Phone', '{mobile,smartphone}', '{599,699,799}', '{{5,10},{6,12}}');

-- Array operators
SELECT * FROM products WHERE 'electronics' = ANY(tags);
SELECT * FROM products WHERE tags @> ARRAY['electronics'];
SELECT * FROM products WHERE tags && ARRAY['mobile', 'electronics'];

-- Array functions
SELECT 
  name,
  tags,
  array_length(tags, 1) AS tag_count,
  array_agg(name) AS all_names,
  unnest(tags) AS individual_tag
FROM products;`}
          />
          <CodeBlock
            title="Prisma: Array Types"
            language="prisma"
            code={`// schema.prisma
model Product {
  id         Int      @id @default(autoincrement())
  name       String   @db.VarChar(100)
  tags       String[]
  prices     Int[]
  dimensions Int[]
  
  @@map("products")
}

// Usage
const product = await prisma.product.create({
  data: {
    name: 'Laptop',
    tags: ['electronics', 'computers'],
    prices: [999, 1299, 1499],
    dimensions: [10, 20],
  },
});

// Query arrays
const products = await prisma.product.findMany({
  where: {
    tags: {
      has: 'electronics',
    },
  },
});`}
          />
        </section>
      </div>
    </LessonLayout>
  );
}


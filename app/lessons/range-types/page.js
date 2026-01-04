import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Range Types - PostgreSQL Learning',
  description: 'Learn about PostgreSQL range types including int4range, numrange, tsrange, and daterange',
};

export default function RangeTypes() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Range Types</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Range Type Overview</h2>
          <p className="mb-4">
            Range types represent a range of values with inclusive/exclusive bounds.
          </p>
        </section>

        <CodeBlock
          title="SQL: Range Types"
          language="sql"
          code={`-- Range types: int4range, int8range, numrange, tsrange, tstzrange, daterange
CREATE TABLE reservations (
  id SERIAL PRIMARY KEY,
  room_id INTEGER,
  stay_period DATERANGE,
  price_range NUMRANGE
);

INSERT INTO reservations (room_id, stay_period, price_range)
VALUES 
  (1, '[2024-01-01, 2024-01-05)', '[100, 200)'),
  (2, '[2024-02-01, 2024-02-10]', '[150, 250]');

-- Range operators
SELECT * FROM reservations 
WHERE stay_period @> DATE '2024-01-03';  -- Contains

SELECT * FROM reservations 
WHERE stay_period && DATERANGE('[2024-01-04, 2024-01-06)');  -- Overlaps`}
        />
      </div>
    </LessonLayout>
  );
}


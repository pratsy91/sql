import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'EXCLUDE Constraint - PostgreSQL Learning',
  description: 'Learn about EXCLUDE constraints in PostgreSQL using operators for preventing overlapping ranges',
};

export default function ExcludeConstraint() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">EXCLUDE Constraint</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Exclusion Constraints Overview</h2>
          <p className="mb-4">
            EXCLUDE constraints prevent overlapping values using operators. Commonly used for ranges, timestamps, and geometric data.
          </p>

          <CodeBlock
            title="SQL: EXCLUDE Constraint"
            language="sql"
            code={`-- Enable btree_gist extension for EXCLUDE constraints
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- EXCLUDE constraint for non-overlapping time ranges
CREATE TABLE reservations (
  id SERIAL PRIMARY KEY,
  room_id INTEGER NOT NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guest_name VARCHAR(100),
  EXCLUDE USING gist (
    room_id WITH =,
    daterange(check_in, check_out) WITH &&
  )
);

-- Valid reservations (different rooms or non-overlapping dates)
INSERT INTO reservations (room_id, check_in, check_out, guest_name)
VALUES (1, '2024-06-01', '2024-06-05', 'John Doe');

INSERT INTO reservations (room_id, check_in, check_out, guest_name)
VALUES (1, '2024-06-06', '2024-06-10', 'Jane Smith');  -- OK (non-overlapping)

INSERT INTO reservations (room_id, check_in, check_out, guest_name)
VALUES (2, '2024-06-01', '2024-06-05', 'Bob Wilson');  -- OK (different room)

-- Invalid reservation (overlapping dates for same room)
INSERT INTO reservations (room_id, check_in, check_out, guest_name)
VALUES (1, '2024-06-03', '2024-06-07', 'Alice Brown');
-- Error: conflicting key value violates exclusion constraint "reservations_room_id_check_in_check_out_excl"`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Using Operators</h2>

          <CodeBlock
            title="SQL: EXCLUDE with Different Operators"
            language="sql"
            code={`-- EXCLUDE with timestamp ranges
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  venue_id INTEGER NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  event_name VARCHAR(200),
  EXCLUDE USING gist (
    venue_id WITH =,
    tstzrange(start_time, end_time) WITH &&
  )
);

-- EXCLUDE for non-overlapping IP ranges
CREATE TABLE ip_allocations (
  id SERIAL PRIMARY KEY,
  network_name VARCHAR(100) NOT NULL,
  ip_range CIDR NOT NULL,
  EXCLUDE USING gist (ip_range WITH &&)
);

-- EXCLUDE with multiple conditions
CREATE TABLE shifts (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  EXCLUDE USING gist (
    employee_id WITH =,
    tstzrange(start_time, end_time) WITH &&
  )
);

-- Operators used in EXCLUDE:
-- = (equality)
-- && (overlaps)
-- <@ (contained in)
-- @> (contains)
-- < (less than)
-- > (greater than)
-- <= (less than or equal)
-- >= (greater than or equal)
-- <> (not equal)`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">EXCLUDE with WHERE Clause</h2>

          <CodeBlock
            title="SQL: Partial EXCLUDE Constraint"
            language="sql"
            code={`-- EXCLUDE constraint only for active reservations
CREATE TABLE reservations (
  id SERIAL PRIMARY KEY,
  room_id INTEGER NOT NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  guest_name VARCHAR(100),
  EXCLUDE USING gist (
    room_id WITH =,
    daterange(check_in, check_out) WITH &&
  ) WHERE (status = 'active')
);

-- Allows overlapping dates for cancelled reservations
INSERT INTO reservations (room_id, check_in, check_out, status, guest_name)
VALUES (1, '2024-06-01', '2024-06-05', 'active', 'John');

INSERT INTO reservations (room_id, check_in, check_out, status, guest_name)
VALUES (1, '2024-06-01', '2024-06-05', 'cancelled', 'Jane');  -- OK (cancelled)

INSERT INTO reservations (room_id, check_in, check_out, status, guest_name)
VALUES (1, '2024-06-03', '2024-06-07', 'active', 'Bob');  -- Fails (overlaps active)`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Use EXCLUDE</strong> for preventing overlapping ranges (schedules, reservations)</li>
              <li><strong>Requires extension</strong> - Enable btree_gist for most use cases</li>
              <li><strong>Use appropriate operators</strong> - && for overlaps, = for equality</li>
              <li><strong>Combine with WHERE</strong> for conditional exclusion</li>
              <li><strong>Performance</strong> - Creates GiST index automatically</li>
            </ul>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}


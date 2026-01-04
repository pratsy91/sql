import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Date/Time Types - PostgreSQL Learning',
  description: 'Learn about PostgreSQL date and time data types including date, time, timestamp, interval, and timezone handling',
};

export default function DateTimeTypes() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Date/Time Types</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Date/Time Type Overview</h2>
          <p className="mb-4">
            PostgreSQL provides comprehensive date and time types with timezone support.
          </p>
          
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Type</th>
                  <th className="text-left p-2">Storage</th>
                  <th className="text-left p-2">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-2"><code>DATE</code></td>
                  <td className="p-2">4 bytes</td>
                  <td className="p-2">Date only (no time)</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2"><code>TIME</code></td>
                  <td className="p-2">8 bytes</td>
                  <td className="p-2">Time of day (no date, no timezone)</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2"><code>TIMETZ</code></td>
                  <td className="p-2">12 bytes</td>
                  <td className="p-2">Time of day with timezone</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2"><code>TIMESTAMP</code></td>
                  <td className="p-2">8 bytes</td>
                  <td className="p-2">Date and time (no timezone)</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2"><code>TIMESTAMPTZ</code></td>
                  <td className="p-2">8 bytes</td>
                  <td className="p-2">Date and time with timezone (recommended)</td>
                </tr>
                <tr>
                  <td className="p-2"><code>INTERVAL</code></td>
                  <td className="p-2">16 bytes</td>
                  <td className="p-2">Time interval</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">DATE Type</h2>
          <p className="mb-4">
            DATE stores only the date portion (year, month, day) without time information.
          </p>

          <CodeBlock
            title="SQL: DATE Type"
            language="sql"
            code={`-- Create table with DATE
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  event_name VARCHAR(100),
  event_date DATE,
  registration_deadline DATE
);

-- Insert date values
INSERT INTO events (event_name, event_date, registration_deadline)
VALUES 
  ('Conference', '2024-06-15', '2024-06-01'),
  ('Workshop', DATE '2024-07-20', '2024-07-10'),
  ('Seminar', '2024-08-05', NULL);

-- Current date
SELECT CURRENT_DATE AS today;
SELECT CURRENT_DATE + INTERVAL '1 day' AS tomorrow;
SELECT CURRENT_DATE - INTERVAL '1 week' AS last_week;

-- Date arithmetic
SELECT 
  event_name,
  event_date,
  event_date + INTERVAL '30 days' AS event_plus_30_days,
  event_date - CURRENT_DATE AS days_until_event,
  EXTRACT(YEAR FROM event_date) AS event_year,
  EXTRACT(MONTH FROM event_date) AS event_month,
  EXTRACT(DAY FROM event_date) AS event_day
FROM events;

-- Date comparison
SELECT * FROM events WHERE event_date > CURRENT_DATE;
SELECT * FROM events WHERE event_date BETWEEN '2024-06-01' AND '2024-06-30';
SELECT * FROM events WHERE EXTRACT(YEAR FROM event_date) = 2024;

-- Date formatting
SELECT 
  event_date,
  TO_CHAR(event_date, 'YYYY-MM-DD') AS iso_format,
  TO_CHAR(event_date, 'Month DD, YYYY') AS long_format,
  TO_CHAR(event_date, 'DD/MM/YYYY') AS european_format
FROM events;`}
          />
          <CodeBlock
            title="Prisma: DATE Type"
            language="prisma"
            code={`// schema.prisma
model Event {
  id                  Int       @id @default(autoincrement())
  eventName            String    @map("event_name") @db.VarChar(100)
  eventDate            DateTime  @map("event_date") @db.Date
  registrationDeadline DateTime? @map("registration_deadline") @db.Date
  
  @@map("events")
}

// Usage
const event = await prisma.event.create({
  data: {
    eventName: 'Conference',
    eventDate: new Date('2024-06-15'),
    registrationDeadline: new Date('2024-06-01'),
  },
});

// Query with date filtering
const upcomingEvents = await prisma.event.findMany({
  where: {
    eventDate: {
      gt: new Date(),  // Greater than today
    },
  },
});

// Date arithmetic using raw SQL
const events = await prisma.$queryRaw\`
  SELECT 
    event_name,
    event_date,
    event_date + INTERVAL '30 days' AS event_plus_30_days
  FROM events
  WHERE event_date > CURRENT_DATE
\`;

// Format dates
const formatted = await prisma.$queryRaw\`
  SELECT 
    event_name,
    TO_CHAR(event_date, 'Month DD, YYYY') AS formatted_date
  FROM events
\`;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">TIME and TIMETZ Types</h2>
          <p className="mb-4">
            TIME stores time of day without date. TIMETZ includes timezone information.
          </p>

          <CodeBlock
            title="SQL: TIME Types"
            language="sql"
            code={`-- Create table with TIME types
CREATE TABLE schedules (
  id SERIAL PRIMARY KEY,
  event_name VARCHAR(100),
  start_time TIME,              -- No timezone
  end_time TIMETZ,              -- With timezone
  break_time TIME
);

-- Insert time values
INSERT INTO schedules (event_name, start_time, end_time, break_time)
VALUES 
  ('Morning Session', '09:00:00', '09:00:00-05:00', '10:30:00'),
  ('Afternoon Session', '14:00:00', '14:00:00+00:00', '15:30:00'),
  ('Evening Session', '18:00:00', '18:00:00-08:00', NULL);

-- Current time
SELECT CURRENT_TIME AS current_time;
SELECT CURRENT_TIME(2) AS current_time_precise;  -- With precision
SELECT LOCALTIME AS local_time;

-- Time arithmetic
SELECT 
  event_name,
  start_time,
  start_time + INTERVAL '2 hours' AS two_hours_later,
  end_time - start_time AS duration,
  EXTRACT(HOUR FROM start_time) AS start_hour,
  EXTRACT(MINUTE FROM start_time) AS start_minute
FROM schedules;

-- Time comparison
SELECT * FROM schedules WHERE start_time > '12:00:00';
SELECT * FROM schedules WHERE start_time BETWEEN '09:00:00' AND '17:00:00';

-- Time formatting
SELECT 
  start_time,
  TO_CHAR(start_time, 'HH24:MI:SS') AS formatted_time,
  TO_CHAR(start_time, 'HH12:MI AM') AS twelve_hour_format
FROM schedules;`}
          />
          <CodeBlock
            title="Prisma: TIME Types"
            language="prisma"
            code={`// schema.prisma
// Note: Prisma doesn't have native TIME type support
// Use String or DateTime and handle conversion

model Schedule {
  id        Int      @id @default(autoincrement())
  eventName String   @map("event_name") @db.VarChar(100)
  startTime String   @map("start_time") @db.Time
  endTime   String   @map("end_time") @db.Time(6)  // With precision
  breakTime String?  @map("break_time") @db.Time
  
  @@map("schedules")
}

// Usage
const schedule = await prisma.schedule.create({
  data: {
    eventName: 'Morning Session',
    startTime: '09:00:00',
    endTime: '09:00:00',
    breakTime: '10:30:00',
  },
});

// Query with time filtering
const morningSessions = await prisma.$queryRaw\`
  SELECT * FROM schedules
  WHERE start_time > '12:00:00'
\`;

// Time arithmetic
const schedules = await prisma.$queryRaw\`
  SELECT 
    event_name,
    start_time,
    start_time + INTERVAL '2 hours' AS two_hours_later
  FROM schedules
\`;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">TIMESTAMP and TIMESTAMPTZ Types</h2>
          <p className="mb-4">
            TIMESTAMP stores date and time without timezone. TIMESTAMPTZ (timestamp with time zone) 
            stores date and time with timezone and is recommended for most use cases.
          </p>

          <CodeBlock
            title="SQL: TIMESTAMP Types"
            language="sql"
            code={`-- Create table with TIMESTAMP types
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200),
  created_at TIMESTAMP,           -- No timezone
  updated_at TIMESTAMPTZ,          -- With timezone (recommended)
  published_at TIMESTAMPTZ
);

-- Insert timestamp values
INSERT INTO posts (title, created_at, updated_at, published_at)
VALUES 
  ('First Post', '2024-01-15 10:30:00', '2024-01-15 10:30:00+00:00', '2024-01-15 10:30:00+00:00'),
  ('Second Post', '2024-01-16 14:45:00', NOW(), NOW()),
  ('Third Post', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL);

-- Current timestamp functions
SELECT 
  NOW() AS now_with_tz,
  CURRENT_TIMESTAMP AS current_timestamp,
  CURRENT_TIMESTAMP(2) AS current_timestamp_precise,
  LOCALTIMESTAMP AS local_timestamp,
  STATEMENT_TIMESTAMP() AS statement_timestamp,
  CLOCK_TIMESTAMP() AS clock_timestamp;

-- Timestamp arithmetic
SELECT 
  title,
  created_at,
  updated_at,
  updated_at - created_at AS time_diff,
  created_at + INTERVAL '1 day' AS next_day,
  created_at + INTERVAL '2 hours 30 minutes' AS later_time,
  AGE(updated_at, created_at) AS age_interval
FROM posts;

-- Extract components
SELECT 
  title,
  created_at,
  EXTRACT(YEAR FROM created_at) AS year,
  EXTRACT(MONTH FROM created_at) AS month,
  EXTRACT(DAY FROM created_at) AS day,
  EXTRACT(HOUR FROM created_at) AS hour,
  EXTRACT(MINUTE FROM created_at) AS minute,
  EXTRACT(SECOND FROM created_at) AS second,
  EXTRACT(DOW FROM created_at) AS day_of_week,
  EXTRACT(DOY FROM created_at) AS day_of_year
FROM posts;

-- Timestamp comparison
SELECT * FROM posts WHERE created_at > '2024-01-01';
SELECT * FROM posts WHERE created_at BETWEEN '2024-01-01' AND '2024-01-31';
SELECT * FROM posts WHERE created_at > NOW() - INTERVAL '7 days';

-- Timestamp formatting
SELECT 
  created_at,
  TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') AS iso_format,
  TO_CHAR(created_at, 'Month DD, YYYY HH12:MI AM') AS long_format,
  TO_CHAR(created_at, 'DD/MM/YYYY HH24:MI') AS european_format
FROM posts;`}
          />
          <CodeBlock
            title="Prisma: TIMESTAMP Types"
            language="prisma"
            code={`// schema.prisma
model Post {
  id          Int       @id @default(autoincrement())
  title       String    @db.VarChar(200)
  createdAt   DateTime  @default(now()) @map("created_at") @db.Timestamp(0)
  updatedAt   DateTime  @updatedAt @map("updated_at") @db.Timestamptz(6)
  publishedAt DateTime? @map("published_at") @db.Timestamptz(6)
  
  @@map("posts")
}

// Usage
const post = await prisma.post.create({
  data: {
    title: 'First Post',
    publishedAt: new Date(),
  },
  // createdAt and updatedAt are automatically set
});

// Update (updatedAt is automatically updated)
const updated = await prisma.post.update({
  where: { id: 1 },
  data: {
    title: 'Updated Post',
  },
});

// Query with timestamp filtering
const recentPosts = await prisma.post.findMany({
  where: {
    createdAt: {
      gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),  // Last 7 days
    },
  },
  orderBy: {
    createdAt: 'desc',
  },
});

// Timestamp arithmetic using raw SQL
const posts = await prisma.$queryRaw\`
  SELECT 
    title,
    created_at,
    updated_at - created_at AS time_diff,
    created_at + INTERVAL '1 day' AS next_day
  FROM posts
  WHERE created_at > NOW() - INTERVAL '7 days'
\`;

// Extract date components
const postsWithComponents = await prisma.$queryRaw\`
  SELECT 
    title,
    EXTRACT(YEAR FROM created_at) AS year,
    EXTRACT(MONTH FROM created_at) AS month,
    EXTRACT(DAY FROM created_at) AS day
  FROM posts
\`;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Timezone Handling</h2>
          <p className="mb-4">
            PostgreSQL handles timezones automatically with TIMESTAMPTZ. Values are stored in UTC 
            and converted to the session timezone when displayed.
          </p>

          <CodeBlock
            title="SQL: Timezone Operations"
            language="sql"
            code={`-- Set session timezone
SET TIME ZONE 'UTC';
SET TIME ZONE 'America/New_York';
SET TIME ZONE 'Europe/London';
SET TIME ZONE '+05:30';  -- IST

-- Show current timezone
SHOW TIMEZONE;
SELECT current_setting('timezone');

-- Timezone conversion
SELECT 
  NOW() AS current_time,
  NOW() AT TIME ZONE 'UTC' AS utc_time,
  NOW() AT TIME ZONE 'America/New_York' AS ny_time,
  NOW() AT TIME ZONE 'Europe/London' AS london_time;

-- Create table with timezone-aware timestamps
CREATE TABLE events_tz (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ
);

-- Insert with different timezones
INSERT INTO events_tz (name, start_time, end_time)
VALUES 
  ('UTC Event', '2024-06-15 10:00:00+00:00', '2024-06-15 12:00:00+00:00'),
  ('NY Event', '2024-06-15 10:00:00-05:00', '2024-06-15 12:00:00-05:00'),
  ('London Event', '2024-06-15 10:00:00+01:00', '2024-06-15 12:00:00+01:00');

-- All stored in UTC, displayed in session timezone
SELECT 
  name,
  start_time,
  start_time AT TIME ZONE 'UTC' AS utc_start,
  start_time AT TIME ZONE 'America/New_York' AS ny_start
FROM events_tz;

-- Timezone functions
SELECT 
  name,
  EXTRACT(TIMEZONE FROM start_time) AS timezone_offset_seconds,
  EXTRACT(TIMEZONE_HOUR FROM start_time) AS timezone_hour,
  EXTRACT(TIMEZONE_MINUTE FROM start_time) AS timezone_minute
FROM events_tz;`}
          />
          <CodeBlock
            title="Prisma: Timezone Handling"
            language="javascript"
            code={`// Prisma handles timezones automatically
// TIMESTAMPTZ values are stored in UTC

// schema.prisma
model EventTz {
  id        Int       @id @default(autoincrement())
  name      String    @db.VarChar(100)
  startTime DateTime  @map("start_time") @db.Timestamptz(6)
  endTime   DateTime  @map("end_time") @db.Timestamptz(6)
  
  @@map("events_tz")
}

// Usage - JavaScript Date objects are timezone-aware
const event = await prisma.eventTz.create({
  data: {
    name: 'UTC Event',
    startTime: new Date('2024-06-15T10:00:00Z'),  // UTC
    endTime: new Date('2024-06-15T12:00:00Z'),
  },
});

// Prisma converts to UTC automatically
const eventNY = await prisma.eventTz.create({
  data: {
    name: 'NY Event',
    // JavaScript Date handles timezone conversion
    startTime: new Date('2024-06-15T10:00:00-05:00'),
    endTime: new Date('2024-06-15T12:00:00-05:00'),
  },
});

// Query with timezone conversion
const events = await prisma.$queryRaw\`
  SELECT 
    name,
    start_time,
    start_time AT TIME ZONE 'UTC' AS utc_start,
    start_time AT TIME ZONE 'America/New_York' AS ny_start
  FROM events_tz
\`;

// Set timezone for session
await prisma.$executeRaw\`SET TIME ZONE 'America/New_York'\`;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">INTERVAL Type</h2>
          <p className="mb-4">
            INTERVAL represents a duration or period of time. It's useful for date/time arithmetic.
          </p>

          <CodeBlock
            title="SQL: INTERVAL Type"
            language="sql"
            code={`-- Create table with INTERVAL
CREATE TABLE subscriptions (
  id SERIAL PRIMARY KEY,
  user_name VARCHAR(100),
  subscription_duration INTERVAL,
  trial_period INTERVAL
);

-- Insert interval values
INSERT INTO subscriptions (user_name, subscription_duration, trial_period)
VALUES 
  ('Alice', INTERVAL '1 year', INTERVAL '14 days'),
  ('Bob', INTERVAL '6 months', INTERVAL '30 days'),
  ('Charlie', INTERVAL '90 days', INTERVAL '7 days'),
  ('Diana', '1 year 2 months 3 days', '14 days 12 hours');

-- Interval arithmetic
SELECT 
  user_name,
  subscription_duration,
  trial_period,
  subscription_duration + trial_period AS total_period,
  subscription_duration - INTERVAL '1 month' AS reduced_duration
FROM subscriptions;

-- Extract interval components
SELECT 
  user_name,
  subscription_duration,
  EXTRACT(YEAR FROM subscription_duration) AS years,
  EXTRACT(MONTH FROM subscription_duration) AS months,
  EXTRACT(DAY FROM subscription_duration) AS days,
  EXTRACT(EPOCH FROM subscription_duration) AS total_seconds
FROM subscriptions;

-- Interval formatting
SELECT 
  subscription_duration,
  TO_CHAR(subscription_duration, 'YY "years" MM "months" DD "days"') AS formatted
FROM subscriptions;

-- Using intervals with dates
SELECT 
  CURRENT_DATE AS today,
  CURRENT_DATE + INTERVAL '1 year' AS one_year_later,
  CURRENT_DATE + INTERVAL '2 months 3 days' AS later_date,
  NOW() + INTERVAL '1 hour 30 minutes' AS later_time;

-- Age function (returns interval)
SELECT 
  user_name,
  subscription_duration,
  AGE(CURRENT_DATE + subscription_duration, CURRENT_DATE) AS age_interval
FROM subscriptions;`}
          />
          <CodeBlock
            title="Prisma: INTERVAL Type"
            language="prisma"
            code={`// schema.prisma
// Prisma doesn't have native INTERVAL type
// Use String or handle in application code

model Subscription {
  id                  Int     @id @default(autoincrement())
  userName            String  @map("user_name") @db.VarChar(100)
  subscriptionDuration String @map("subscription_duration") @db.Interval
  trialPeriod         String? @map("trial_period") @db.Interval
  
  @@map("subscriptions")
}

// Usage
const subscription = await prisma.subscription.create({
  data: {
    userName: 'Alice',
    subscriptionDuration: '1 year',
    trialPeriod: '14 days',
  },
});

// Interval operations using raw SQL
const subscriptions = await prisma.$queryRaw\`
  SELECT 
    user_name,
    subscription_duration,
    subscription_duration + trial_period AS total_period
  FROM subscriptions
\`;

// Extract interval components
const intervals = await prisma.$queryRaw\`
  SELECT 
    user_name,
    EXTRACT(YEAR FROM subscription_duration) AS years,
    EXTRACT(MONTH FROM subscription_duration) AS months,
    EXTRACT(DAY FROM subscription_duration) AS days
  FROM subscriptions
\`;

// Date arithmetic with intervals
const futureDates = await prisma.$queryRaw\`
  SELECT 
    CURRENT_DATE + subscription_duration AS expiration_date
  FROM subscriptions
\`;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Date/Time Functions</h2>
          <p className="mb-4">
            PostgreSQL provides extensive date/time manipulation functions.
          </p>

          <CodeBlock
            title="SQL: Date/Time Functions"
            language="sql"
            code={`-- Date truncation
SELECT 
  DATE_TRUNC('year', NOW()) AS year_start,
  DATE_TRUNC('month', NOW()) AS month_start,
  DATE_TRUNC('day', NOW()) AS day_start,
  DATE_TRUNC('hour', NOW()) AS hour_start,
  DATE_TRUNC('minute', NOW()) AS minute_start;

-- Date part extraction
SELECT 
  DATE_PART('year', NOW()) AS year,
  DATE_PART('month', NOW()) AS month,
  DATE_PART('day', NOW()) AS day,
  DATE_PART('hour', NOW()) AS hour,
  DATE_PART('dow', NOW()) AS day_of_week,
  DATE_PART('quarter', NOW()) AS quarter;

-- Age calculation
SELECT 
  AGE('2024-01-01', '2020-01-01') AS age_interval,
  AGE(TIMESTAMP '2024-01-01') AS age_from_now;

-- Make date/time functions
SELECT 
  MAKE_DATE(2024, 6, 15) AS made_date,
  MAKE_TIME(10, 30, 45.5) AS made_time,
  MAKE_TIMESTAMP(2024, 6, 15, 10, 30, 45.5) AS made_timestamp,
  MAKE_TIMESTAMPTZ(2024, 6, 15, 10, 30, 45.5, 'America/New_York') AS made_timestamptz;

-- Justify intervals
SELECT 
  JUSTIFY_DAYS(INTERVAL '35 days') AS justified_days,
  JUSTIFY_HOURS(INTERVAL '25 hours') AS justified_hours,
  JUSTIFY_INTERVAL(INTERVAL '1 month 35 days 25 hours') AS justified;

-- Is finite (for timestamps)
SELECT 
  'infinity'::timestamp AS infinite_future,
  '-infinity'::timestamp AS infinite_past,
  ISFINITE('infinity'::timestamp) AS is_finite;

-- Practical examples
CREATE TABLE logs (
  id SERIAL PRIMARY KEY,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group by date (truncated)
SELECT 
  DATE_TRUNC('day', created_at) AS log_date,
  COUNT(*) AS log_count
FROM logs
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY log_date DESC;

-- Find records from last N days
SELECT * FROM logs 
WHERE created_at > NOW() - INTERVAL '7 days';

-- Find records from current month
SELECT * FROM logs 
WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW());`}
          />
          <CodeBlock
            title="Prisma: Date/Time Functions"
            language="javascript"
            code={`// Use raw SQL for date/time functions

// schema.prisma
model Log {
  id        Int      @id @default(autoincrement())
  message   String   @db.Text
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  
  @@map("logs")
}

// Date truncation
const dailyLogs = await prisma.$queryRaw\`
  SELECT 
    DATE_TRUNC('day', created_at) AS log_date,
    COUNT(*) AS log_count
  FROM logs
  GROUP BY DATE_TRUNC('day', created_at)
  ORDER BY log_date DESC
\`;

// Extract date parts
const logsWithParts = await prisma.$queryRaw\`
  SELECT 
    id,
    message,
    DATE_PART('year', created_at) AS year,
    DATE_PART('month', created_at) AS month,
    DATE_PART('day', created_at) AS day
  FROM logs
\`;

// Age calculation
const ages = await prisma.$queryRaw\`
  SELECT 
    id,
    message,
    AGE(NOW(), created_at) AS age
  FROM logs
\`;

// Filter by date ranges
const recentLogs = await prisma.log.findMany({
  where: {
    createdAt: {
      gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),  // Last 7 days
    },
  },
});

// Current month logs using raw SQL
const currentMonthLogs = await prisma.$queryRaw\`
  SELECT * FROM logs
  WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())
\`;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Use TIMESTAMPTZ</strong> for most timestamp storage (handles timezones automatically)</li>
              <li><strong>Store in UTC</strong> - PostgreSQL does this automatically with TIMESTAMPTZ</li>
              <li><strong>Use DATE</strong> when you only need the date portion</li>
              <li><strong>Avoid TIME</strong> without timezone unless you're sure it's appropriate</li>
              <li><strong>Use INTERVAL</strong> for durations and date arithmetic</li>
              <li><strong>Index timestamp columns</strong> that are frequently queried</li>
              <li><strong>Use DATE_TRUNC</strong> for grouping by time periods</li>
            </ul>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}


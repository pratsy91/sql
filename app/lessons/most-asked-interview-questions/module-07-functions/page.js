import ModuleLessonIndex from '../../../components/ModuleLessonIndex';

export const metadata = {
  title: 'Module 7: Functions and Operators - Most Asked Interview Questions',
  description:
    'Most asked PostgreSQL function and operator interview questions, split into lessons: string, numeric and conditional, date and time, aggregates, arrays and JSON, plus indexes and Prisma.',
};

export default function Module7FunctionsIndex() {
  return (
    <ModuleLessonIndex
      title="Module 7: Functions and Operators"
      intro="Work through each lesson to cover the built-in functions and operators interviewers ask about, from simple string helpers up to JSONB indexing, with Junior to Senior questions in every lesson."
      lessons={[
        {
          title: 'Lesson 1: String Functions',
          href: '/lessons/most-asked-interview-questions/module-07-functions/lesson-01-string-functions',
          blurb:
            'Joining and trimming text, UPPER and LOWER, LENGTH, REPLACE, SPLIT_PART, POSITION, SUBSTRING, LIKE vs ILIKE, and why CONCAT treats NULL differently from the double pipe operator.',
        },
        {
          title: 'Lesson 2: Numeric and Conditional Functions',
          href: '/lessons/most-asked-interview-questions/module-07-functions/lesson-02-numeric-and-conditional',
          blurb:
            'ROUND, CEIL, FLOOR, ABS, MOD, the integer division trap where 1 / 2 is 0, choosing between COALESCE, NULLIF and CASE, GREATEST and LEAST, safe casting, and rounding money correctly.',
        },
        {
          title: 'Lesson 3: Date and Time Functions',
          href: '/lessons/most-asked-interview-questions/module-07-functions/lesson-03-datetime-functions',
          blurb:
            'NOW and clock_timestamp, date_trunc for monthly grouping, adding days with intervals, the difference between two timestamps, EXTRACT vs TO_CHAR, and when to avoid AGE.',
        },
        {
          title: 'Lesson 4: Aggregate Functions',
          href: '/lessons/most-asked-interview-questions/module-07-functions/lesson-04-aggregate-functions',
          blurb:
            'How COUNT, SUM and AVG treat NULL, COUNT(*) vs COUNT(column), MIN and MAX, what an empty set returns, the FILTER clause, conditional aggregation with CASE, string_agg, array_agg, and DISTINCT ON.',
        },
        {
          title: 'Lesson 5: Array and JSON Functions',
          href: '/lessons/most-asked-interview-questions/module-07-functions/lesson-05-array-and-json-functions',
          blurb:
            'Array operators and unnest, the JSONB arrow and containment operators, checking whether a key exists, building documents with jsonb_build_object, updating one key with jsonb_set, and jsonb_path queries.',
        },
        {
          title: 'Lesson 6: Functions with Indexes and Prisma',
          href: '/lessons/most-asked-interview-questions/module-07-functions/lesson-06-functions-with-indexes-and-prisma',
          blurb:
            'Why a function on an indexed column blocks the index, expression and partial indexes, pg_trgm for ILIKE with a leading wildcard, GIN indexes for JSONB, Prisma aggregates, and when to use raw SQL.',
        },
      ]}
    />
  );
}

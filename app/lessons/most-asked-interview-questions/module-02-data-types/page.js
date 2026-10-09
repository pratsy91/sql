import ModuleLessonIndex from '../../../components/ModuleLessonIndex';

export const metadata = {
  title: 'Module 2: Data Types - Most Asked Interview Questions',
  description:
    'Lesson-by-lesson interview questions on PostgreSQL data types covering junior to senior — numeric, character, datetime, boolean, UUID, JSONB, arrays, ENUM, BYTEA, ranges, and other types',
};

export default function MaiqModule02DataTypesIndex() {
  return (
    <ModuleLessonIndex
      title="Module 2: Data Types"
      intro="Pick the right type for each column, and know the trade-off behind every choice. Questions are split by type — Numeric is Lesson 1, Character is Lesson 2, and so on."
      lessons={[
        {
          title: 'Lesson 1: Numeric Types',
          href: '/lessons/most-asked-interview-questions/module-02-data-types/lesson-01-numeric-types',
          blurb: 'INT vs BIGINT vs NUMERIC, why FLOAT is wrong for money, SMALLINT ranges, precision and scale, and integer overflow.',
        },
        {
          title: 'Lesson 2: Character Types',
          href: '/lessons/most-asked-interview-questions/module-02-data-types/lesson-02-character-types',
          blurb: 'VARCHAR vs TEXT vs CHAR, length limits, CHAR padding, case-insensitive email matching, and collation.',
        },
        {
          title: 'Lesson 3: Date and Time Types',
          href: '/lessons/most-asked-interview-questions/module-02-data-types/lesson-03-datetime-types',
          blurb: 'TIMESTAMP vs TIMESTAMPTZ, DATE, TIME, INTERVAL, storing UTC, the now() family, date_trunc, and AGE.',
        },
        {
          title: 'Lesson 4: Boolean Type',
          href: '/lessons/most-asked-interview-questions/module-02-data-types/lesson-04-boolean-type',
          blurb: 'True, false, and NULL, three-valued logic, IS TRUE vs equals, partial indexes, and NOT NULL flags.',
        },
        {
          title: 'Lesson 5: UUID Type',
          href: '/lessons/most-asked-interview-questions/module-02-data-types/lesson-05-uuid-type',
          blurb: 'Native UUID storage, gen_random_uuid, UUID v4 vs v7, UUID vs BIGINT keys, and index size cost.',
        },
        {
          title: 'Lesson 6: JSON Types',
          href: '/lessons/most-asked-interview-questions/module-02-data-types/lesson-05-json-types',
          blurb: 'JSON vs JSONB, reading fields with the arrow operators, GIN indexing, when not to use JSONB, and validating shape.',
        },
        {
          title: 'Lesson 7: Array Types',
          href: '/lessons/most-asked-interview-questions/module-02-data-types/lesson-07-array-types',
          blurb: 'Array columns, 1-based indexes, ANY and unnest, array vs junction table, and GIN indexes.',
        },
        {
          title: 'Lesson 8: ENUM Types',
          href: '/lessons/most-asked-interview-questions/module-02-data-types/lesson-08-enum-types',
          blurb: 'ENUM trade-offs, ALTER TYPE ADD VALUE, removing a value, and lookup tables vs TEXT CHECK.',
        },
        {
          title: 'Lesson 9: Binary Types',
          href: '/lessons/most-asked-interview-questions/module-02-data-types/lesson-09-binary-types',
          blurb: 'BYTEA, encode/decode, files in the database vs object storage, TOAST, and Prisma Bytes.',
        },
        {
          title: 'Lesson 10: Range, Domain and Custom Types',
          href: '/lessons/most-asked-interview-questions/module-02-data-types/lesson-10-range-domain-custom-types',
          blurb: 'DOMAIN, composite and range types, exclusion constraints, GENERATED columns, and Prisma type mapping.',
        },
        {
          title: 'Lesson 11: Other Types (Network, Geometric, XML, Text Search)',
          href: '/lessons/most-asked-interview-questions/module-02-data-types/lesson-11-other-types',
          blurb: 'INET vs CIDR, built-in geometry vs PostGIS, XML vs JSON, tsvector, and when to skip these types.',
        },
      ]}
    />
  );
}

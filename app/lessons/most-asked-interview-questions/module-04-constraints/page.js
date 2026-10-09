import ModuleLessonIndex from '../../../components/ModuleLessonIndex';

export const metadata = {
  title: 'Module 4: Constraints - Most Asked Interview Questions',
  description:
    'Most asked interview questions on PostgreSQL constraints, split into lessons: primary keys and UNIQUE, foreign keys and cascades, CHECK and EXCLUDE and deferrable, and constraints in production.',
};

export default function Module4ConstraintsIndex() {
  return (
    <ModuleLessonIndex
      title="Module 4: Constraints"
      intro="Constraints are the rules the database enforces for you, so bad data cannot get in no matter which app or script is writing."
      lessons={[
        {
          title: 'Lesson 1: Primary Key, UNIQUE, and NOT NULL',
          href: '/lessons/most-asked-interview-questions/module-04-constraints/lesson-01-primary-key-unique-not-null',
          blurb:
            'PRIMARY KEY vs UNIQUE, NOT NULL vs DEFAULT, why every table needs a key, composite keys, natural vs surrogate keys, and constraint vs index.',
        },
        {
          title: 'Lesson 2: Foreign Keys and Cascades',
          href: '/lessons/most-asked-interview-questions/module-04-constraints/lesson-02-foreign-keys-and-cascades',
          blurb:
            'What a foreign key guarantees, orphan rows, ON DELETE CASCADE vs SET NULL vs RESTRICT, ON UPDATE CASCADE, NO ACTION vs RESTRICT, indexing FK columns, and Prisma onDelete.',
        },
        {
          title: 'Lesson 3: CHECK, EXCLUDE, and Deferrable Constraints',
          href: '/lessons/most-asked-interview-questions/module-04-constraints/lesson-03-check-exclude-deferrable',
          blurb:
            'CHECK constraints and their NULL rule, CHECK vs trigger vs app validation, NOT VALID then VALIDATE, deferrable constraints, and EXCLUDE for overlapping bookings.',
        },
        {
          title: 'Lesson 4: Constraints in Production',
          href: '/lessons/most-asked-interview-questions/module-04-constraints/lesson-04-constraints-in-production',
          blurb:
            'Adding constraints to huge live tables, partial unique indexes for soft deletes, case-insensitive unique emails, unique violation error codes, and advanced uniqueness in Prisma.',
        },
      ]}
    />
  );
}

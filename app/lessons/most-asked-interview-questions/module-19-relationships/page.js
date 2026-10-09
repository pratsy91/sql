import ModuleLessonIndex from '../../../components/ModuleLessonIndex';

export const metadata = {
  title: 'Module 19: Database Relationships and Schema Design - Most Asked Interview Questions',
  description:
    'Most asked interview questions on database relationships and schema design, split into lessons: normalization, relationship types, foreign keys and cascades, hierarchies, and advanced modeling patterns.',
};

export default function Module19RelationshipsIndex() {
  return (
    <ModuleLessonIndex
      title="Module 19: Database Relationships and Schema Design"
      intro="These lessons explain in plain language how tables link to each other: why you split data up, the three relationship shapes, what happens to children when a parent is deleted, how to store a tree, and the patterns every real system ends up needing."
      lessons={[
        {
          title: 'Lesson 1: Normalization',
          href: '/lessons/most-asked-interview-questions/module-19-relationships/lesson-01-normalization',
          blurb:
            'The duplicated-address problem and the three anomalies it causes, 1NF to BCNF in plain words, functional dependencies, a table that breaks 2NF and its fix, whether 3NF is always the goal, and when to denormalize on purpose.',
        },
        {
          title: 'Lesson 2: Relationship Types',
          href: '/lessons/most-asked-interview-questions/module-19-relationships/lesson-02-relationship-types',
          blurb:
            'One-to-one, one-to-many and many-to-many in SQL and Prisma, junction tables, which side holds the foreign key, cardinality versus optionality, when a one-to-one should just be one table, extra columns on a junction table, and reading an ERD first.',
        },
        {
          title: 'Lesson 3: Foreign Keys and Cascades',
          href: '/lessons/most-asked-interview-questions/module-19-relationships/lesson-03-foreign-keys-and-cascades',
          blurb:
            'What a foreign key enforces, why you must index the child column yourself, CASCADE versus SET NULL versus RESTRICT versus NO ACTION, deleting a parent with children in one transaction, database versus application integrity, multi-tenant cascade choices, and the actions that fight soft deletes.',
        },
        {
          title: 'Lesson 4: Hierarchies',
          href: '/lessons/most-asked-interview-questions/module-19-relationships/lesson-04-hierarchies',
          blurb:
            'Self-referencing manager and employee tables, writing a recursive CTE in both directions, limiting depth properly, materialized paths, adjacency list versus closure table versus ltree, preventing cycles, and comment threads built for high read volume.',
        },
        {
          title: 'Lesson 5: Advanced Modeling',
          href: '/lessons/most-asked-interview-questions/module-19-relationships/lesson-05-advanced-modeling',
          blurb:
            'Soft deletes and what they break, polymorphic association pitfalls and exclusive arcs, status history and audit tables, soft delete versus an archive table, multi-tenant design with a tenant id, composite foreign keys for tenant isolation, and implicit versus explicit many-to-many in Prisma.',
        },
      ]}
    />
  );
}

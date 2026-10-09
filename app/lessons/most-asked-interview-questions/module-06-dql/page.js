import ModuleLessonIndex from '../../../components/ModuleLessonIndex';

export const metadata = {
  title: 'Module 6: DQL / SELECT - Most Asked Interview Questions',
  description:
    'Most asked PostgreSQL DQL interview questions, split into lessons: SELECT basics, joins, GROUP BY, subqueries and CTEs, set operations and CASE, window functions, and pagination with Prisma.',
};

export default function Module6DQLIndex() {
  return (
    <ModuleLessonIndex
      title="Module 6: DQL / SELECT"
      intro="Reading data is the most asked topic in SQL interviews, so this module is split into seven focused lessons from plain SELECT up to window functions."
      lessons={[
        {
          title: 'Lesson 1: SELECT Basics',
          href: '/lessons/most-asked-interview-questions/module-06-dql/lesson-01-select-basics',
          blurb:
            'What SELECT does, DISTINCT, aliases, ORDER BY with LIMIT and OFFSET, filtering NULL, COALESCE, LIKE vs ILIKE, BETWEEN and IN, and why SELECT * is discouraged.',
        },
        {
          title: 'Lesson 2: Joins',
          href: '/lessons/most-asked-interview-questions/module-06-dql/lesson-02-joins',
          blurb:
            'INNER vs LEFT, RIGHT and FULL OUTER and CROSS and self joins, joining on several columns, why joins duplicate rows and how to fix it, ON vs USING, and anti-joins.',
        },
        {
          title: 'Lesson 3: GROUP BY and Aggregates',
          href: '/lessons/most-asked-interview-questions/module-06-dql/lesson-03-group-by-and-aggregates',
          blurb:
            'WHERE vs HAVING, COUNT(*) vs COUNT(column) vs COUNT(DISTINCT), grouping by several columns, ordering by an aggregate, finding duplicates, and NULL in aggregates.',
        },
        {
          title: 'Lesson 4: Subqueries and CTEs',
          href: '/lessons/most-asked-interview-questions/module-06-dql/lesson-04-subqueries-and-ctes',
          blurb:
            'Subquery vs JOIN, EXISTS vs IN and the NOT IN NULL trap, correlated subqueries and their cost, scalar subqueries, derived tables, WITH, and recursive CTEs for a manager tree.',
        },
        {
          title: 'Lesson 5: Set Operations and CASE',
          href: '/lessons/most-asked-interview-questions/module-06-dql/lesson-05-set-operations-and-case',
          blurb:
            'UNION vs UNION ALL, INTERSECT and EXCEPT, the column count and type rules, CASE expressions, custom sort order, and CASE inside SUM for conditional counts.',
        },
        {
          title: 'Lesson 6: Window Functions',
          href: '/lessons/most-asked-interview-questions/module-06-dql/lesson-06-window-functions',
          blurb:
            'ROW_NUMBER vs RANK vs DENSE_RANK, PARTITION BY, second highest salary, top N per group, running totals and frames, and why you cannot filter a window function in WHERE.',
        },
        {
          title: 'Lesson 7: Pagination and Prisma',
          href: '/lessons/most-asked-interview-questions/module-06-dql/lesson-07-pagination-and-prisma',
          blurb:
            'Why deep OFFSET is slow, stable sort order, keyset (cursor) pagination, Prisma cursor pagination, how findMany maps to SQL, and the logical processing order of a SELECT.',
        },
      ]}
    />
  );
}

import ModuleLessonIndex from '../../../components/ModuleLessonIndex';

export const metadata = {
  title: 'Module 8: PL/pgSQL - Most Asked Interview Questions',
  description:
    'Most asked PL/pgSQL interview questions, split into lessons: functions and procedures, control flow and errors, triggers, and security and application boundaries.',
};

export default function Module8PlpgsqlIndex() {
  return (
    <ModuleLessonIndex
      title="Module 8: PL/pgSQL"
      intro="PL/pgSQL is PostgreSQL's own programming language for code that lives inside the database. Each lesson covers one part of it, with Junior to Senior questions and working SQL you can run."
      lessons={[
        {
          title: 'Lesson 1: Functions and Procedures',
          href: '/lessons/most-asked-interview-questions/module-08-plpgsql/lesson-01-functions-and-procedures',
          blurb:
            'What PL/pgSQL is, CREATE OR REPLACE FUNCTION, dollar quoting, FUNCTION vs PROCEDURE, calling a function, RETURNS and OUT parameters, LANGUAGE sql vs plpgsql, and IMMUTABLE vs STABLE vs VOLATILE.',
        },
        {
          title: 'Lesson 2: Control Flow and Errors',
          href: '/lessons/most-asked-interview-questions/module-08-plpgsql/lesson-02-control-flow-and-errors',
          blurb:
            'IF, ELSIF and ELSE, looping over query results with FOR, EXCEPTION blocks and their hidden savepoint, RAISE for errors and notices, the SQLSTATE codes worth knowing, and why swallowing WHEN OTHERS is dangerous.',
        },
        {
          title: 'Lesson 3: Triggers',
          href: '/lessons/most-asked-interview-questions/module-08-plpgsql/lesson-03-triggers',
          blurb:
            'BEFORE vs AFTER with NEW and OLD, FOR EACH ROW vs FOR EACH STATEMENT, writing an updated_at trigger and an audit log trigger, what returning NULL from a BEFORE trigger does, firing order, and transition tables.',
        },
        {
          title: 'Lesson 4: Security and Application Boundaries',
          href: '/lessons/most-asked-interview-questions/module-08-plpgsql/lesson-04-security-and-app-boundaries',
          blurb:
            'SECURITY DEFINER and the search_path attack, dynamic SQL risks, safe dynamic SQL with format %I and %L, efficient set-returning functions, database logic vs application logic, and how triggers interact with Prisma.',
        },
      ]}
    />
  );
}

import ModuleLessonIndex from '../../../components/ModuleLessonIndex';

export const metadata = {
  title: "Module 9: Transactions and Concurrency - Production Scenarios",
  description: "Production incidents from deadlocks, lost updates, idle transactions, and bloat, with fixes",
};

export default function ScenarioM09Index() {
  return (
    <ModuleLessonIndex
      title="Module 9: Transactions and Concurrency"
      intro="Phase 9 incidents: two correct transactions together produce an error or bad data."
      lessons={[
        {
          title: "Lesson 1: Deadlocks and Lost Updates",
          href: "/lessons/most-asked-scenario-interview-questions/module-09-transactions/lesson-01-deadlocks-and-lost-updates",
          blurb: "Deadlock detected, serialization failures, and balances that lose a write.",
        },
        {
          title: "Lesson 2: Idle Transactions and Bloat",
          href: "/lessons/most-asked-scenario-interview-questions/module-09-transactions/lesson-02-idle-transactions-and-bloat",
          blurb: "A forgotten BEGIN that blocks vacuum, and tables that keep growing after deletes.",
        }
      ]}
    />
  );
}

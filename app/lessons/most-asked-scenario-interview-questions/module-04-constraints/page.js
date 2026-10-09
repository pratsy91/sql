import ModuleLessonIndex from '../../../components/ModuleLessonIndex';

export const metadata = {
  title: "Module 4: Constraints - Production Scenarios",
  description: "Production incidents from foreign keys, unique violations, NOT NULL, and CHECK failures, with fixes",
};

export default function ScenarioM04Index() {
  return (
    <ModuleLessonIndex
      title="Module 4: Constraints"
      intro="Phase 4 incidents: the write is rejected, or a cascade deleted more than anyone expected."
      lessons={[
        {
          title: "Lesson 1: Foreign Key and Unique Violations",
          href: "/lessons/most-asked-scenario-interview-questions/module-04-constraints/lesson-01-fk-and-unique-violations",
          blurb: "Deletes that fail, signups that race, and cascades that wipe child rows.",
        },
        {
          title: "Lesson 2: NOT NULL, CHECK, and Bad Data",
          href: "/lessons/most-asked-scenario-interview-questions/module-04-constraints/lesson-02-not-null-check-bad-data",
          blurb: "Backfills that fail, bad statuses, and flags that silently skip rows.",
        }
      ]}
    />
  );
}

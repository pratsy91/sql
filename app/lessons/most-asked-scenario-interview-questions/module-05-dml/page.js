import ModuleLessonIndex from '../../../components/ModuleLessonIndex';

export const metadata = {
  title: "Module 5: DML - Production Scenarios",
  description: "Production incidents from accidental updates, upserts that no-op, and bulk loads, with fixes",
};

export default function ScenarioM05Index() {
  return (
    <ModuleLessonIndex
      title="Module 5: DML"
      intro="Phase 5 incidents: a write ran, and it changed the wrong rows or none of the rows you expected."
      lessons={[
        {
          title: "Lesson 1: Accidental Writes",
          href: "/lessons/most-asked-scenario-interview-questions/module-05-dml/lesson-01-accidental-writes",
          blurb: "UPDATE or DELETE without the right filter, and how to get the data back.",
        },
        {
          title: "Lesson 2: Upsert and Bulk Load Failures",
          href: "/lessons/most-asked-scenario-interview-questions/module-05-dml/lesson-02-upsert-and-bulk-load",
          blurb: "ON CONFLICT that skips real updates, and COPY jobs that roll back the whole file.",
        }
      ]}
    />
  );
}

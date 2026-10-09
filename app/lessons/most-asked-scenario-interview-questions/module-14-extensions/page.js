import ModuleLessonIndex from '../../../components/ModuleLessonIndex';

export const metadata = {
  title: "Module 14: Extensions - Production Scenarios",
  description: "Production incidents from missing extensions, wrong schemas, trigram search, and vector indexes",
};

export default function ScenarioM14Index() {
  return (
    <ModuleLessonIndex
      title="Module 14: Extensions"
      intro="Phase 14 incidents: a function or index works in one database and not the one you just restored or migrated."
      lessons={[
        {
          title: "Lesson 1: Missing Extensions",
          href: "/lessons/most-asked-scenario-interview-questions/module-14-extensions/lesson-01-missing-extensions",
          blurb: "gen_random_uuid, citext, or postgis missing after a migrate or a restore.",
        },
        {
          title: "Lesson 2: Search and Vector Incidents",
          href: "/lessons/most-asked-scenario-interview-questions/module-14-extensions/lesson-02-search-and-vector-incidents",
          blurb: "ILIKE that scans the table, and a vector index that the planner ignores.",
        }
      ]}
    />
  );
}

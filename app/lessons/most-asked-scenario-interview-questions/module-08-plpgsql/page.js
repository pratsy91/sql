import ModuleLessonIndex from '../../../components/ModuleLessonIndex';

export const metadata = {
  title: "Module 8: PL/pgSQL - Production Scenarios",
  description: "Production incidents from triggers, swallowed exceptions, and SECURITY DEFINER functions, with fixes",
};

export default function ScenarioM08Index() {
  return (
    <ModuleLessonIndex
      title="Module 8: PL/pgSQL"
      intro="Phase 8 incidents: a trigger or function changes a write in a way the app never logged."
      lessons={[
        {
          title: "Lesson 1: Trigger Incidents",
          href: "/lessons/most-asked-scenario-interview-questions/module-08-plpgsql/lesson-01-trigger-incidents",
          blurb: "Inserts that fail deep in a trigger, and triggers that loop.",
        },
        {
          title: "Lesson 2: Hidden Errors and Unsafe Functions",
          href: "/lessons/most-asked-scenario-interview-questions/module-08-plpgsql/lesson-02-hidden-errors-and-unsafe-functions",
          blurb: "WHEN OTHERS that hides failures, and SECURITY DEFINER functions that leak data.",
        }
      ]}
    />
  );
}

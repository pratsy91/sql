import ModuleLessonIndex from '../../../components/ModuleLessonIndex';

export const metadata = {
  title: "Module 6: DQL / SELECT - Production Scenarios",
  description: "Production incidents where queries return the wrong rows, duplicate counts, or skip pages, with fixes",
};

export default function ScenarioM06Index() {
  return (
    <ModuleLessonIndex
      title="Module 6: DQL / SELECT"
      intro="Phase 6 incidents: the query succeeds and the answer is still wrong."
      lessons={[
        {
          title: "Lesson 1: Wrong Results",
          href: "/lessons/most-asked-scenario-interview-questions/module-06-dql/lesson-01-wrong-results",
          blurb: "Missing orders, duplicated totals, and joins that multiply rows.",
        },
        {
          title: "Lesson 2: Pagination and Missing Rows",
          href: "/lessons/most-asked-scenario-interview-questions/module-06-dql/lesson-02-pagination-and-missing-rows",
          blurb: "Pages that skip or repeat rows, and filters that drop NULLs.",
        }
      ]}
    />
  );
}

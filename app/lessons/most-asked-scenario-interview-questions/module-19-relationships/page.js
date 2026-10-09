import ModuleLessonIndex from '../../../components/ModuleLessonIndex';

export const metadata = {
  title: "Module 19: Relationships and Schema Design - Production Scenarios",
  description: "Production incidents from cascades, orphan rows, duplicate junction rows, and hierarchy cycles",
};

export default function ScenarioM19Index() {
  return (
    <ModuleLessonIndex
      title="Module 19: Relationships and Schema Design"
      intro="Phase 19 incidents: the relationship rules deleted too much, or they were never enforced."
      lessons={[
        {
          title: "Lesson 1: Cascade Deletes and Orphans",
          href: "/lessons/most-asked-scenario-interview-questions/module-19-relationships/lesson-01-cascade-and-orphans",
          blurb: "A parent delete that wiped children, and children that point at nothing.",
        },
        {
          title: "Lesson 2: Junction Tables and Hierarchies",
          href: "/lessons/most-asked-scenario-interview-questions/module-19-relationships/lesson-02-junctions-and-hierarchies",
          blurb: "Duplicate tags, a cycle in a tree, and an include that loads the whole graph.",
        }
      ]}
    />
  );
}

import ModuleLessonIndex from '../../../components/ModuleLessonIndex';

export const metadata = {
  title: "Module 11: Security - Production Scenarios",
  description: "Production incidents from SQL injection, leaked secrets, over-broad grants, and RLS gaps, with fixes",
};

export default function ScenarioM11Index() {
  return (
    <ModuleLessonIndex
      title="Module 11: Security"
      intro="Phase 11 incidents: someone can read or change data they should not."
      lessons={[
        {
          title: "Lesson 1: SQL Injection Incidents",
          href: "/lessons/most-asked-scenario-interview-questions/module-11-security/lesson-01-sql-injection-incidents",
          blurb: "A search box or a raw query that changed more than it should.",
        },
        {
          title: "Lesson 2: Over-Privileged Roles and RLS Gaps",
          href: "/lessons/most-asked-scenario-interview-questions/module-11-security/lesson-02-privileges-and-rls",
          blurb: "The app can drop tables, or RLS is on and the owner still sees every row.",
        }
      ]}
    />
  );
}

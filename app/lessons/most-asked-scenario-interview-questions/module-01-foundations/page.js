import ModuleLessonIndex from '../../../components/ModuleLessonIndex';

export const metadata = {
  title: "Module 1: Foundations and Setup - Production Scenarios",
  description: "Production incidents for connections, authentication, pooling, and search_path, with how to confirm and fix each one",
};

export default function ScenarioM01Index() {
  return (
    <ModuleLessonIndex
      title="Module 1: Foundations and Setup"
      intro="Phase 1 incidents: the database is up, but the app cannot connect, log in, or see the right tables."
      lessons={[
        {
          title: "Lesson 1: Connection Failures",
          href: "/lessons/most-asked-scenario-interview-questions/module-01-foundations/lesson-01-connection-failures",
          blurb: "Connection refused, wrong host, database does not exist, and the server is not accepting connections.",
        },
        {
          title: "Lesson 2: Auth, Pool, and search_path",
          href: "/lessons/most-asked-scenario-interview-questions/module-01-foundations/lesson-02-auth-pool-search-path",
          blurb: "Password failures, SSL required, too many connections, and queries that cannot see a table that exists.",
        }
      ]}
    />
  );
}

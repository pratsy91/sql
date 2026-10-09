import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: "Lesson 1: Connection Failures - Production Scenarios",
  description: "Most asked production scenarios when PostgreSQL connections fail, and how to fix them",
};

export default function ScenarioM01L01() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 1: Connection Failures</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          These are the first incidents on call: the app cannot open a connection at all.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>
          <InterviewQACard level="Junior" question="The app logs &quot;connection refused&quot; on port 5432. What do you check, and how do you fix it?">
            <p><strong>What you see:</strong> Requests fail immediately. No query runs. The error is connection refused, not a password error.</p>
            <p><strong>Why it happens:</strong> Nothing is listening on that host and port. Postgres is stopped, you are on the wrong host, a firewall drops the port, or Docker published a different port.</p>
            <p><strong>How to confirm:</strong> From the app host, try a TCP connect to host:5432. On the database host, check that postgres is running and listen_addresses is not only localhost if the app is remote.</p>
            <p><strong>How to fix:</strong> Start Postgres. Point the app at the real host and port. Open the firewall or security group for the app subnet only. Do not open 5432 to the whole internet.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SHOW listen_addresses;
SHOW port;
SELECT inet_server_addr(), inet_server_port();`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="The error is &quot;database does not exist&quot; or &quot;role does not exist&quot;. How do you fix it?">
            <p><strong>What you see:</strong> The TCP connection works, then Postgres rejects the login because the database name or the user name is wrong.</p>
            <p><strong>Why it happens:</strong> The URL points at a database that was never created, a typo in the name, or a role that exists only on another environment.</p>
            <p><strong>How to confirm:</strong> Connect as a known admin and list databases and roles. Compare them to the app URL. Check the Prisma schema datasource url as well.</p>
            <p><strong>How to fix:</strong> Create the missing database or role, or correct the URL. Do not change the app to use the postgres superuser just to make the error go away.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SELECT datname FROM pg_database ORDER BY 1;
SELECT rolname FROM pg_roles ORDER BY 1;

CREATE ROLE app_user LOGIN PASSWORD 'replace-me';
CREATE DATABASE app OWNER app_user;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>
          <InterviewQACard level="Mid" question="Locally it works. In production you get &quot;no pg_hba.conf entry&quot;. How do you fix it?">
            <p><strong>What you see:</strong> The server is reachable, but the log says there is no pg_hba.conf entry for that host, user, and database.</p>
            <p><strong>Why it happens:</strong> Postgres accepted the TCP connection, then the host-based auth file refused that client. A new app subnet, a new user, or SSL vs non-SSL is the usual cause.</p>
            <p><strong>How to confirm:</strong> Read the exact line in the Postgres log. It names the user, database, client address, and whether SSL was used.</p>
            <p><strong>How to fix:</strong> Add a specific pg_hba line for that user, database, and CIDR. Prefer scram-sha-256 and hostssl. Reload the config. Do not add a trust line for 0.0.0.0/0.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SELECT * FROM pg_hba_file_rules ORDER BY line_number;

-- After editing pg_hba.conf
SELECT pg_reload_conf();`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Prisma says it cannot reach the database only inside Docker or Kubernetes. What is wrong?">
            <p><strong>What you see:</strong> The same URL works from your laptop and fails from the container. The hostname is localhost or a compose service that does not exist in that network.</p>
            <p><strong>Why it happens:</strong> localhost inside a container is the container itself, not the database container and not your laptop.</p>
            <p><strong>How to confirm:</strong> Print the resolved host from inside the app container. Check that both containers share a network and that the service name matches the URL.</p>
            <p><strong>How to fix:</strong> Use the service DNS name (db, postgres) or the RDS hostname. Map the port only if the client is outside Docker. Keep the password in a secret, not in the image.</p>
            <CodeBlock
              title="App-side fix"
              language="typescript"
              code={`// Wrong inside a container
// postgresql://app:pw@localhost:5432/app

// Right: the compose service name
// postgresql://app:pw@db:5432/app`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>
          <InterviewQACard level="Senior" question="After a failover, half the app servers still cannot connect. How do you debug it?">
            <p><strong>What you see:</strong> Some pods connect, some get connection refused or a timeout. The old primary IP is dead. A few servers were restarted and work.</p>
            <p><strong>Why it happens:</strong> Those servers cached the old DNS answer, or they use a hard-coded IP, or the pooler still points at the demoted primary.</p>
            <p><strong>How to confirm:</strong> Compare the IP each app resolves for the database hostname. Check PgBouncer or RDS proxy target. Check connection age in pg_stat_activity.</p>
            <p><strong>How to fix:</strong> Point DNS and the pooler at the new primary. Restart app processes that cached the old address. Set a short DNS TTL before the next failover. Prefer a stable pooler hostname so apps do not follow the primary IP.</p>
            <CodeBlock
              title="How to confirm and fix"
              language="sql"
              code={`SELECT client_addr, usename, state, backend_start
FROM pg_stat_activity
WHERE datname = current_database()
ORDER BY backend_start;`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}

import { createDatabase, createLocalDatabase } from "@tinacms/datalayer";
import { GitHubProvider } from "tinacms-gitprovider-github";
import { RedisLevel } from "upstash-redis-level";

const branch =
  process.env.GITHUB_BRANCH ||
  process.env.VERCEL_GIT_COMMIT_REF ||
  process.env.HEAD ||
  "main";

const isLocal = process.env.TINA_PUBLIC_IS_LOCAL === "true";

const requireEnv = (name: string) => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

const database = isLocal
  ? createLocalDatabase()
  : createDatabase({
      gitProvider: new GitHubProvider({
        branch,
        owner: requireEnv("GITHUB_OWNER"),
        repo: requireEnv("GITHUB_REPO"),
        token: requireEnv("GITHUB_TOKEN"),
        commitMessage: process.env.TINA_GITHUB_COMMIT_MESSAGE || "content: update homepage via Tina",
      }),
      databaseAdapter: new RedisLevel({
        namespace: `tina:${branch}`,
        redis: {
          url: requireEnv("UPSTASH_REDIS_REST_URL"),
          token: requireEnv("UPSTASH_REDIS_REST_TOKEN"),
        },
      }) as never,
      namespace: branch,
    });

export default database;

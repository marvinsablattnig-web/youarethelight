import { HomePage } from "@/components/home-page";
import databaseClient from "@/tina/__generated__/databaseClient";

export const dynamic = "force-dynamic";

export default async function Home() {
  const response = await databaseClient.queries.homepage({
    relativePath: "home.json",
  });
  const hydratedResponse = JSON.parse(JSON.stringify(response)) as typeof response;

  return (
    <HomePage
      data={hydratedResponse.data}
      query={hydratedResponse.query}
      variables={hydratedResponse.variables}
    />
  );
}

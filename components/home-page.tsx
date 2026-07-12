"use client";

import { useTina } from "tinacms/dist/react";

import { PortfolioSite } from "@/components/portfolio-site";
import { normalizeHomepageDocument } from "@/lib/home-content";
import type { HomepageQuery, HomepageQueryVariables } from "@/tina/__generated__/types";

type HomePageProps = {
  data: HomepageQuery;
  query: string;
  variables: HomepageQueryVariables;
};

export function HomePage({ data, query, variables }: HomePageProps) {
  const tina = useTina({
    query,
    variables,
    data,
  });

  return (
    <PortfolioSite
      tinaDocument={tina.data.homepage}
      content={normalizeHomepageDocument(tina.data.homepage)}
    />
  );
}

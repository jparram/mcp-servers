import { GraphQLClient } from "graphql-request";

const GITHUB_GRAPHQL_URL = "https://api.github.com/graphql";

export function createGitHubClient(): GraphQLClient {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("GITHUB_TOKEN environment variable is required");
  }

  return new GraphQLClient(GITHUB_GRAPHQL_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": "github-projects-mcp/1.0.0",
    },
  });
}

// Singleton — created lazily so missing token surfaces as a tool error, not startup crash
let _client: GraphQLClient | null = null;

export function getClient(): GraphQLClient {
  if (!_client) {
    _client = createGitHubClient();
  }
  return _client;
}

export type Maybe<T> = T | null | undefined;

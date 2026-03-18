import { z } from "zod";
import { getClient } from "../github-client.js";
import {
  LIST_USER_PROJECTS,
  LIST_ORG_PROJECTS,
  GET_PROJECT,
} from "../queries/index.js";

// ─── Schemas ──────────────────────────────────────────────────────────────────

export const listProjectsSchema = z.object({
  owner: z.string().describe("GitHub username or org login"),
  owner_type: z.enum(["user", "org"]).default("user").describe("Whether owner is a user or organization"),
  first: z.number().int().min(1).max(100).default(20).describe("Number of projects to return"),
  after: z.string().optional().describe("Pagination cursor"),
});

export const getProjectSchema = z.object({
  project_id: z.string().describe("The GraphQL node ID of the project (e.g. PVT_kwDO...)"),
});

// ─── Handlers ─────────────────────────────────────────────────────────────────

export async function listProjects(args: z.infer<typeof listProjectsSchema>) {
  const client = getClient();
  const { owner, owner_type, first, after } = args;

  if (owner_type === "org") {
    const data = await client.request<any>(LIST_ORG_PROJECTS, { org: owner, first, after: after ?? null });
    return data.organization?.projectsV2 ?? { nodes: [], pageInfo: { hasNextPage: false } };
  } else {
    const data = await client.request<any>(LIST_USER_PROJECTS, { login: owner, first, after: after ?? null });
    return data.user?.projectsV2 ?? { nodes: [], pageInfo: { hasNextPage: false } };
  }
}

export async function getProject(args: z.infer<typeof getProjectSchema>) {
  const client = getClient();
  const data = await client.request<any>(GET_PROJECT, { id: args.project_id });
  if (!data.node) throw new Error(`Project not found: ${args.project_id}`);
  return data.node;
}

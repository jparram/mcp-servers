import { z } from "zod";
import { getClient } from "../github-client.js";
import {
  LIST_ISSUES, CREATE_ISSUE, UPDATE_ISSUE,
  GET_REPO_ID, LIST_MILESTONES, CREATE_MILESTONE,
  GET_USER_ID, LIST_REPO_LABELS,
} from "../queries/index.js";

export const listIssuesSchema = z.object({
  owner: z.string().describe("Repository owner (user or org login)"),
  repo: z.string().describe("Repository name"),
  states: z.array(z.enum(["OPEN", "CLOSED"])).default(["OPEN"]),
  labels: z.array(z.string()).optional().describe("Filter by label names"),
  milestone: z.string().optional().describe("Filter by milestone title"),
  first: z.number().int().min(1).max(100).default(30),
  after: z.string().optional(),
});

export const createIssueSchema = z.object({
  owner: z.string(),
  repo: z.string(),
  title: z.string(),
  body: z.string().optional(),
  label_names: z.array(z.string()).optional().describe("Label names to apply (must already exist in repo)"),
  assignee_logins: z.array(z.string()).optional().describe("GitHub logins to assign"),
  milestone_id: z.string().optional().describe("GraphQL node ID of the milestone"),
  add_to_project_id: z.string().optional().describe("Also add the new issue to this project (node ID)"),
});

export const updateIssueSchema = z.object({
  issue_id: z.string().describe("GraphQL node ID of the issue"),
  title: z.string().optional(),
  body: z.string().optional(),
  state: z.enum(["OPEN", "CLOSED"]).optional(),
  milestone_id: z.string().optional().describe("GraphQL node ID of the milestone, or empty string to clear"),
  label_ids: z.array(z.string()).optional().describe("Replacement set of label node IDs"),
  assignee_ids: z.array(z.string()).optional().describe("Replacement set of assignee node IDs"),
});

export const listMilestonesSchema = z.object({
  owner: z.string(),
  repo: z.string(),
  states: z.array(z.enum(["OPEN", "CLOSED"])).default(["OPEN"]),
  first: z.number().int().min(1).max(100).default(20),
});

export const createMilestoneSchema = z.object({
  owner: z.string(),
  repo: z.string(),
  title: z.string(),
  description: z.string().optional(),
  due_on: z.string().optional().describe("ISO 8601 datetime, e.g. 2025-06-30T00:00:00Z"),
});

export const listLabelsSchema = z.object({
  owner: z.string(),
  repo: z.string(),
  first: z.number().int().min(1).max(100).default(50),
});

export const resolveUserSchema = z.object({
  login: z.string().describe("GitHub username to resolve to a node ID"),
});

async function getRepoId(owner: string, repo: string): Promise<string> {
  const client = getClient();
  const data = await client.request<any>(GET_REPO_ID, { owner, repo });
  if (!data.repository) throw new Error(`Repository not found: ${owner}/${repo}`);
  return data.repository.id;
}

async function getLabelIds(owner: string, repo: string, names: string[]): Promise<string[]> {
  const client = getClient();
  const data = await client.request<any>(LIST_REPO_LABELS, { owner, repo, first: 100 });
  const labels: { id: string; name: string }[] = data.repository?.labels?.nodes ?? [];
  return names.map((name) => {
    const found = labels.find((l) => l.name.toLowerCase() === name.toLowerCase());
    if (!found) throw new Error(`Label not found in ${owner}/${repo}: "${name}"`);
    return found.id;
  });
}

async function getAssigneeIds(logins: string[]): Promise<string[]> {
  const client = getClient();
  return Promise.all(
    logins.map(async (login) => {
      const data = await client.request<any>(GET_USER_ID, { login });
      if (!data.user) throw new Error(`User not found: ${login}`);
      return data.user.id;
    })
  );
}

export async function listIssues(args: z.infer<typeof listIssuesSchema>) {
  const client = getClient();
  const data = await client.request<any>(LIST_ISSUES, {
    owner: args.owner, repo: args.repo, first: args.first,
    after: args.after ?? null, states: args.states,
    labels: args.labels ?? null, milestone: args.milestone ?? null,
  });
  if (!data.repository) throw new Error(`Repository not found: ${args.owner}/${args.repo}`);
  return data.repository.issues;
}

export async function createIssue(
  args: z.infer<typeof createIssueSchema>,
  addToProject?: (issueId: string, projectId: string) => Promise<any>
) {
  const client = getClient();
  const repoId = await getRepoId(args.owner, args.repo);
  const labelIds = args.label_names?.length ? await getLabelIds(args.owner, args.repo, args.label_names) : undefined;
  const assigneeIds = args.assignee_logins?.length ? await getAssigneeIds(args.assignee_logins) : undefined;
  const data = await client.request<any>(CREATE_ISSUE, {
    repositoryId: repoId, title: args.title, body: args.body ?? null,
    labelIds: labelIds ?? null, assigneeIds: assigneeIds ?? null, milestoneId: args.milestone_id ?? null,
  });
  const issue = data.createIssue.issue;
  if (args.add_to_project_id && addToProject) await addToProject(issue.id, args.add_to_project_id);
  return issue;
}

export async function updateIssue(args: z.infer<typeof updateIssueSchema>) {
  const client = getClient();
  const data = await client.request<any>(UPDATE_ISSUE, {
    id: args.issue_id, title: args.title ?? null, body: args.body ?? null,
    state: args.state ?? null, milestoneId: args.milestone_id ?? null,
    labelIds: args.label_ids ?? null, assigneeIds: args.assignee_ids ?? null,
  });
  return data.updateIssue.issue;
}

export async function listMilestones(args: z.infer<typeof listMilestonesSchema>) {
  const client = getClient();
  const data = await client.request<any>(LIST_MILESTONES, {
    owner: args.owner, repo: args.repo, first: args.first, states: args.states,
  });
  if (!data.repository) throw new Error(`Repository not found: ${args.owner}/${args.repo}`);
  return data.repository.milestones.nodes;
}

export async function createMilestone(args: z.infer<typeof createMilestoneSchema>) {
  const client = getClient();
  const repoId = await getRepoId(args.owner, args.repo);
  const data = await client.request<any>(CREATE_MILESTONE, {
    repositoryId: repoId, title: args.title,
    description: args.description ?? null, dueOn: args.due_on ?? null,
  });
  return data.createMilestone.milestone;
}

export async function listRepoLabels(args: z.infer<typeof listLabelsSchema>) {
  const client = getClient();
  const data = await client.request<any>(LIST_REPO_LABELS, {
    owner: args.owner, repo: args.repo, first: args.first,
  });
  if (!data.repository) throw new Error(`Repository not found: ${args.owner}/${args.repo}`);
  return data.repository.labels.nodes;
}

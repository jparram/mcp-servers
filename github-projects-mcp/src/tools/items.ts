import { z } from "zod";
import { getClient } from "../github-client.js";
import {
  LIST_PROJECT_ITEMS,
  ADD_PROJECT_ITEM,
  ADD_DRAFT_ISSUE,
  UPDATE_ITEM_FIELD_TEXT,
  UPDATE_ITEM_FIELD_NUMBER,
  UPDATE_ITEM_FIELD_DATE,
  UPDATE_ITEM_FIELD_SELECT,
  UPDATE_ITEM_FIELD_ITERATION,
  ARCHIVE_PROJECT_ITEM,
  DELETE_PROJECT_ITEM,
} from "../queries/index.js";

// ─── Schemas ──────────────────────────────────────────────────────────────────

export const listItemsSchema = z.object({
  project_id: z.string().describe("GraphQL node ID of the project"),
  first: z.number().int().min(1).max(100).default(50),
  after: z.string().optional().describe("Pagination cursor"),
});

export const addItemSchema = z.object({
  project_id: z.string().describe("GraphQL node ID of the project"),
  content_id: z.string().describe("GraphQL node ID of the issue or PR to add"),
});

export const addDraftSchema = z.object({
  project_id: z.string().describe("GraphQL node ID of the project"),
  title: z.string().describe("Draft issue title"),
  body: z.string().optional().describe("Draft issue body (markdown)"),
});

export const updateFieldSchema = z.object({
  project_id: z.string().describe("GraphQL node ID of the project"),
  item_id: z.string().describe("GraphQL node ID of the project item"),
  field_id: z.string().describe("GraphQL node ID of the field to update"),
  field_type: z.enum(["text", "number", "date", "single_select", "iteration"])
    .describe("The data type of the field"),
  value: z.string().describe(
    "The new value. For single_select: the option ID. For iteration: the iteration ID. For date: ISO 8601 (YYYY-MM-DD). For number: numeric string."
  ),
});

export const archiveItemSchema = z.object({
  project_id: z.string().describe("GraphQL node ID of the project"),
  item_id: z.string().describe("GraphQL node ID of the project item"),
});

export const deleteItemSchema = z.object({
  project_id: z.string().describe("GraphQL node ID of the project"),
  item_id: z.string().describe("GraphQL node ID of the project item"),
});

// ─── Handlers ─────────────────────────────────────────────────────────────────

export async function listProjectItems(args: z.infer<typeof listItemsSchema>) {
  const client = getClient();
  const data = await client.request<any>(LIST_PROJECT_ITEMS, {
    id: args.project_id,
    first: args.first,
    after: args.after ?? null,
  });
  if (!data.node) throw new Error(`Project not found: ${args.project_id}`);
  return data.node.items;
}

export async function addProjectItem(args: z.infer<typeof addItemSchema>) {
  const client = getClient();
  const data = await client.request<any>(ADD_PROJECT_ITEM, {
    projectId: args.project_id,
    contentId: args.content_id,
  });
  return data.addProjectV2ItemById.item;
}

export async function addDraftIssue(args: z.infer<typeof addDraftSchema>) {
  const client = getClient();
  const data = await client.request<any>(ADD_DRAFT_ISSUE, {
    projectId: args.project_id,
    title: args.title,
    body: args.body ?? null,
  });
  return data.addProjectV2DraftIssue.projectItem;
}

export async function updateItemField(args: z.infer<typeof updateFieldSchema>) {
  const client = getClient();
  const base = {
    projectId: args.project_id,
    itemId: args.item_id,
    fieldId: args.field_id,
  };

  let data: any;
  switch (args.field_type) {
    case "text":
      data = await client.request(UPDATE_ITEM_FIELD_TEXT, { ...base, value: args.value });
      return (data as any).updateProjectV2ItemFieldValue.projectV2Item;
    case "number":
      data = await client.request(UPDATE_ITEM_FIELD_NUMBER, { ...base, value: parseFloat(args.value) });
      return (data as any).updateProjectV2ItemFieldValue.projectV2Item;
    case "date":
      data = await client.request(UPDATE_ITEM_FIELD_DATE, { ...base, value: args.value });
      return (data as any).updateProjectV2ItemFieldValue.projectV2Item;
    case "single_select":
      data = await client.request(UPDATE_ITEM_FIELD_SELECT, { ...base, optionId: args.value });
      return (data as any).updateProjectV2ItemFieldValue.projectV2Item;
    case "iteration":
      data = await client.request(UPDATE_ITEM_FIELD_ITERATION, { ...base, iterationId: args.value });
      return (data as any).updateProjectV2ItemFieldValue.projectV2Item;
    default:
      throw new Error(`Unknown field_type: ${args.field_type}`);
  }
}

export async function archiveProjectItem(args: z.infer<typeof archiveItemSchema>) {
  const client = getClient();
  const data = await client.request<any>(ARCHIVE_PROJECT_ITEM, {
    projectId: args.project_id,
    itemId: args.item_id,
  });
  return data.archiveProjectV2Item.item;
}

export async function deleteProjectItem(args: z.infer<typeof deleteItemSchema>) {
  const client = getClient();
  const data = await client.request<any>(DELETE_PROJECT_ITEM, {
    projectId: args.project_id,
    itemId: args.item_id,
  });
  return data.deleteProjectV2Item;
}

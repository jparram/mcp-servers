#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
import cors from "cors";

import {
  listProjects, getProject,
  listProjectsSchema, getProjectSchema,
} from "./tools/projects.js";
import {
  listProjectItems, addProjectItem, addDraftIssue,
  updateItemField, archiveProjectItem, deleteProjectItem,
  listItemsSchema, addItemSchema, addDraftSchema,
  updateFieldSchema, archiveItemSchema, deleteItemSchema,
} from "./tools/items.js";
import {
  listIssues, createIssue, updateIssue,
  listMilestones, createMilestone, listRepoLabels,
  listIssuesSchema, createIssueSchema, updateIssueSchema,
  listMilestonesSchema, createMilestoneSchema, listLabelsSchema,
} from "./tools/issues.js";

// ─── Server factory ───────────────────────────────────────────────────────────

function buildServer(): McpServer {
  const server = new McpServer({
    name: "github-projects-mcp",
    version: "1.0.0",
  });

  // ── Projects ────────────────────────────────────────────────────────────────

  server.tool(
    "list_projects",
    "List GitHub Projects v2 for a user or organization",
    listProjectsSchema.shape,
    async (args) => {
      const result = await listProjects(args);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "get_project",
    "Get full details of a GitHub Project v2 including all field definitions",
    getProjectSchema.shape,
    async (args) => {
      const result = await getProject(args);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  // ── Items ───────────────────────────────────────────────────────────────────

  server.tool(
    "list_project_items",
    "List all items in a GitHub Project v2 with their field values",
    listItemsSchema.shape,
    async (args) => {
      const result = await listProjectItems(args);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "add_project_item",
    "Add an existing issue or PR to a GitHub Project v2",
    addItemSchema.shape,
    async (args) => {
      const result = await addProjectItem(args);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "add_draft_issue",
    "Add a draft issue directly to a GitHub Project v2 (not linked to a repository)",
    addDraftSchema.shape,
    async (args) => {
      const result = await addDraftIssue(args);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "update_item_field",
    "Update a field value on a project item (status, priority, custom fields, iterations, etc.)",
    updateFieldSchema.shape,
    async (args) => {
      const result = await updateItemField(args);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "archive_project_item",
    "Archive an item in a GitHub Project v2",
    archiveItemSchema.shape,
    async (args) => {
      const result = await archiveProjectItem(args);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "delete_project_item",
    "Permanently delete an item from a GitHub Project v2",
    deleteItemSchema.shape,
    async (args) => {
      const result = await deleteProjectItem(args);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  // ── Issues ──────────────────────────────────────────────────────────────────

  server.tool(
    "list_issues",
    "List issues in a repository with optional filtering by state, labels, and milestone",
    listIssuesSchema.shape,
    async (args) => {
      const result = await listIssues(args);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "create_issue",
    "Create a new issue in a repository. Optionally add it to a project in the same call.",
    createIssueSchema.shape,
    async (args) => {
      const result = await createIssue(args, async (issueId, projectId) => {
        return addProjectItem({ project_id: projectId, content_id: issueId });
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "update_issue",
    "Update an existing issue — title, body, state (open/close), milestone, labels, assignees",
    updateIssueSchema.shape,
    async (args) => {
      const result = await updateIssue(args);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  // ── Milestones ──────────────────────────────────────────────────────────────

  server.tool(
    "list_milestones",
    "List milestones in a repository with progress stats",
    listMilestonesSchema.shape,
    async (args) => {
      const result = await listMilestones(args);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "create_milestone",
    "Create a new milestone in a repository",
    createMilestoneSchema.shape,
    async (args) => {
      const result = await createMilestone(args);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  // ── Labels ──────────────────────────────────────────────────────────────────

  server.tool(
    "list_repo_labels",
    "List all labels in a repository (useful for resolving label IDs before creating issues)",
    listLabelsSchema.shape,
    async (args) => {
      const result = await listRepoLabels(args);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  return server;
}

// ─── Transport selection ──────────────────────────────────────────────────────

const useHttp = process.argv.includes("--transport") &&
  process.argv[process.argv.indexOf("--transport") + 1] === "http";

const PORT = parseInt(process.env.PORT ?? "3000", 10);

if (useHttp) {
  // ── HTTP / SSE transport (hosted mode) ──────────────────────────────────────
  const app = express();
  app.use(cors());
  app.use(express.json());

  const transports = new Map<string, StreamableHTTPServerTransport>();

  app.post("/mcp", async (req, res) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    let transport: StreamableHTTPServerTransport;

    if (sessionId && transports.has(sessionId)) {
      transport = transports.get(sessionId)!;
    } else {
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => crypto.randomUUID(),
        onsessioninitialized: (id) => { transports.set(id, transport); },
      });
      transport.onclose = () => {
        if (transport.sessionId) transports.delete(transport.sessionId);
      };
      const server = buildServer();
      await server.connect(transport);
    }
    await transport.handleRequest(req, res, req.body);
  });

  app.get("/mcp", async (req, res) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    if (!sessionId || !transports.has(sessionId)) {
      res.status(400).json({ error: "Missing or unknown mcp-session-id" });
      return;
    }
    await transports.get(sessionId)!.handleRequest(req, res);
  });

  app.delete("/mcp", async (req, res) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    if (!sessionId || !transports.has(sessionId)) {
      res.status(400).json({ error: "Missing or unknown mcp-session-id" });
      return;
    }
    await transports.get(sessionId)!.handleRequest(req, res);
  });

  app.get("/health", (_req, res) => res.json({ status: "ok", transport: "http" }));

  app.listen(PORT, () => {
    console.error(`github-projects-mcp HTTP server listening on port ${PORT}`);
  });
} else {
  // ── stdio transport (Claude Desktop / Claude Code) ──────────────────────────
  const server = buildServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("github-projects-mcp stdio server started");
}

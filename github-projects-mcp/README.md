# github-projects-mcp

MCP server for **GitHub Projects v2** via GraphQL. Enables Claude to manage
projects, issues, milestones, and custom fields across personal and org-level
repositories.

## Why GraphQL?

GitHub Projects v2 is _only_ accessible via the GraphQL API — the REST API
only covers the legacy Projects v1. This server wraps the GraphQL endpoint
with a clean set of MCP tools.

---

## Tools

| Tool | Description |
|---|---|
| `list_projects` | List Projects v2 for a user or org |
| `get_project` | Get project details + all field definitions |
| `list_project_items` | List items with field values (status, priority, etc.) |
| `add_project_item` | Add an existing issue/PR to a project |
| `add_draft_issue` | Add a draft issue directly to a project |
| `update_item_field` | Update any field: text, number, date, status, iteration |
| `archive_project_item` | Archive a project item |
| `delete_project_item` | Permanently remove an item from a project |
| `list_issues` | List repo issues with state/label/milestone filters |
| `create_issue` | Create an issue, optionally add to a project |
| `update_issue` | Update title, body, state, milestone, labels, assignees |
| `list_milestones` | List milestones with progress stats |
| `create_milestone` | Create a milestone with optional due date |
| `list_repo_labels` | List labels (for resolving IDs before mutations) |

---

## Prerequisites

A GitHub PAT with the following scopes:
- `repo` — issues, milestones, labels
- `project` — Projects v2 read/write
- `read:org` — list org-level projects

Generate one at: https://github.com/settings/tokens

---

## Setup

```zsh
git clone https://github.com/jparram/mcp-servers
cd mcp-servers/github-projects-mcp
npm install && npm run build
cp .env.example .env  # set GITHUB_TOKEN
```

---

## Running

### stdio — Claude Desktop / Claude Code

```zsh
# Pull PAT from macOS Keychain
export GITHUB_TOKEN=$(security find-generic-password -s github-pat -w)
node dist/index.js
```

### HTTP — hosted / container

```zsh
node dist/index.js --transport http   # default port 3000
docker build -t github-projects-mcp .
docker run -e GITHUB_TOKEN=ghp_xxx -p 3000:3000 github-projects-mcp
```

---

## Claude Desktop config

`~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "github-projects": {
      "command": "/bin/zsh",
      "args": [
        "-c",
        "GITHUB_TOKEN=$(security find-generic-password -s github-pat -w) node /absolute/path/to/mcp-servers/github-projects-mcp/dist/index.js"
      ]
    }
  }
}
```

## Claude Code config

`~/.claude/mcp_servers.json`:

```json
{
  "github-projects": {
    "command": "node",
    "args": ["/absolute/path/to/mcp-servers/github-projects-mcp/dist/index.js"],
    "env": {
      "GITHUB_TOKEN": "ghp_your_token_here"
    }
  }
}
```

---

## PAT scope requirements

| Operation | Scope |
|---|---|
| Read projects | `read:project` |
| Write projects | `project` |
| Issues / milestones | `repo` |
| Org projects | `read:org` + `project` |

---

## Development

```zsh
npm run dev        # tsx watch mode
npm run typecheck  # type-check without emitting
npm run build      # compile to dist/
```

---

## Notes

- Project IDs look like `PVT_kwDO...` — get them via `list_projects`
- Item IDs look like `PVTI_lADO...` — get them via `list_project_items`
- Field IDs look like `PVTF_lADO...` — get them via `get_project`
- For `update_item_field` with `single_select`, use the option `id` (not `name`) from `get_project`
- `create_issue` with `add_to_project_id` does both operations atomically from Claude's perspective

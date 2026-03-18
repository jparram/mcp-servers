// ─── Projects ────────────────────────────────────────────────────────────────

export const LIST_USER_PROJECTS = `
  query ListUserProjects($login: String!, $first: Int!, $after: String) {
    user(login: $login) {
      projectsV2(first: $first, after: $after) {
        pageInfo { hasNextPage endCursor }
        nodes {
          id
          number
          title
          shortDescription
          url
          closed
          createdAt
          updatedAt
          owner {
            ... on User { login }
            ... on Organization { login }
          }
        }
      }
    }
  }
`;

export const LIST_ORG_PROJECTS = `
  query ListOrgProjects($org: String!, $first: Int!, $after: String) {
    organization(login: $org) {
      projectsV2(first: $first, after: $after) {
        pageInfo { hasNextPage endCursor }
        nodes {
          id
          number
          title
          shortDescription
          url
          closed
          createdAt
          updatedAt
          owner {
            ... on User { login }
            ... on Organization { login }
          }
        }
      }
    }
  }
`;

export const GET_PROJECT = `
  query GetProject($id: ID!) {
    node(id: $id) {
      ... on ProjectV2 {
        id
        number
        title
        shortDescription
        url
        closed
        createdAt
        updatedAt
        readme
        owner {
          ... on User { login }
          ... on Organization { login }
        }
        fields(first: 30) {
          nodes {
            ... on ProjectV2Field {
              id
              name
              dataType
            }
            ... on ProjectV2SingleSelectField {
              id
              name
              dataType
              options { id name color description }
            }
            ... on ProjectV2IterationField {
              id
              name
              dataType
              configuration {
                iterations { id title startDate duration }
                completedIterations { id title startDate duration }
              }
            }
          }
        }
      }
    }
  }
`;

// ─── Items ────────────────────────────────────────────────────────────────────

export const LIST_PROJECT_ITEMS = `
  query ListProjectItems($id: ID!, $first: Int!, $after: String) {
    node(id: $id) {
      ... on ProjectV2 {
        items(first: $first, after: $after) {
          pageInfo { hasNextPage endCursor }
          nodes {
            id
            createdAt
            updatedAt
            isArchived
            type
            content {
              ... on Issue {
                id
                number
                title
                state
                url
                body
                labels(first: 10) { nodes { name color } }
                assignees(first: 5) { nodes { login } }
                milestone { title dueOn }
                repository { nameWithOwner }
              }
              ... on PullRequest {
                id
                number
                title
                state
                url
                body
                repository { nameWithOwner }
              }
              ... on DraftIssue {
                id
                title
                body
              }
            }
            fieldValues(first: 20) {
              nodes {
                ... on ProjectV2ItemFieldTextValue {
                  text
                  field { ... on ProjectV2Field { id name } }
                }
                ... on ProjectV2ItemFieldNumberValue {
                  number
                  field { ... on ProjectV2Field { id name } }
                }
                ... on ProjectV2ItemFieldDateValue {
                  date
                  field { ... on ProjectV2Field { id name } }
                }
                ... on ProjectV2ItemFieldSingleSelectValue {
                  name
                  optionId
                  field { ... on ProjectV2SingleSelectField { id name } }
                }
                ... on ProjectV2ItemFieldIterationValue {
                  title
                  iterationId
                  startDate
                  duration
                  field { ... on ProjectV2IterationField { id name } }
                }
              }
            }
          }
        }
      }
    }
  }
`;

export const ADD_PROJECT_ITEM = `
  mutation AddProjectItem($projectId: ID!, $contentId: ID!) {
    addProjectV2ItemById(input: { projectId: $projectId, contentId: $contentId }) {
      item {
        id
        createdAt
        type
      }
    }
  }
`;

export const ADD_DRAFT_ISSUE = `
  mutation AddDraftIssue($projectId: ID!, $title: String!, $body: String) {
    addProjectV2DraftIssue(input: { projectId: $projectId, title: $title, body: $body }) {
      projectItem {
        id
        createdAt
        type
        content {
          ... on DraftIssue { id title body }
        }
      }
    }
  }
`;

export const UPDATE_ITEM_FIELD_TEXT = `
  mutation UpdateItemFieldText($projectId: ID!, $itemId: ID!, $fieldId: ID!, $value: String!) {
    updateProjectV2ItemFieldValue(input: {
      projectId: $projectId
      itemId: $itemId
      fieldId: $fieldId
      value: { text: $value }
    }) {
      projectV2Item { id updatedAt }
    }
  }
`;

export const UPDATE_ITEM_FIELD_NUMBER = `
  mutation UpdateItemFieldNumber($projectId: ID!, $itemId: ID!, $fieldId: ID!, $value: Float!) {
    updateProjectV2ItemFieldValue(input: {
      projectId: $projectId
      itemId: $itemId
      fieldId: $fieldId
      value: { number: $value }
    }) {
      projectV2Item { id updatedAt }
    }
  }
`;

export const UPDATE_ITEM_FIELD_DATE = `
  mutation UpdateItemFieldDate($projectId: ID!, $itemId: ID!, $fieldId: ID!, $value: Date!) {
    updateProjectV2ItemFieldValue(input: {
      projectId: $projectId
      itemId: $itemId
      fieldId: $fieldId
      value: { date: $value }
    }) {
      projectV2Item { id updatedAt }
    }
  }
`;

export const UPDATE_ITEM_FIELD_SELECT = `
  mutation UpdateItemFieldSelect($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
    updateProjectV2ItemFieldValue(input: {
      projectId: $projectId
      itemId: $itemId
      fieldId: $fieldId
      value: { singleSelectOptionId: $optionId }
    }) {
      projectV2Item { id updatedAt }
    }
  }
`;

export const UPDATE_ITEM_FIELD_ITERATION = `
  mutation UpdateItemFieldIteration($projectId: ID!, $itemId: ID!, $fieldId: ID!, $iterationId: String!) {
    updateProjectV2ItemFieldValue(input: {
      projectId: $projectId
      itemId: $itemId
      fieldId: $fieldId
      value: { iterationId: $iterationId }
    }) {
      projectV2Item { id updatedAt }
    }
  }
`;

export const ARCHIVE_PROJECT_ITEM = `
  mutation ArchiveProjectItem($projectId: ID!, $itemId: ID!) {
    archiveProjectV2Item(input: { projectId: $projectId, itemId: $itemId }) {
      item { id isArchived }
    }
  }
`;

export const DELETE_PROJECT_ITEM = `
  mutation DeleteProjectItem($projectId: ID!, $itemId: ID!) {
    deleteProjectV2Item(input: { projectId: $projectId, itemId: $itemId }) {
      deletedItemId
    }
  }
`;

// ─── Issues ───────────────────────────────────────────────────────────────────

export const LIST_ISSUES = `
  query ListIssues($owner: String!, $repo: String!, $first: Int!, $after: String, $states: [IssueState!], $labels: [String!], $milestone: String) {
    repository(owner: $owner, name: $repo) {
      issues(first: $first, after: $after, states: $states, labels: $labels, filterBy: { milestone: $milestone }) {
        pageInfo { hasNextPage endCursor }
        nodes {
          id
          number
          title
          state
          url
          body
          createdAt
          updatedAt
          closedAt
          labels(first: 10) { nodes { id name color } }
          assignees(first: 5) { nodes { login } }
          milestone { id title number dueOn state }
          projectItems(first: 5) {
            nodes {
              project { id title number }
            }
          }
        }
      }
    }
  }
`;

export const CREATE_ISSUE = `
  mutation CreateIssue($repositoryId: ID!, $title: String!, $body: String, $labelIds: [ID!], $assigneeIds: [ID!], $milestoneId: ID) {
    createIssue(input: {
      repositoryId: $repositoryId
      title: $title
      body: $body
      labelIds: $labelIds
      assigneeIds: $assigneeIds
      milestoneId: $milestoneId
    }) {
      issue {
        id
        number
        title
        url
        state
      }
    }
  }
`;

export const UPDATE_ISSUE = `
  mutation UpdateIssue($id: ID!, $title: String, $body: String, $state: IssueState, $milestoneId: ID, $labelIds: [ID!], $assigneeIds: [ID!]) {
    updateIssue(input: {
      id: $id
      title: $title
      body: $body
      state: $state
      milestoneId: $milestoneId
      labelIds: $labelIds
      assigneeIds: $assigneeIds
    }) {
      issue {
        id
        number
        title
        state
        url
        updatedAt
      }
    }
  }
`;

export const GET_REPO_ID = `
  query GetRepoId($owner: String!, $repo: String!) {
    repository(owner: $owner, name: $repo) {
      id
      nameWithOwner
    }
  }
`;

export const LIST_MILESTONES = `
  query ListMilestones($owner: String!, $repo: String!, $first: Int!, $states: [MilestoneState!]) {
    repository(owner: $owner, name: $repo) {
      milestones(first: $first, states: $states) {
        nodes {
          id
          number
          title
          description
          dueOn
          state
          progressPercentage
          issues(first: 0) { totalCount }
          closedIssues: issues(first: 0, states: [CLOSED]) { totalCount }
        }
      }
    }
  }
`;

export const CREATE_MILESTONE = `
  mutation CreateMilestone($repositoryId: ID!, $title: String!, $description: String, $dueOn: DateTime) {
    createMilestone(input: {
      repositoryId: $repositoryId
      title: $title
      description: $description
      dueOn: $dueOn
    }) {
      milestone {
        id
        number
        title
        dueOn
        state
      }
    }
  }
`;

export const GET_USER_ID = `
  query GetUserId($login: String!) {
    user(login: $login) {
      id
      login
    }
  }
`;

export const LIST_REPO_LABELS = `
  query ListRepoLabels($owner: String!, $repo: String!, $first: Int!) {
    repository(owner: $owner, name: $repo) {
      labels(first: $first) {
        nodes { id name color description }
      }
    }
  }
`;

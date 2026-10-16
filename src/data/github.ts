import savedSnapshot from './projects.snapshot.json' with { type: 'json' };
import { projects, type Project, type ProjectId } from './projects.ts';

export type ProjectBuild = {
  sha: string;
  date: string;
  subject: string;
  url: string;
};

export type ActivitySnapshot = {
  asOf: string;
  projects: Record<ProjectId, { commits: number; build: ProjectBuild | null }>;
};

export type EnrichedProject = Project & ActivitySnapshot['projects'][ProjectId];

export type ProjectActivity = {
  projects: EnrichedProject[];
  asOf: string;
  source: 'github' | 'snapshot';
};

const apiRoot = 'https://api.github.com';
const apiVersion = '2022-11-28';
const requestTimeoutMs = 20_000;
const snapshot = savedSnapshot as ActivitySnapshot;

class GitHubResponseError extends Error {}

function fromSnapshot(): ProjectActivity {
  return {
    projects: projects.map((project) => ({
      ...project,
      ...snapshot.projects[project.id],
    })),
    asOf: snapshot.asOf,
    source: 'snapshot',
  };
}

function nextPage(
  response: Response,
  currentUrl: URL,
  repo: string,
): URL | null {
  const links = response.headers.get('Link');
  const nextLink = links?.split(',').find((link) => /rel="next"/.test(link));

  if (!nextLink) {
    return null;
  }

  const match = nextLink.match(/<([^>]+)>/);

  if (!match) {
    throw new GitHubResponseError('Malformed GitHub pagination link');
  }

  const url = new URL(match[1]);
  const repositoryPath = `/repos/kellen-miller/${repo}/commits`;
  const canonicalRepositoryPath = /^\/repositories\/\d+\/commits$/;
  const sameListing = url.pathname === currentUrl.pathname;
  const canonicalFirstPage =
    currentUrl.pathname === repositoryPath &&
    canonicalRepositoryPath.test(url.pathname);

  if (url.origin !== apiRoot || (!sameListing && !canonicalFirstPage)) {
    throw new GitHubResponseError('Unexpected GitHub pagination endpoint');
  }

  return url;
}

async function fetchCommitPage(
  url: URL,
  repo: string,
  signal: AbortSignal,
): Promise<{
  commits: GitHubCommit[];
  next: URL | null;
}> {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': apiVersion,
      ...(process.env.GITHUB_TOKEN
        ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
        : {}),
    },
    signal,
  });

  if (!response.ok) {
    throw new GitHubResponseError(`GitHub returned HTTP ${response.status}`);
  }

  const body: unknown = await response.json();

  if (
    !Array.isArray(body) ||
    body.some(
      (commit) =>
        !commit ||
        typeof commit !== 'object' ||
        typeof commit.sha !== 'string' ||
        !/^[a-f0-9]{40}$/i.test(commit.sha) ||
        !Array.isArray(commit.parents) ||
        typeof commit.html_url !== 'string' ||
        !commit.commit ||
        typeof commit.commit !== 'object' ||
        typeof commit.commit.message !== 'string' ||
        !commit.commit.author ||
        typeof commit.commit.author !== 'object' ||
        typeof commit.commit.author.date !== 'string',
    )
  ) {
    throw new GitHubResponseError('Malformed GitHub commit response');
  }

  for (const commit of body as GitHubCommit[]) {
    const commitUrl = new URL(commit.html_url);

    if (
      !Number.isFinite(Date.parse(commit.commit.author.date)) ||
      commitUrl.origin !== 'https://github.com' ||
      commitUrl.pathname !== `/kellen-miller/${repo}/commit/${commit.sha}`
    ) {
      throw new GitHubResponseError('Malformed GitHub commit response');
    }
  }

  return {
    commits: body as GitHubCommit[],
    next: nextPage(response, url, repo),
  };
}

type GitHubCommit = {
  sha: string;
  parents: unknown[];
  html_url: string;
  commit: { message: string; author: { date: string } };
};

async function fetchProjectActivity(
  project: Project,
  since: string,
  until: string,
  signal: AbortSignal,
): Promise<ActivitySnapshot['projects'][ProjectId]> {
  const countUrl = new URL(
    `${apiRoot}/repos/kellen-miller/${project.repo}/commits`,
  );
  countUrl.searchParams.set('author', 'kellen-miller');
  countUrl.searchParams.set('since', since);
  countUrl.searchParams.set('until', until);
  countUrl.searchParams.set('per_page', '100');

  let commits = 0;
  let page: URL | null = countUrl;

  while (page) {
    const result = await fetchCommitPage(page, project.repo, signal);
    commits += result.commits.length;
    page = result.next;
  }

  const buildUrl = new URL(
    `${apiRoot}/repos/kellen-miller/${project.repo}/commits`,
  );
  buildUrl.searchParams.set('per_page', '100');
  let buildPage: URL | null = buildUrl;
  let build: ProjectBuild | null = null;

  while (buildPage && !build) {
    const result = await fetchCommitPage(buildPage, project.repo, signal);

    for (const commit of result.commits) {
      if (commit.parents.length > 1) {
        continue;
      }

      const firstLine = commit.commit.message.split('\n', 1)[0].trim();

      if (/^(?:ci|chore|build)(?:\([^)]*\))?!?:\s*/i.test(firstLine)) {
        continue;
      }

      const subject = firstLine
        .replace(/^[a-z][\w-]*(?:\([^)]*\))?!?:\s*/i, '')
        .trim();

      if (!subject) {
        continue;
      }

      build = {
        sha: commit.sha,
        date: commit.commit.author.date,
        subject: subject[0].toLocaleUpperCase('en-US') + subject.slice(1),
        url: commit.html_url,
      };

      break;
    }

    buildPage = build ? null : result.next;
  }

  return { commits, build };
}

export async function fetchProjectsForBuild(
  mode: 'live' | 'snapshot',
  now: Date,
): Promise<ProjectActivity> {
  if (mode === 'snapshot') {
    return fromSnapshot();
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
  const until = now.toISOString();
  const since = new Date(
    now.getTime() - 365 * 24 * 60 * 60 * 1000,
  ).toISOString();

  try {
    const activity = await Promise.all(
      projects.map((project) =>
        fetchProjectActivity(project, since, until, controller.signal),
      ),
    );

    return {
      projects: projects.map((project, index) => ({
        ...project,
        ...activity[index],
      })),
      asOf: until,
      source: 'github',
    };
  } catch (error) {
    controller.abort();
    const reason =
      error instanceof GitHubResponseError
        ? error.message
        : error instanceof Error
          ? error.name
          : 'Unknown error';
    console.warn(
      `GitHub project activity unavailable (${reason}); using saved snapshot.`,
    );
    return fromSnapshot();
  } finally {
    clearTimeout(timeout);
  }
}

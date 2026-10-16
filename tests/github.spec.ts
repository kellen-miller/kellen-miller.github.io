import { expect, test } from '@playwright/test';
import { fetchProjectsForBuild } from '../src/data/github';

const originalFetch = globalThis.fetch;
const originalToken = process.env.GITHUB_TOKEN;
const now = new Date('2026-10-15T12:00:00.000Z');

function commit(
  sha: string,
  message: string,
  parents = 1,
): Record<string, unknown> {
  return {
    sha: sha.padStart(40, '0'),
    parents: Array.from({ length: parents }, () => ({})),
    html_url: `https://github.com/kellen-miller/celerity/commit/${sha.padStart(40, '0')}`,
    commit: {
      message,
      author: { date: '2026-10-14T09:00:00Z' },
    },
  };
}

function jsonResponse(body: unknown, link?: string): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      ...(link ? { Link: link } : {}),
    },
  });
}

function nextPageLink(url: URL): string {
  const nextUrl = new URL(url);
  nextUrl.searchParams.set('page', '2');
  return `<${nextUrl.href}>; rel="next"`;
}

function paginatedResponse(url: URL): Response {
  const repo = url.pathname.split('/').at(-2);

  if (url.searchParams.has('author')) {
    if (repo === 'celerity' && !url.searchParams.has('page')) {
      return jsonResponse(
        Array.from({ length: 100 }, (_, index) =>
          commit(String(index + 1), 'fix: work'),
        ),
        nextPageLink(url),
      );
    }

    if (repo === 'celerity' && url.searchParams.get('page') === '2') {
      return jsonResponse(
        Array.from({ length: 3 }, (_, index) =>
          commit(String(index + 101), 'fix: work'),
        ),
      );
    }

    return jsonResponse([]);
  }

  if (repo === 'celerity' && !url.searchParams.has('page')) {
    return jsonResponse(
      [
        commit('a1', 'Merge pull request #1', 2),
        commit('a2', 'CHORE(deps)!: refresh packages'),
        commit('a3', 'ci: release automation'),
      ],
      nextPageLink(url),
    );
  }

  if (repo === 'celerity' && url.searchParams.get('page') === '2') {
    return jsonResponse([commit('a4', 'feat(api)!: preserve HTTP IDs')]);
  }

  return jsonResponse([]);
}

function canonicalPaginationFetch(requests: URL[]): typeof fetch {
  return async (input) => {
    const url = new URL(input.toString());
    requests.push(url);

    if (
      url.searchParams.has('author') &&
      (url.pathname === '/repos/kellen-miller/celerity/commits' ||
        url.pathname === '/repositories/123456789/commits')
    ) {
      if (url.searchParams.has('page')) {
        return jsonResponse(
          Array.from({ length: 3 }, (_, index) =>
            commit(String(index + 101), 'fix: work'),
          ),
        );
      }

      const nextUrl = new URL(url);
      nextUrl.pathname = '/repositories/123456789/commits';
      nextUrl.searchParams.set('page', '2');

      return jsonResponse(
        Array.from({ length: 100 }, (_, index) =>
          commit(String(index + 1), 'fix: work'),
        ),
        `<${nextUrl.href}>; rel="next"`,
      );
    }

    return jsonResponse([]);
  };
}

function failureResponse(kind: string): Response {
  if (kind === 'HTTP') {
    return new Response('rate limited', { status: 429 });
  }

  if (kind === 'malformed') {
    return jsonResponse([{ sha: 'truncated' }]);
  }

  if (kind === 'bad date' || kind === 'bad URL') {
    const malformed = commit('a1', 'fix: valid response');

    if (kind === 'bad date') {
      (
        (malformed.commit as Record<string, unknown>).author as Record<
          string,
          unknown
        >
      ).date = 'not a date';
    } else {
      malformed.html_url = 'https://example.com/commit/a1';
    }

    return jsonResponse([malformed]);
  }

  throw Object.assign(new Error('request timed out'), { name: 'AbortError' });
}

function abortingSiblingFetch(waitingRepos: Set<string>): typeof fetch {
  return async (input, init) => {
    const url = new URL(input.toString());
    const repo = url.pathname.split('/').at(-2) ?? '';

    if (repo === 'celerity') {
      return new Response('forbidden', { status: 403 });
    }

    waitingRepos.add(repo);

    return new Promise<Response>((_, reject) => {
      init?.signal?.addEventListener(
        'abort',
        () =>
          reject(Object.assign(new Error('aborted'), { name: 'AbortError' })),
        { once: true },
      );
    });
  };
}

test.afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalToken === undefined) {
    delete process.env.GITHUB_TOKEN;
  } else {
    process.env.GITHUB_TOKEN = originalToken;
  }
});

test('reads a committed snapshot without making requests, even with a token', async () => {
  process.env.GITHUB_TOKEN = 'must-not-be-used';
  globalThis.fetch = async () => {
    throw new Error('Snapshot mode must not fetch');
  };

  const result = await fetchProjectsForBuild('snapshot', now);

  expect(result.source).toBe('snapshot');
  expect(result.projects).toHaveLength(6);
});

test('counts all pages and scans past merge and maintenance commits for a build', async () => {
  const requests: URL[] = [];

  globalThis.fetch = async (input) => {
    const url = new URL(input.toString());
    requests.push(url);
    return paginatedResponse(url);
  };

  const result = await fetchProjectsForBuild('live', now);
  const celerity = result.projects.find((project) => project.id === 'celerity');
  const countRequest = requests.find(
    (url) =>
      url.pathname.endsWith('/celerity/commits') &&
      url.searchParams.has('author'),
  );

  expect(result.source).toBe('github');
  expect(celerity?.commits).toBe(103);
  expect(celerity?.build?.subject).toBe('Preserve HTTP IDs');
  expect(celerity?.build?.sha).toBe('00000000000000000000000000000000000000a4');
  expect(countRequest?.searchParams.get('since')).toBe(
    '2025-10-15T12:00:00.000Z',
  );
  expect(countRequest?.searchParams.get('until')).toBe(
    '2026-10-15T12:00:00.000Z',
  );
  expect(countRequest?.searchParams.get('per_page')).toBe('100');
  expect(requests.every((url) => url.origin === 'https://api.github.com')).toBe(
    true,
  );
});

test('follows canonical repository pagination with count filters preserved', async () => {
  const requests: URL[] = [];
  globalThis.fetch = canonicalPaginationFetch(requests);

  const result = await fetchProjectsForBuild('live', now);
  const celerity = result.projects.find((project) => project.id === 'celerity');
  const canonicalPage = requests.find(
    (url) => url.pathname === '/repositories/123456789/commits',
  );

  expect(result.source).toBe('github');
  expect(celerity?.commits).toBe(103);
  expect(canonicalPage?.searchParams.get('author')).toBe('kellen-miller');
  expect(canonicalPage?.searchParams.get('since')).toBe(
    '2025-10-15T12:00:00.000Z',
  );
  expect(canonicalPage?.searchParams.get('until')).toBe(
    '2026-10-15T12:00:00.000Z',
  );
  expect(canonicalPage?.searchParams.get('per_page')).toBe('100');
  expect(canonicalPage?.searchParams.get('page')).toBe('2');
});

test('preserves a valid zero count and no qualifying build', async () => {
  globalThis.fetch = async () => jsonResponse([]);

  const result = await fetchProjectsForBuild('live', now);

  expect(result.source).toBe('github');
  expect(result.projects.every((project) => project.commits === 0)).toBe(true);
  expect(result.projects.every((project) => project.build === null)).toBe(true);
});

test.describe('live failure fallback', () => {
  for (const kind of [
    'HTTP',
    'malformed',
    'bad date',
    'bad URL',
    'interrupted',
  ] as const) {
    test(`falls back atomically on ${kind} responses`, async () => {
      globalThis.fetch = async () => failureResponse(kind);

      const result = await fetchProjectsForBuild('live', now);
      const snapshot = await fetchProjectsForBuild('snapshot', now);

      expect(result.source).toBe('snapshot');
      expect(result).toEqual(snapshot);
    });
  }

  test('aborts active sibling requests when one repository fails', async () => {
    const waitingRepos = new Set<string>();
    globalThis.fetch = abortingSiblingFetch(waitingRepos);

    const result = await fetchProjectsForBuild('live', now);

    expect(waitingRepos.size).toBeGreaterThan(0);
    expect(result.source).toBe('snapshot');
    expect(result.projects).toHaveLength(6);
  });
});

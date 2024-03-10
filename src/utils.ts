import * as core from '@actions/core'
import * as github from '@actions/github'

export type Octokit = ReturnType<typeof github.getOctokit>
export type PullRequest = {
  html_url: string
  number: number
}

// Regular expression for matching an array (including empty arrays)
const ARRAY_REGEX = /^\[.*\]$/

/**
 * Get an input as an array.
 * @param name the name of the input
 * @param options the options for getting the input
 */
export function getInputAsArray(
  name: string,
  options?: core.InputOptions,
): string[] {
  const value = core.getInput(name, options)
  return getStringAsArray(value)
}

/**
 * Get an input as an array of strings.
 * @param value the array as a string (e.g. "[a, b, c]")
 * @returns the array of strings
 */
export function getStringAsArray(value: string): string[] {
  if (!ARRAY_REGEX.test(value)) throw new Error('Invalid array format')
  return value
    .slice(1, -1)
    .split(',')
    .map(item => item.trim())
    .filter(item => item.length > 0)
}

export async function areBranchesOutOfSync(
  sourceBranch: string,
  targetBranch: string,
  octokit: Octokit,
): Promise<boolean> {
  const { data: commits } = await octokit.rest.repos.compareCommits({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    base: targetBranch,
    head: sourceBranch,
  })
  return commits.ahead_by > 0
}

export async function findExistingPullRequest(
  sourceBranch: string,
  targetBranch: string,
  octokit: Octokit,
): Promise<PullRequest | null> {
  const { data: pullRequests } = await octokit.rest.pulls.list({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    head: `${github.context.repo.owner}:${sourceBranch}`,
    base: targetBranch,
  })
  return pullRequests[0] || null
}

import * as github from '@actions/github'

export type Octokit = ReturnType<typeof github.getOctokit>
export type PullRequest = {
  html_url: string
  number: number
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

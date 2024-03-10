import * as core from '@actions/core'
import * as github from '@actions/github'
import { areBranchesOutOfSync, findExistingPullRequest } from './utils'

export type Inputs = {
  githubToken: string
  sourceBranch: string
  targetBranch: string
  pullRequestTitle: string
  pullRequestBody: string
  labels: string[]
  assignees: string[]
  reviewers: string[]
  teamReviewers: string[]
  draft: boolean
}

export async function syncBranches(inputs: Inputs): Promise<void> {
  const octokit = github.getOctokit(inputs.githubToken)
  const syncNeeded = await areBranchesOutOfSync(
    inputs.sourceBranch,
    inputs.targetBranch,
    octokit,
  )

  if (!syncNeeded) {
    core.info('Branches are already in sync.')
    return
  }

  const existingPR = await findExistingPullRequest(
    inputs.sourceBranch,
    inputs.targetBranch,
    octokit,
  )

  if (existingPR != null) {
    core.info('Pull request already exists.')
    core.setOutput('pull-request-url', existingPR.html_url)
    core.setOutput('pull-request-number', existingPR.number.toString())
    return
  }

  const { data: pullRequest } = await octokit.rest.pulls.create({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    title: inputs.pullRequestTitle,
    body: inputs.pullRequestBody,
    head: inputs.sourceBranch,
    base: inputs.targetBranch,
  })

  core.setOutput('pull-request-url', pullRequest.html_url)
  core.setOutput('pull-request-number', pullRequest.number.toString())
}

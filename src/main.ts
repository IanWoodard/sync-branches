import * as core from '@actions/core'
import * as github from '@actions/github'
import { areBranchesOutOfSync, findExistingPullRequest } from './utils'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const inputs = {
      sourceBranch: core.getInput('source-branch', { required: true }),
      targetBranch: core.getInput('target-branch', { required: true }),
      commitMessage: core.getInput('commit-message', { required: true }),
      githubToken: core.getInput('github-token', { required: true }),
    }

    const missingInputs = Object.entries(inputs).filter(([, value]) => !value)

    if (missingInputs.length > 0) {
      // Replace camelCase with kebab-case
      core.setFailed(
        `Input required and not supplied: ${missingInputs
          .map(([key]) =>
            key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase(),
          )
          .join(', ')}`,
      )
      return
    }

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
      title: inputs.commitMessage,
      head: inputs.sourceBranch,
      base: inputs.targetBranch,
    })

    core.setOutput('pull-request-url', pullRequest.html_url)
    core.setOutput('pull-request-number', pullRequest.number.toString())
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}

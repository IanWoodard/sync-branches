import * as core from '@actions/core'
import { Inputs, syncBranches } from './syncBranches'
import { getInputAsArray } from './utils'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const inputs: Inputs = {
      githubToken: core.getInput('github-token', { required: true }),
      sourceBranch: core.getInput('source-branch', { required: true }),
      targetBranch: core.getInput('target-branch', { required: true }),
      pullRequestTitle: core.getInput('pull-request-title', {
        required: false,
      }),
      pullRequestBody: core.getInput('pull-request-body', { required: false }),
      labels: getInputAsArray('labels', { required: false }),
      assignees: getInputAsArray('assignees', { required: false }),
      reviewers: getInputAsArray('reviewers', { required: false }),
      teamReviewers: getInputAsArray('team-reviewers', { required: false }),
      draft: core.getBooleanInput('draft', { required: false }),
    }

    if (!inputs.githubToken)
      throw new Error('Input required and not supplied: github-token')
    if (!inputs.sourceBranch)
      throw new Error('Input required and not supplied: source-branch')
    if (!inputs.targetBranch)
      throw new Error('Input required and not supplied: target-branch')

    if (!inputs.pullRequestTitle)
      inputs.pullRequestTitle = `Sync ${inputs.sourceBranch} to ${inputs.targetBranch}`

    if (!inputs.pullRequestBody)
      inputs.pullRequestBody = `This is an auto-generated pull request to sync the ${inputs.sourceBranch} branch to the ${inputs.targetBranch} branch.`

    await syncBranches(inputs)
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}

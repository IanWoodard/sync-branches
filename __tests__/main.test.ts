/**
 * Unit tests for the action's main functionality, src/main.ts
 *
 * These should be run as if the action was called from a workflow.
 * Specifically, the inputs listed in `action.yml` should be set as environment
 * variables following the pattern `INPUT_<INPUT_NAME>`.
 */

import * as core from '@actions/core'
import * as github from '@actions/github'
import * as main from '../src/main'
import { areBranchesOutOfSync, findExistingPullRequest } from '../src/utils'

// Mock the action's main function
const runMock = jest.spyOn(main, 'run')

// Mock the GitHub Actions core library
let getInputMock: jest.SpiedFunction<typeof core.getInput>
let setOutputMock: jest.SpiedFunction<typeof core.setOutput>

jest.mock('@actions/core')
jest.mock('@actions/github', () => ({
  context: {
    repo: {
      owner: 'test-owner',
      repo: 'test-repo',
    },
  },
  getOctokit: jest.fn(),
}))
jest.mock('../src/utils')

describe('action', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    getInputMock = jest.spyOn(core, 'getInput').mockImplementation()
    setOutputMock = jest.spyOn(core, 'setOutput').mockImplementation()
  })

  it('should catch errors and set the action as failed', async () => {
    const error = new Error('Test error')

    getInputMock.mockReturnValue('test')
    ;(areBranchesOutOfSync as jest.Mock).mockRejectedValue(error)

    await main.run()

    expect(runMock).toHaveReturned()
    expect(core.setFailed).toHaveBeenCalledWith(error.message)
  })

  it('should fail if required inputs are not provided', async () => {
    getInputMock.mockReturnValue('')

    await main.run()
    expect(runMock).toHaveReturned()

    expect(core.setFailed).toHaveBeenCalledWith(
      'Input required and not supplied: source-branch, target-branch, commit-message, github-token',
    )
  })

  it('should do nothing if branches are already in sync', async () => {
    getInputMock.mockReturnValue('test')
    ;(areBranchesOutOfSync as jest.Mock).mockResolvedValue(false)

    await main.run()
    expect(runMock).toHaveReturned()

    expect(core.info).toHaveBeenCalledWith('Branches are already in sync.')
    expect(setOutputMock).not.toHaveBeenCalled()
  })

  it('should output the pull request URL and number if it already exists', async () => {
    getInputMock.mockReturnValue('test')
    ;(areBranchesOutOfSync as jest.Mock).mockResolvedValue(true)
    ;(findExistingPullRequest as jest.Mock).mockResolvedValue({
      html_url: 'test-url',
      number: 123,
    })

    await main.run()
    expect(runMock).toHaveReturned()

    expect(core.info).toHaveBeenCalledWith('Pull request already exists.')
    expect(setOutputMock).toHaveBeenCalledWith('pull-request-url', 'test-url')
    expect(setOutputMock).toHaveBeenCalledWith('pull-request-number', '123')
  })

  it('should create a new pull request', async () => {
    getInputMock.mockReturnValue('test')
    ;(areBranchesOutOfSync as jest.Mock).mockResolvedValue(true)
    ;(findExistingPullRequest as jest.Mock).mockResolvedValue(null)
    ;(github.getOctokit as jest.Mock).mockReturnValue({
      rest: {
        pulls: {
          create: jest.fn().mockResolvedValue({
            data: {
              html_url: 'test-url',
              number: 123,
            },
          }),
        },
      },
    })

    await main.run()
    expect(runMock).toHaveReturned()

    expect(core.info).not.toHaveBeenCalledWith('Branches are already in sync.')
    expect(core.info).not.toHaveBeenCalledWith('Pull request already exists.')
    expect(setOutputMock).toHaveBeenCalledWith('pull-request-url', 'test-url')
    expect(setOutputMock).toHaveBeenCalledWith('pull-request-number', '123')
  })
})

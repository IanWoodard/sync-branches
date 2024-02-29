import { areBranchesOutOfSync, findExistingPullRequest } from '../src/utils'

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

describe('utils.ts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('areBranchesOutOfSync', () => {
    it('returns true if the source branch is behind the target branch', async () => {
      const octokit = {
        rest: {
          repos: {
            compareCommits: jest
              .fn()
              .mockResolvedValue({ data: { behind_by: 1 } }),
          },
        },
      }
      const result = await areBranchesOutOfSync(
        'source',
        'target',
        // @ts-expect-error - we don't need to provide all the properties of Octokit
        octokit,
      )
      expect(result).toBe(true)
    })
    it('returns false if the source branch is not behind the target branch', async () => {
      const octokit = {
        rest: {
          repos: {
            compareCommits: jest
              .fn()
              .mockResolvedValue({ data: { behind_by: 0 } }),
          },
        },
      }
      const result = await areBranchesOutOfSync(
        'source',
        'target',
        // @ts-expect-error - we don't need to provide all the properties of Octokit
        octokit,
      )
      expect(result).toBe(false)
    })
  })

  describe('findExistingPullRequest', () => {
    it('returns the first pull request if it exists', async () => {
      const octokit = {
        rest: {
          pulls: {
            list: jest.fn().mockResolvedValue({
              data: [{ html_url: 'test-url', number: 123 }],
            }),
          },
        },
      }
      const result = await findExistingPullRequest(
        'source',
        'target',
        // @ts-expect-error - we don't need to provide all the properties of Octokit
        octokit,
      )
      expect(result).toEqual({ html_url: 'test-url', number: 123 })
    })
    it('returns null if no pull request exists', async () => {
      const octokit = {
        rest: {
          pulls: {
            list: jest.fn().mockResolvedValue({ data: [] }),
          },
        },
      }
      const result = await findExistingPullRequest(
        'source',
        'target',
        // @ts-expect-error - we don't need to provide all the properties of Octokit
        octokit,
      )
      expect(result).toBeNull()
    })
  })
})

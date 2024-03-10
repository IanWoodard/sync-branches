import * as core from '@actions/core'
import {
  areBranchesOutOfSync,
  findExistingPullRequest,
  getInputAsArray,
  getStringAsArray,
} from '../src/utils'

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

let getInputMock: jest.SpiedFunction<typeof core.getInput>

describe('utils.ts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    getInputMock = jest.spyOn(core, 'getInput').mockImplementation()
  })

  describe('getInputAsArray', () => {
    it('returns an array of strings when given a valid array input', () => {
      getInputMock.mockReturnValue('[a, b, c]')
      const result = getInputAsArray('test-input', { required: true })
      expect(result).toEqual(['a', 'b', 'c'])
    })

    it('returns an empty array when given an empty array input', () => {
      getInputMock.mockReturnValue('[]')
      const result = getInputAsArray('test-input', { required: true })
      expect(result).toEqual([])
    })

    it('throws an error when given an invalid array input', () => {
      getInputMock.mockReturnValue('a, b, c')
      expect(() => getInputAsArray('test-input')).toThrow(
        'Invalid array format',
      )
    })
  })

  describe('getStringAsArray', () => {
    it('returns an array of strings when given a valid array string', () => {
      const result = getStringAsArray('[a, b, c]')
      expect(result).toEqual(['a', 'b', 'c'])
    })

    it('returns an empty array when given an empty array string', () => {
      const result = getStringAsArray('[]')
      expect(result).toEqual([])
    })

    it('throws an error when given an invalid array string', () => {
      expect(() => getStringAsArray('a, b, c')).toThrow('Invalid array format')
    })
  })

  describe('areBranchesOutOfSync', () => {
    it('returns true if the source branch is ahead of the target branch', async () => {
      const octokit = {
        rest: {
          repos: {
            compareCommits: jest
              .fn()
              .mockResolvedValue({ data: { ahead_by: 1 } }),
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
    it('returns false if the source branch is not ahead of the target branch', async () => {
      const octokit = {
        rest: {
          repos: {
            compareCommits: jest
              .fn()
              .mockResolvedValue({ data: { ahead_by: 0 } }),
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

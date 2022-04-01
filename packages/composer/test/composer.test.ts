import { OperationResult, Operation, CombinedError } from '@urql/core'
import { MetadataComposer } from '../src'
import { merge, hasError, mapError } from '../src/MetadataComposer'
import { Source, parse } from 'graphql'
import { utils } from 'ethers'

const urls = [
  'https://api.thegraph.com/subgraphs/name/yuetloo/metadata-rinkeby',
]

function createOperation(key: number): Operation<any, any> {
  const source = new Source('{ permissions{id} }')
  const document = parse(source)

  return {
    kind: 'query',
    context: { url: 'x', requestPolicy: 'cache-first' },
    key,
    query: document,
  }
}

function createMetadata(key: number) {
  return {
    id: `key${key}`,
    metadata: `metadata${key}`,
    owner: `owner${key}`,
  }
}

function createPermission(key: number) {
  return {
    id: `p${key}`,
  }
}

describe('MetadataComposer', () => {
  test('simple query', async () => {
    const query = `{
      metadataEntries(OrderBy: owner) {
        id
        owner
        metadata
      }
    }`

    const composer = new MetadataComposer(urls)
    const result = await composer.query(query)
    expect(result.error).toBeUndefined
    expect(result).toBeDefined
  })

  test('Multiple queries', async () => {
    const query = `{
      metadataEntries(OrderBy: owner) {
        id
        owner
        metadata
      }
      permissions(first: 5) {
        id
        metadata {
          id
        }
        account
        create
      }
    }`

    const composer = new MetadataComposer(urls)
    const result = await composer.query(query)
    expect(result.error).toBeUndefined
    expect(result.data.metadataEntries).toBeDefined
    expect(result.data.permissions).toBeDefined
  })

  test('Invalid query', async () => {
    const query = `{
      metadataEntry(OrderBy: owner) {
        id
        owner
        metadata
      }
    }`

    const composer = new MetadataComposer(urls)
    const result = await composer.query(query)
    expect(result.error).toBeDefined
    expect(result.data).toBeUndefined
  })

  test('merge empty array', () => {
    const result: OperationResult<any, any>[] = []
    const merged = merge(result)
    expect(merged).toEqual({ data: {} })
  })

  test('merge array of 2 result', () => {
    const result: OperationResult<any, any>[] = [
      {
        operation: createOperation(1),
        data: {
          metadataEntries: [createMetadata(1)],
        },
      },
      {
        operation: createOperation(2),
        data: {
          metadataEntries: [createMetadata(2)],
          permissions: [createPermission(1)],
        },
      },
    ]
    const merged = merge(result)
    expect(merged.data).toBeDefined
    expect(merged.data.metadataEntries).toHaveLength(2)
    expect(merged.data.metadataEntries[0]).toEqual(
      result[0].data.metadataEntries[0]
    )
    expect(merged.data.metadataEntries[1]).toEqual(
      result[1].data.metadataEntries[0]
    )
    expect(merged.data.permissions[0]).toEqual(result[1].data.permissions[0])
  })

  test('Invalid subgraph url', async () => {
    const query = `{
      metadataEntries {
        id
      }
    }`

    const badUrl = [
      'https://api.thegraph.com/subgraphs/name/bad',
      'https://bad-url.com',
    ]

    const composer = new MetadataComposer(urls.concat(badUrl))
    const result = await composer.query(query)
    expect(result.error).toBeDefined
    expect(result.error).toHaveLength(2)
    expect(result.error).toEqual([
      expect.objectContaining({
        message: expect.any(String),
      }),
      expect.objectContaining({
        message: expect.any(String),
      }),
    ])
    expect(result.data).toBeUndefined
  })

  test('Query with args', async () => {
    const query = `query($id: ID!) {
      metadataEntries(where: { id: $id }) {
        id
      }
    }`
    const args = {
      id: 'non-existent',
    }
    const composer = new MetadataComposer(urls)
    const result = await composer.query(query, args)
    expect(result).toEqual({ data: { metadataEntries: [] } })
  })

  test('hasError with empty array', () => {
    expect(hasError([])).toEqual(false)
  })

  test('hasError with array of data', () => {
    expect(hasError([{ operation: createOperation(1), data: '1' }])).toEqual(
      false
    )
  })

  test('hasError with array of 1 error', () => {
    expect(
      hasError([
        { operation: createOperation(1), error: new CombinedError({}) },
      ])
    ).toEqual(true)
  })

  test('hasError with array of data and error', () => {
    expect(
      hasError([
        {
          operation: createOperation(1),
          data: 'data',
          error: new CombinedError({}),
        },
      ])
    ).toEqual(true)
  })

  test('mapError with an Error input', () => {
    const error = new Error('test')
    expect(mapError(error)).toEqual({ error: [error] })
  })

  test('mapError with query result', () => {
    expect(mapError([{ operation: createOperation(1), data: 'test' }])).toEqual(
      {}
    )
  })

  test('mapError with query result containing error', () => {
    const error = new Error('test')
    expect(mapError([{ operation: createOperation(1), error }])).toEqual({
      error: [error],
    })
  })

  test('search with no result', async () => {
    const composer = new MetadataComposer(urls)
    const { data } = await composer.search('xxxx')
    expect(data).toEqual([])
  })

  test('search with result', async () => {
    const composer = new MetadataComposer(urls)
    const { data } = await composer.search('name')
    expect(data).toBeTruthy()
  })

  test('search with activeOnly option', async () => {
    const composer = new MetadataComposer(urls)
    const { data } = await composer.search('name', { activeOnly: true })
    expect(data).toBeTruthy()
  })

  test('search with error', async () => {
    const badUrl = 'https://api.thegraph.com/subgraphs'
    const composer = new MetadataComposer([badUrl])
    const { error } = await composer.search('name', { activeOnly: true })
    expect(error).toBeTruthy()
  })

  test('get() with invalid id', async () => {
    const composer = new MetadataComposer(urls)
    const { data } = await composer.get('rinkeby')
    expect(data).toBeFalsy()
  })

  test('get() with valid id', async () => {
    const composer = new MetadataComposer(urls)
    const id =
      '0xf43cc4fe645cf868695a8600a4d44d859a87661aefa8379b8aad0b97f3b93940'
    const { data } = await composer.get(id)
    expect(data).toBeTruthy()

    const nameHash = utils.id(data.name)
    const networkHash = utils.id(data.network)
    const hashes = utils.hexConcat([networkHash, data.owner, nameHash])
    const expectedId = utils.keccak256(hashes)
    expect(expectedId).toEqual(id)
  })

  test('get() with error', async () => {
    const badUrl = 'https://api.thegraph.com/subgraphs'
    const composer = new MetadataComposer([badUrl])
    const { error } = await composer.get('xxx')
    expect(error).toBeTruthy()
  })
})

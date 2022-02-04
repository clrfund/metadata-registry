import { OperationResult, Operation } from '@urql/core'
import { MetadataComposer } from '../src'
import { merge } from '../src/MetadataComposer'
import { Source, parse } from 'graphql'

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

    const badUrl = 'https://api.thegraph.com/subgraphs/name/bad'

    const composer = new MetadataComposer(urls.concat(badUrl))
    const result = await composer.query(query)
    expect(result.error).toBeDefined
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
})

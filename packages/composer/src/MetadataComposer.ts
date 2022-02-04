import { createClient, Client, OperationResult } from '@urql/core'
import fetch from 'isomorphic-unfetch'

/**
 * Merge an array of subgraph query results from different networks
 * Export this function for testing purposes
 * @param result array of query results from subgraphs
 * @returns merged result
 */
export function merge(result: OperationResult<any, any>[]): any {
  const data = result.reduce((acc: any, res) => {
    Object.entries(res.data).forEach(([key, val]) => {
      acc[key] = (acc[key] || []).concat(val)
    })

    return acc
  }, {})

  return { data }
}

/**
 * @class MetadataComposer
 */
export class MetadataComposer {
  clients: Client[]
  urls: string[]

  /**
   * @param urls subgraph urls
   *
   * @constructor
   */
  constructor(urls: string[]) {
    this.urls = urls
    this.clients = []
    for (let i = 0; i < urls.length; i++) {
      this.clients.push(createClient({ url: urls[i], fetch }))
    }
  }

  /**
   * Run a subgraph query
   * @param queryString graphql query
   * @param args arguments to pass to the query
   * @returns query result
   */
  async query(queryString: string, args: any = {}): Promise<any> {
    const queryResult = await Promise.all(
      this.clients.map((client) => client.query(queryString, args).toPromise())
    )

    const error = queryResult.find((res) => res.error)
    if (error) {
      return error
    }

    return merge(queryResult)
  }
}

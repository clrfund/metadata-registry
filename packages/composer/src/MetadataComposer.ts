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

// this function is only exported for testing purposes
export function hasError(result: OperationResult<any, any>[]): boolean {
  return !!result.find((el) => el.error)
}

/**
 *
 * this function is only exported for testing purposes
 * @param result
 * @returns
 */
export function mapError(result: OperationResult<any, any>[] | unknown): any {
  if (Array.isArray(result)) {
    return result.reduce((acc, el) => {
      if (el.error) {
        acc.error = (acc.error || []).concat(el.error)
      }
      return acc
    }, {})
  } else {
    return { error: [result] }
  }
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
   * Run a subgraph query against one or more networks and merges the results
   * @param queryString graphql query
   * @param args arguments to pass to the query
   * @returns query result
   */
  async query(queryString: string, args: any = {}): Promise<any> {
    const queryResult = await Promise.all(
      this.clients.map((client) => client.query(queryString, args).toPromise())
    )

    if (hasError(queryResult)) {
      return mapError(queryResult)
    }

    try {
      return merge(queryResult)
    } catch (err) {
      return mapError(err)
    }
  }
}

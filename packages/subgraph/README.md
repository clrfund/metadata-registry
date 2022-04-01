# How to deploy subgraph

1. Prepare the `subgraph.yaml` with the correct network data
    - Update the JSON file that you want to use, located in `/subgraph/config`
    - Inside the `/subgraph` folder
     ```
        npx mustache config/{network}.json subgraph.template.yaml > subgraph.yaml
     ```
2. Deploy subgraph
    ```
        npx graph deploy --node https://api.thegraph.com/deploy/ --ipfs https://api.thegraph.com/ipfs/ ${GRAPH_OWNER}/metadata-${NETWORK} --access-token ${GRAPHKEY}
    ```

NETWORK is a value from the [network list](https://thegraph.com/docs/en/developer/create-subgraph-hosted/#supported-networks)

## How to generate the subgraph UML
The UML diagram was generated using [graphqlvz](https://github.com/sheerun/graphqlviz) and [graphviz](https://www.graphviz.org).

```
npm install -g graphqlviz

# install graphviz on Mac
brew install graphviz

graphqlviz https://api.thegraph.com/subgraphs/name/${GRAPH_OWNER}/metadata-${NETWORK} | dot -Tpng -o subgraphUML.png
```

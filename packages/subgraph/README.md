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

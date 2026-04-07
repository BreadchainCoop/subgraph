A subgraph for indexing the yieldDistributed event from our YieldDistributor smart contract. This is used by the crowdstaking app.

This subgraph is published on The Graph at

https://thegraph.com/explorer/subgraphs/8BnHcPytCzBMrDe1VhNLLkMxD6tnr2WfaXGMciZoA7nE?view=Query&chain=arbitrum-one#query-subgraph

## CI/CD

This repository uses [subgraphform](https://github.com/BreadchainCoop/subgraphform) for CI/CD. On pull requests to `main`, the workflow builds, lints, and tests the subgraph. On merge to `main`, it automatically deploys to The Graph Studio.

The `GRAPH_DEPLOY_KEY` repository secret must be set for deployments to work.

## Local Development

Install dependencies:
```
yarn install
```

Generate types:
```
yarn codegen
```

Build:
```
yarn build
```

Run tests:
```
yarn test
```

Deploy manually (if needed):
```
yarn deploy
```

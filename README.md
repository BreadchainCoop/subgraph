A subgraph for indexing the yieldDistributed event from our YieldDistributor smart contract. This is used by the crowdstaking app.  

This subgraph is published on The Graph at 

https://thegraph.com/explorer/subgraphs/8BnHcPytCzBMrDe1VhNLLkMxD6tnr2WfaXGMciZoA7nE?view=Query&chain=arbitrum-one#query-subgraph

After making changes, this is the workflow to deploy updates to a Graph: 

1. Generate types:
`graph codegen`

2. Build the updated graph:
`graph build`

3. Deploy to The Graph:
`graph deploy breadchain-subgraph`

4. From there, you can wait for the new graph to be indexed and then publish it as the live version from The Graph Playground.

# Tailscale exit nodes on AWS

This is a simple CDK stack that automates the provisioning of Tailscale exit nodes on AWS. It is 
decribed in more detail in [this blog post](blog.scottgerring.com/automating-tailscale-exit-nodes-on-aws/).

To use it, simply edit [bin/tailscale-exitnodes-cdk.ts](bin/tailscale-exitnodes-cdk.ts) to list the
regions you want to use:

```typescript
  stackForRegion('ExitNodesStackSydney', 'ap-southeast-2', "TSSydneyExitNode"),
  stackForRegion('ExitNodesStackZurich', 'eu-central-2', "TSZurichExitNode")
];
```

Next, set the environment variable `TAILSCALE_AUTH_KEY` to your tailscale auth key and deploy with `cdk deploy`.
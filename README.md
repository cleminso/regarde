DEPRECATED

---

## Status

Regarde is build on [jazz-classic](https://github.com/garden-co/classic-jazz). Since [Jazz v2 is out](https://github.com/garden-co/jazz) and fundamentaly changed the approach, I can't fully migrate and get the data ownership properties I was originally looking for. At least, I haven't found a model yet that fits my needs.

Secondly, this was my first project, first repo. a bit ambitious for a first project. I get lose on the way a lot. The implement was confusing, not build with a good DX, half finished. Even if i spend another 6months finishing what I started, I'm not sure it would be usable.

It was great! I evolved with the codebase, deploy my first services, workers, put my hands on APIs and code - that I was not used to a year ago. Over technical code, the hardest part for me was to position myself as different persona. Jumping between `me` as Regarde dev; over "how regarde sdk-user will use it?"; "how end-user will use it? What entry point for them?".

So I decided to stop here. Start and experiments with Jazz v2 and smaller projects, such as a [Jazz inspector](https://github.com/regardedev/inspector). And see if my mental model reach a point I see a way to continue Regarde in ine form or another.

## Problem I've identified

### Identify across Jazz ecosystem applications

- How do users identify themselves in Jazz ecosystem applications and beyond?

- Since JazzAccountId are random characters Id, no once can remember. Users need a memorable, shareable identities that must be unique - which requires a coordination layer.

From a user perspective it means creating one `identity` for every application they use.

- From a application developer perspective it means implementating user profiles separately, for every application they want to create.

Additionally, current solution rely on third-party to handle jazz private keys, making impossible for user to bring a unique identity over applications.
User's don't know their private keys, so they don't own their identity.

### Authentication

- How do we verify API request against data stored in Jazz network?

- Since user authentication data is stored in Jazz (decentralised), the server need to verify who's making API's request.

So I was implementing a stateless authentication. Authentication token was stored in the user's Jazz account root `account.root["regarde-sdk].auth.token` and exposed via `/verify`.

For each authentication request, the server would verify the token against the user's account root. Since the request contains:

- Regarde-Token
- Regarde-Token-Id
- Jazz-Account-Id

Any backend was able to verify that a Jazz user own his account.

At the end I was thinking of leverage Jazz internal API to create a signature implementation and user CoFeed to have a `bySession` authentication - that would have be more elegant.

### Payments

For a Jazz native payment system, Jazz developer needs to implement their own:

- payment provider supports
- CoValues to store payments; subscriptions and licenses under user Account

The idea was to enable Regarde sdk-user to manage their users payments through `RegardeSDK` via Jazz. The payment system extends `RegardeSDK` to provide new Covalues `myPayments`; `mySubscriptions` and `myLicenses` to store App payment events under user account + `webhooks`; `payments`; `subcriptions`; `licenses`; `refunds` and `checkoutSession` under `RegardeUserApp`.

That, sdk-user don't have to write a specific backend services to handle their App payments.
Use regarde as backend service to receive webhooks and services that normalizes payment events from provider into a unified interface. Stores events in Jazz CoValues and provider SDK for querying payment data.

I was starting to refactor the payment implementation to evolve from "webhook-receiver" to a more explicit, owned billing/license domain, with providers adapter.

## What was Regarde?

Regarde was leveraging Jazz native cryptography identify to:

- implement a coordination layer that map `jazzAccountId` <> `UserHandle` relation, via a registry
- temporary authentication to verify user account ownership
- native jazz payment system

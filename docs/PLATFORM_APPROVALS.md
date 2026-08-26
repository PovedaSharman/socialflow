# Social platform approval register

The codebase contains provider adapters; that does not prove the SocialFlow deployment has credentials, review approval or every required scope. Only official provider APIs are permitted.

| Provider family                                    | Baseline implementation            | Typical external work before public launch                                                                 | Status                                 |
| -------------------------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| Meta: Facebook, Instagram, Threads                 | OAuth adapters present             | Business verification, app review, exact scopes/use-case, privacy/deletion URLs, test users and screencast | Blocked on operator account and review |
| LinkedIn                                           | Member/page OAuth adapters present | Developer app, product access and organisation/page scopes; review where required                          | Blocked on operator account and review |
| Google/YouTube/Business Profile                    | OAuth adapters present             | Consent screen verification, sensitive scope justification, test users and possibly security review        | Blocked on operator account and review |
| TikTok                                             | OAuth adapter present              | Developer app, Content Posting API eligibility/audit and approved scopes                                   | Blocked on operator account and review |
| X                                                  | OAuth adapter present              | Paid developer access, project/app configuration and write scopes                                          | Blocked on operator account/plan       |
| Pinterest, Reddit, Tumblr, Discord, Slack, Twitch  | Adapters present                   | Provider app, redirect URIs, least-privilege scopes and any provider review                                | Blocked on operator accounts           |
| Mastodon and other federated/self-hosted providers | Instance-aware adapters present    | Instance compatibility, dynamic/static app registration decision and SSRF-safe configuration               | Needs compatibility verification       |
| Bluesky, Nostr and other protocol providers        | Adapters present                   | Confirm provider-supported authentication does not ask public-SaaS users to paste reusable tokens          | Needs product/security review          |

Before enabling a provider, record official documentation links, requested scopes and their feature mapping, redirect URIs, review evidence, test account, token refresh/expiry behaviour, webhook configuration, rate limits, deletion obligations and an owner. Provider terms and APIs change; verify against current official documentation at approval time.

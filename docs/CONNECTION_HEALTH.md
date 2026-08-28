# Social connection health

The channel list returns a derived, secret-free `health` object. It never
returns access or refresh tokens.

| Status            | Meaning                                       | Required action |
| ----------------- | --------------------------------------------- | --------------- |
| `healthy`         | No known connection issue                     | None            |
| `connecting`      | The provider flow has unfinished steps        | Continue        |
| `expiring`        | The credential expires within seven days      | Reconnect       |
| `action_required` | Refresh failed, expiry passed or is malformed | Reconnect       |
| `disabled`        | The current plan disabled this channel        | Upgrade/enable  |

The response includes only an ISO `expiresAt` value when the stored expiry is
valid. A malformed supplied expiry fails closed as `action_required`; a missing
expiry is accepted because some official providers issue non-expiring tokens.

In the channel sidebar, unhealthy states have a visible text explanation and a
non-colour `!` indicator. Continue and reconnect actions use a labelled 44×44
pixel button with a visible keyboard focus ring. Disabled-plan status remains
informational because plan recovery uses the existing billing controls.

The local SocialFlow test provider should appear healthy after connection. On
the release host, verify the five states with seeded metadata, use Tab and Enter
to activate Continue/Reconnect, and review the expanded and collapsed channel
sidebar at 360, 768, 1024 and 1440 CSS pixels. This visual/runtime check has not
run on this workstation and is not claimed.

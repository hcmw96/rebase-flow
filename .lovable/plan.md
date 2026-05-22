## Goal

Fix the Mindbody sign-in popup itself. The issue is happening before you are signed in: Mindbody is rejecting the OAuth authorize request and showing its own `invalid_scope` error page.

## What is wrong

The authorize URL currently includes this scope:

```text
site.5736189
```

Mindbody is returning:

```text
invalid_scope
```

That means the popup cannot show the normal Mindbody sign-in page. This is not caused by an expired Rebase session.

## Plan

1. Update the Mindbody OAuth init function so the popup authorize URL only requests the valid provisioned scopes:

```text
openid email profile offline_access Mindbody.Api.Public.v6
```

2. Remove `site.${siteId}` from the authorize URL scope.

3. Keep the site/subscriber binding on the token exchange side only, using `subscriberId`, because that is where the saved booking session is created after successful login.

4. Update the refresh-token function the same way: remove `site.${siteId}` from scope and keep `subscriberId` in the body.

5. Deploy the three Mindbody OAuth functions:

```text
mindbody-oauth-init
mindbody-oauth-callback
mindbody-refresh-token
```

6. After deployment, test the popup by starting sign-in again. The expected first success signal is that the Mindbody login form appears instead of the OOPS / invalid_scope page.

## Important note

This plan fixes the login popup first. If Mindbody then signs in successfully but booking still returns “site id does not match,” that would confirm the OAuth client still needs to be authorized for site `5736189` inside Mindbody’s developer setup.
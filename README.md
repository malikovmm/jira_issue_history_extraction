# Atlassian Next.JS

## Requirements

1. JIRA Cloud instance with a URL similar to
   `https://sample-cloud-instance.atlassian.net`
2. Either custom NGROK or our TSS NGROK client for creating a tunnel from JIRA
   to your local instance

### Requirements for running outside of JIRA

This is an optional part that allows you to simulate running inside a JIRA
iframe using proxies.

1. Install the addon once in order to grab the `CLIENT_KEY`
2. Goto your cloud instance click on your profile icon and then `Profile` and
   copy the account id in the URL.
3. Create an API token here
   https://id.atlassian.com/manage-profile/security/api-tokens

## Installation

1. Run `yarn` or `npm install`.
2. Copy `.sample.local.env` to `.local.env` and edit as desired.
3. Run `yarn dev`
4. Setup your NGROK tunnel to point to `localhost:3001`
5. Goto your JIRA Cloud instance and add the new App:
   https://MY_INSTANCE.atlassian.net/plugins/servlet/upm

## Additional Reading

- https://developer.atlassian.com/cloud/jira/platform/basic-auth-for-rest-apis/
- https://developer.atlassian.com/cloud/jira/platform/rest/v3/intro/

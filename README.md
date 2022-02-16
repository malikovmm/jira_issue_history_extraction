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




# ALL-440
- We can get the full history of each field, except for the history of comments, but we can collect this data using web hooks.
- The data comes in the object that contains issue(up to 100 items per request), changelog (up to 100 items per issue), comment(unlimited).
- It will be most convenient to store this data in one table, without dividing it depending on the data type.


| Column | Type | Description |
| ------ | ------ |------ |
| id | INT |  |
| changeId | INT | id of changelog, or comment, if it is comment |
| issueId | STRING | the issue key this change applies to |
| changedAt | DATE | change time |
| authorId | STRING | id of the user who made the change |
| field | STRING | changed field name |
| fieldType | STRING | changed field type |
| fieldId | STRING | changed field id |
| isComment | BOOLEAN | indicates whether the change is commentary |
| action | STRING | create or update or delete |
| clientKey | STRING |  |

- To get the history of one ticket, you need to make 1 request for every 100 entities. But comments can be retrieved without restriction (tested on 1200 comments). For example: to get the full history of 100 tickets, each of which has 100 changes and 1000 comments, you will need to make one request, but to get the full history of 101 tickets, each of which has 101 changes, you will need to make 104 requests.  
However, in addition to requests to get history, requests may be required to get user data (name, avatar, etc.), so there can be a little more requests.
- it was tested to get a complete history of more than a hundred tickets, each of which has more than a hundred changes. The full history was obtained in about 150 requests.
 - To collect and display the entire history, go to Apps -> [this app name] and wait for the application to collect all the necessary data.
![](https://i.imgur.com/dsnqZid.png)
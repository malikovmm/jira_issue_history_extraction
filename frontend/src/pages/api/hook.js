import { authenticate } from '../../api/atlassian';
import { withServerSideAuth } from '../../middleware/authenticate';
import util from 'util';
import { getAccessToken } from 'atlassian-oauth2';

export default async function hook(req, res) {
  console.log(
    'req>>>>>>>>>>>>>>',
    util.inspect(req.body, { showHidden: true, depth: null, colors: true }),
    util.inspect(req.query, { showHidden: true, depth: null, colors: true })
  );
  // getAccessToken()
  // const result = withServerSideAuth(() =>
  //   fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/rest/webhooks/1.0/webhook`, {
  //     headers: {
  //       'Content-Type': 'application/json'
  //     },
  //     method: 'POST',
  //     body: `{
  // 	"name": "my first webhook via rest",
  // 	"url": "${process.env.DEPLOY_URL}/api/hook",
  // 	"events": [
  // 	  "jira:issue_created",
  // 	  "jira:issue_updated"
  // 	],
  // 	"filters": {
  // 		"issue-related-events-section": "Project = JRA AND resolution = Fixed"
  // 	},
  // 	"excludeBody" : false
  // 	}`
  //   })
  // )({ req, query: req.query });
  // await authenticate(req, false, { skipLicense: true });
  // hostRequest()
  // const result = await fetch(`https://zxcb.atlassian.net/rest/api/3/webhook`, {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     // Authorization: `Basic ${Buffer.from(
  //     //   'maksim.malikov@smartforce.io:A0BDx2yRTZdo3bLzJom40E65'
  //     // ).toString(`base64`)}`,
  //     Accept: 'application/json',
  //     Authorization:
  //       'JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI2MTUxNjgyOWM1Mzg4YjAwNjkwNTQ3M2UiLCJxc2giOiJjb250ZXh0LXFzaCIsImlzcyI6IjcxNmUzZmEyLTBlNjYtMzJlNy1hNDBiLTlhMDAxYWQ0ZDc5MiIsImNvbnRleHQiOnsiamlyYSI6eyJwcm9qZWN0Ijp7ImtleSI6IlROMiIsImlkIjoiMTAwMDEifX19LCJleHAiOjE2MzY5NjczMDYsImlhdCI6MTYzNjk2NjQwNn0.5rimd-SieO-JfgYqewdrK12dnZOeln-In9G6fwiInrM'
  //   },
  //   body: `{"name": "my second webhook via rest",
  //   "url": "https://www.example.com/webhooks",
  //   "events": [
  //     "jira:issue_created"]}`
  // });
  // console.log('req.query', req.query);
  // console.log('req.body', req.body);
  // console.log('req.method', req.method);
  // const data = { result };
  // try {
  //   data.text = await result.text();
  //   // data.json = await result.json();
  // } catch (e) {
  //   console.log('ERROR', e);
  // }
  res.send({ data: 'ok' });
}

import util from 'util';

export default async function init(req, res) {
  console.log(
    'req123123>>>>>>>>>>>>>>',
    util.inspect(req.body, { showHidden: true, depth: null, colors: true }),
    util.inspect(req.query, { showHidden: true, depth: null, colors: true })
  );
 
  res.send({ data: 'ok' });
}

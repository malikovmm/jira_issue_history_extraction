import db from '../database';
import { inspect } from 'util';

export const countChanges = async () => {
  const rows = await db.Change.findAll();
  console.log(
    'rows',
    inspect(rows, { showHidden: true, depth: null, colors: true })
  );

  return rows.length;
};

export const bulkCreateChanges = async changes => {
  const res = await db.Change.bulkCreate(changes);
  console.log(
    'res',
    inspect(res, { showHidden: true, depth: null, colors: true })
  );

  return res;
};

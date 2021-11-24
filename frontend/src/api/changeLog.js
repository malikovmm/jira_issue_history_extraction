import db from '../database';

export const countChanges = async () => {
  const rows = await db.Change.findAll();
  return rows.length;
};

export const getChanges = async data => {
  const {
    pageNumber,
    limit,
    id,
    changeId,
    issueKey,
    changedAt,
    authorId,
    field,
    fieldType,
    fieldId,
    order,
    clientKey
  } = data;
  if (!clientKey) throw 'clientKey is required';

  const offset = pageNumber ? (pageNumber - 1) * limit : 0;
  const where = { clientKey };
  id && (where.id = id);
  changeId && (where.changeId = changeId);
  issueKey && (where.issueKey = issueKey);
  changedAt && (where.changedAt = changedAt);
  authorId && (where.authorId = authorId);
  field && (where.field = field);
  fieldType && (where.fieldType = fieldType);
  fieldId && (where.fieldId = fieldId);

  const query = {
    offset,
    limit,
    where,
    raw: true
  };

  order && (query.order = order);
  const result = await db.Change.findAndCountAll(query);

  return result;
};

export const bulkCreateChanges = async changes => {
  const res = await db.Change.bulkCreate(changes);
  return res;
};

export const createChange = async change => {
  const res = await db.Change.create(change);
  return res;
};

import db from '../database';
import { inspect } from 'util';

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
    fieldId
  } = data;
  const offset = pageNumber ? (pageNumber - 1) * limit : 0;
  const where = {};

  id && (where.id = id);
  changeId && (where.changeId = changeId);
  issueKey && (where.issueKey = issueKey);
  changedAt && (where.changedAt = changedAt);
  authorId && (where.authorId = authorId);
  field && (where.field = field);
  fieldType && (where.fieldType = fieldType);
  fieldId && (where.fieldId = fieldId);

  const rows = await db.Change.findAll({ offset, limit, where, raw: true });

  return rows;
};

export const bulkCreateChanges = async changes => {
  const res = await db.Change.bulkCreate(changes);

  return res;
};

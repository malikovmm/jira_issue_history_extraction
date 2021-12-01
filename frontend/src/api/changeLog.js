import db from '../database';
import { Op } from 'sequelize';
import moment from 'moment';
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
    dateFrom,
    dateTo,
    clientKey
  } = data;
  if (!clientKey) throw 'clientKey is required';
  const dateFromMoment = moment(dateFrom);
  const dateToMoment = moment(dateTo);
  const offset = pageNumber ? (pageNumber - 1) * limit : 0;
  const where = { clientKey };
  id && (where.id = id);
  changeId && (where.changeId = changeId);
  issueKey && (where.issueKey = issueKey);
  changedAt && (where.changedAt = changedAt);
  authorId && (where.authorId = authorId);
  field && (where.field = { [Op.like]: '%' + field + '%' });
  fieldType && (where.fieldType = fieldType);
  fieldId && (where.fieldId = fieldId);

  (dateFrom || dateTo) && (where.changedAt = {});

  if (dateFrom && dateFromMoment.isValid()) {
    where.changedAt[Op.gte] = dateFromMoment.utcOffset(0, true).format();
  }
  if (dateTo && dateToMoment.isValid()) {
    where.changedAt[Op.lte] = dateToMoment.utcOffset(0, true).format();
  }
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

export const countClientChanges = async data => {
  const { clientKey } = data;
  if (!clientKey) throw 'clientKey is required';
  const query = {
    where: {
      clientKey
    },
    raw: true
  };
  const quantity = await db.Change.count(query);
  console.log('quantity.', quantity);

  return quantity;
};
export const bulkCreateChanges = async changes => {
  console.log('changes>>>>>>>>>>>>>>>>>>>>>>>>>>>', changes);
  const res = await db.Change.bulkCreate(changes);
  return res;
};

export const createChange = async change => {
  const res = await db.Change.create(change);
  return res;
};

export const getUserIds = async data => {
  const { clientKey } = data;
  if (!clientKey) throw 'clientKey is required';
  const where = { clientKey };
  const query = {
    where,
    raw: true,
    attributes: ['authorId'],
    group: ['authorId']
  };
  const result = await db.Change.findAndCountAll(query);
  return result;
};

export const getByField = async data => {
  const {
    clientKey,
    fieldId,
    order,
    toVal,
    limit = 50,
    pageNumber = 1,
    action
  } = data;
  if (!clientKey) throw 'clientKey is required';

  const offset = pageNumber ? (pageNumber - 1) * limit : 0;

  const where = { clientKey, fieldId };
  toVal && (where.toVal = toVal);
  action && (where.action = action);

  const query = {
    offset,
    limit,
    where,
    raw: true,
    order
  };
  console.log('queryqueryquery', query, toVal);
  const result = await db.Change.findAndCountAll(query);
  return result;
};

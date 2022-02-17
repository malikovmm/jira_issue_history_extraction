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
    issueId,
    changedAt,
    authorId,
    field,
    fieldType,
    fieldId,
    order,
    dateFrom,
    dateTo,
    clientId
  } = data;
  if (!clientId) throw 'clientId is required';
  const dateFromMoment = moment(dateFrom);
  const dateToMoment = moment(dateTo);
  const offset = pageNumber ? (pageNumber - 1) * limit : 0;
  const where = { clientId };
  id && (where.id = id);
  changeId && (where.changeId = changeId);
  issueId && (where.issueId = issueId);
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
  const { clientId } = data;
  if (!clientId) throw 'clientId is required';
  const query = {
    where: {
      clientId
    },
    raw: true
  };
  const quantity = await db.Change.count(query);

  return quantity;
};
export const bulkCreateChanges = async changes => {
  const res = await db.Change.bulkCreate(changes);
  return res;
};

export const createChange = async change => {
  const res = await db.Change.create(change);
  return res;
};

export const getUserIds = async data => {
  const { clientId } = data;
  if (!clientId) throw 'clientId is required';
  const where = { clientId };
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
    clientId,
    fieldId,
    order,
    toVal,
    limit,
    pageNumber = 1,
    action,
    attributes,
    group
  } = data;
  if (!clientId) throw 'clientId is required';

  const offset = limit ? (pageNumber ? (pageNumber - 1) * limit : 0) : 0;

  const where = { clientId, fieldId };
  toVal && (where.toVal = toVal);
  action && (where.action = action);

  const query = {
    offset,
    limit,
    where,
    raw: true,
    order,
    attributes,
    group
  };
  const result = await db.Change.findAndCountAll(query);
  return result;
};

export const getByChangedFields = async data => {
  const { clientId, order, attributes, group, limit, pageNumber } = data;
  if (!clientId) throw 'clientId is required';

  const offset = limit ? (pageNumber ? (pageNumber - 1) * limit : 0) : 0;

  const where = { clientId };

  const query = {
    offset,
    limit,
    where,
    raw: true,
    order,
    attributes,
    group
  };
  const result = await db.Change.findAll(query);
  return result;
};

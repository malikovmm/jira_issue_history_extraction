import Sequelize from 'sequelize';
import mysql2 from 'mysql2';

import * as models from './models';

const db = {
  Sequelize
};

const dbConfig = {
  host: process.env.MYSQL_HOST,
  database: process.env.MYSQL_DATABASE,
  username: process.env.MYSQL_USERNAME,
  password: process.env.MYSQL_PASSWORD,
  dialect: process.env.MYSQL_DIALECT
};

if (dbConfig.dialect === 'mysql') {
  dbConfig.dialectModule = mysql2;
}

const sequelize = new Sequelize({
  logging:
    process.env.NODE_ENV === 'development'
      ? a => {
          console.log(a);
        }
      : undefined,
  ...dbConfig
});

Object.keys(models).forEach(model => {
  db[model] = models[model](sequelize, Sequelize.DataTypes);
});

Object.keys(models).forEach(modelName => {
  if ('scopes' in db[modelName]) {
    db[modelName].scopes(db);
  }
});

Object.keys(models).forEach(modelName => {
  if ('associate' in db[modelName]) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;

db.connect = async () => {
  if (!db.connected) {
    await sequelize.authenticate();
    db.connected = true;
  }
};

db.disconnect = async () => {
  return db.sequelize.close();
};

export default db;
export * from './util';

/**
 * Handles calling connect and disconnect and error handling
 * @param {*} fn
 */
export const withDB = fn => async (req, res) => {
  try {
    await db.connect();
    req.db = db;
    return await fn(req, res);
  } catch (e) {
    console.log(e.toString(), e);
    return res.status(500).json({
      success: false,
      error: e.toString()
    });
  } finally {
    if (
      process.env.NODE_ENV !== 'development' &&
      process.env.NEXT_PUBLIC_BUILD_TARGET === 'serverless'
    ) {
      if (db.connected) {
        await db.disconnect().catch(e => {
          console.log('Error disconnecting DB', e.toString(), e);
        });
        db.connected = false;
      }
    }
  }
};

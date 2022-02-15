/* eslint-disable import/no-anonymous-default-export */
export const fieldsList = [
  'id',
  'changeId',
  'issueKey',
  'projectId',
  'changedAt',
  'authorId',
  'field',
  'fieldType',
  'fieldId',
  'isComment',
  'action',
  'fromVal',
  'toVal',
  'attachment',

  'issue' // when issue created/deleted. To not create unnecessary entries
];
/**
 * field ids, where allow to collect data (fromString, toString, to, from)
 */
export const collectAllowedIds = [
  'timespent',
  'status',
  'summary',
  'timeestimate'
];

export default function (sequelize, DataTypes) {
  var Change = sequelize.define(
    'Change',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      changeId: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      issueKey: {
        type: DataTypes.STRING,
        allowNull: false
      },
      projectId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      changedAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      authorId: {
        type: DataTypes.STRING,
        allowNull: false
      },
      field: {
        type: DataTypes.STRING,
        allowNull: false
      },
      fieldType: {
        type: DataTypes.STRING,
        allowNull: false
      },
      fieldId: {
        type: DataTypes.STRING,
        allowNull: true
      },
      isComment: {
        type: DataTypes.BOOLEAN,
        allowNull: false
      },
      action: {
        // create | delete | update
        type: DataTypes.STRING,
        allowNull: false
      },
      clientKey: {
        type: DataTypes.STRING,
        allowNull: false
      },
      fromVal: {
        type: DataTypes.STRING,
        allowNull: true
      },
      toVal: {
        type: DataTypes.STRING,
        allowNull: true
      }
    },
    {
      tableName: 'change'
    }
  );

  return Change;
}

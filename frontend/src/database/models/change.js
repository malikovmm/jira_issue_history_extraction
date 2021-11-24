/* eslint-disable import/no-anonymous-default-export */
export const fielsList = [
  'id',
  'changeId',
  'issueKey',
  'changedAt',
  'authorId',
  'field',
  'fieldType',
  'fieldId',
  'isComment',
  'action'
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
        allowNull: false
      },
      issueKey: {
        type: DataTypes.STRING,
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
        allowNull: false
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
      }
    },
    {
      tableName: 'change'
    }
  );

  return Change;
}

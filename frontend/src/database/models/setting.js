export default function (sequelize, DataTypes) {
  var Setting = sequelize.define(
    'Setting',
    {
      clientId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
      },
      entityType: {
        type: DataTypes.STRING(10),
        allowNull: false,
        primaryKey: true
      },
      entityId: {
        type: DataTypes.STRING(50),
        allowNull: false,
        primaryKey: true
      },
      key: {
        type: DataTypes.STRING(50),
        allowNull: false,
        primaryKey: true
      },
      value: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      createdBy: {
        type: DataTypes.STRING,
        allowNull: false
      },
      updatedBy: {
        type: DataTypes.STRING,
        allowNull: false
      }
    },
    {
      tableName: 'settings',
      indexes: [
        {
          name: 'ClientId_EntityType_EntityId',
          fields: ['clientId', 'entityType', 'entityId', 'key'],
          unique: true
        }
      ]
    }
  );

  Setting.associate = models => {
    Setting.belongsTo(models.AddonSetting, {
      foreignKey: 'clientId',
      targetKey: 'clientId',
      as: 'addonSetting'
    });
  };
  Setting.scope = () => {};

  return Setting;
}

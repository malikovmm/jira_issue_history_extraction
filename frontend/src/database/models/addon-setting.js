export default function AddonSettingModel(sequelize, DataTypes) {
  var AddonSetting = sequelize.define(
    'AddonSetting',
    {
      // primary keys
      clientId: {
        field: 'id',
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      clientKey: {
        type: DataTypes.STRING,
        allowNull: false
      },

      // data
      key: {
        type: DataTypes.STRING,
        allowNull: false
      },
      value: {
        field: 'val',
        type: DataTypes.JSON,
        allowNull: true,
        get: function () {
          const val = this.getDataValue('value');
          return val ? JSON.parse(val) : val;
        }
      }
    },
    {
      tableName: 'addonsettings',
      indexes: [
        {
          name: 'clientKey',
          fields: ['clientKey', 'key'],
          unique: true
        }
      ]
    }
  );

  AddonSetting.associate = models => {
    AddonSetting.hasOne(models.LifecycleEvent, {
      foreignKey: 'clientId',
      sourceKey: 'clientId',
      as: 'lifecycleEvents'
    });
    AddonSetting.hasOne(models.Setting, {
      foreignKey: 'clientId',
      sourceKey: 'clientId',
      as: 'settings'
    });
  };

  return AddonSetting;
}

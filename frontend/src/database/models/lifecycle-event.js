export default function (sequelize, DataTypes) {
  var LifecycleEvent = sequelize.define(
    'LifecycleEvent',
    {
      // primary keys
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },

      // main associations
      clientId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },

      // data
      clientKey: {
        type: DataTypes.STRING,
        allowNull: false
      },
      addonKey: {
        type: DataTypes.STRING,
        allowNull: false
      },
      eventType: {
        type: DataTypes.STRING,
        allowNull: false
      },
      val: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    },
    {
      tableName: 'lifecycle_events'
    }
  );

  LifecycleEvent.associate = models => {
    LifecycleEvent.belongsTo(models.AddonSetting, {
      foreignKey: 'clientId',
      targetKey: 'clientId',
      as: 'addonSetting'
    });
  };

  return LifecycleEvent;
}

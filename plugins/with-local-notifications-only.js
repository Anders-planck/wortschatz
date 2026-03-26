const { withEntitlementsPlist } = require("expo/config-plugins");

/**
 * Removes the aps-environment entitlement that expo-notifications adds.
 * This is needed for Personal Development Teams which don't support
 * push notifications. Local scheduled notifications still work fine.
 */
module.exports = function withLocalNotificationsOnly(config) {
  return withEntitlementsPlist(config, (mod) => {
    delete mod.modResults["aps-environment"];
    return mod;
  });
};

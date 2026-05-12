const appJson = require("./app.json");

module.exports = {
  ...appJson.expo,
  extra: {
    ...(appJson.expo.extra ?? {}),
    sentryDsn: process.env.SENTRY_DSN ?? process.env.EXPO_PUBLIC_SENTRY_DSN ?? "",
  },
};

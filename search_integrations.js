(async () => {
  try {
    const results = await searchIntegrations("email");
    console.log("RESULTS:" + JSON.stringify(results));
  } catch (e) {
    console.log("ERROR:" + e.message);
  }
})();

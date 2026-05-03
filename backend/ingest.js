const { fetchAndProcessResearch } = require("./src/services/ingestionService");

async function main() {
  await fetchAndProcessResearch();
  process.exit(0);
}

main();

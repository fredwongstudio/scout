const path = require("path");
const dotenv = require("dotenv");

const envPath = path.resolve(__dirname, "../.env");

dotenv.config({
  path: envPath
});

function requireEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}`
    );
  }

  return value;
}

const config = {
  openaiApiKey: requireEnv("OPENAI_API_KEY"),
  // ATLAS_BASE_URL is retained temporarily so the current sandbox setup
  // continues to work until ATLAS_SEARCH_BASE_URL is configured at cutover.
  atlasSearchBaseUrl:
    process.env.ATLAS_SEARCH_BASE_URL ||
    requireEnv("ATLAS_BASE_URL"),
  atlasClientId: requireEnv("ATLAS_CLIENT_ID"),
  atlasClientSecret: requireEnv("ATLAS_CLIENT_SECRET")
};

module.exports = {
  config
};

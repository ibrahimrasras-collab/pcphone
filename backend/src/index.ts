import app from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { db } from "./db/index.js";

async function main() {
  try {
    await db.execute("SELECT 1");
    logger.info("Database connection established");
  } catch (err) {
    logger.fatal({ err }, "Failed to connect to database");
    process.exit(1);
  }

  app.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
  });
}

main().catch((err) => {
  logger.fatal({ err }, "Failed to start server");
  process.exit(1);
});

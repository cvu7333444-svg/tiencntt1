import mongoose from "mongoose";

const MIGRATION_KEY = "__contributionIndexMigration";

export async function ensureContributionIndexes() {
  if (!mongoose.connection.db) {
    throw new Error("MongoDB must be connected before migrating contribution indexes");
  }

  if (!globalThis[MIGRATION_KEY]) {
    globalThis[MIGRATION_KEY] = (async () => {
      const collection = mongoose.connection.db.collection("contributions");
      const indexes = await collection.indexes();
      const legacyIndex = indexes.find((index) => {
        const keys = Object.entries(index.key || {});
        return (
          index.unique &&
          keys.length === 2 &&
          index.key.campaignId === 1 &&
          index.key.userId === 1
        );
      });

      if (legacyIndex) {
        await collection.dropIndex(legacyIndex.name);
      }
    })().catch((error) => {
      globalThis[MIGRATION_KEY] = null;
      throw error;
    });
  }

  await globalThis[MIGRATION_KEY];
}

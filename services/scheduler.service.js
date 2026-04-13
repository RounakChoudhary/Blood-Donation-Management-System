const bloodRequestService = require("./bloodRequest.service");
const responseTokenService = require("./responseToken.service");

function parsePositiveInt(value, fallback) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

function buildRunner(name, task) {
  let running = false;

  return async () => {
    if (running) {
      return;
    }

    running = true;
    try {
      await task();
    } catch (error) {
      console.error(`[scheduler] ${name} failed:`, error);
    } finally {
      running = false;
    }
  };
}

function startBackgroundJobs() {
  const schedulerEnabled = String(process.env.ENABLE_BACKGROUND_JOBS || "true").toLowerCase() !== "false";
  if (!schedulerEnabled) {
    console.log("[scheduler] background jobs disabled");
    return { stop: () => {} };
  }

  const autoExpansionIntervalMs = parsePositiveInt(
    process.env.AUTO_RADIUS_EXPANSION_JOB_INTERVAL_MS,
    5 * 60 * 1000
  );
  const responseCleanupIntervalMs = parsePositiveInt(
    process.env.RESPONSE_TOKEN_CLEANUP_INTERVAL_MS,
    5 * 60 * 1000
  );

  const autoExpansionRunner = buildRunner("auto-radius-expansion", async () => {
    const result = await bloodRequestService.runAutoRadiusExpansionBatch({
      interval_minutes: parsePositiveInt(process.env.AUTO_RADIUS_EXPANSION_ELIGIBILITY_MINUTES, 5),
      request_limit: parsePositiveInt(process.env.AUTO_RADIUS_EXPANSION_REQUEST_LIMIT, 50),
      match_limit: parsePositiveInt(process.env.AUTO_RADIUS_EXPANSION_MATCH_LIMIT, 25),
    });

    if (result.expanded_count > 0 || result.eligible_count > 0) {
      console.log(
        `[scheduler] auto-radius-expansion eligible=${result.eligible_count} expanded=${result.expanded_count}`
      );
    }
  });

  const responseCleanupRunner = buildRunner("response-token-cleanup", async () => {
    const result = await responseTokenService.expirePendingResponses();
    if (result.expired_token_count > 0 || result.updated_match_count > 0) {
      console.log(
        `[scheduler] response-token-cleanup expired_tokens=${result.expired_token_count} updated_matches=${result.updated_match_count}`
      );
    }
  });

  const autoExpansionTimer = setInterval(autoExpansionRunner, autoExpansionIntervalMs);
  const responseCleanupTimer = setInterval(responseCleanupRunner, responseCleanupIntervalMs);

  if (typeof autoExpansionTimer.unref === "function") autoExpansionTimer.unref();
  if (typeof responseCleanupTimer.unref === "function") responseCleanupTimer.unref();

  setTimeout(autoExpansionRunner, 10_000);
  setTimeout(responseCleanupRunner, 15_000);

  console.log(
    `[scheduler] started auto-radius=${autoExpansionIntervalMs}ms response-cleanup=${responseCleanupIntervalMs}ms`
  );

  return {
    stop() {
      clearInterval(autoExpansionTimer);
      clearInterval(responseCleanupTimer);
    },
  };
}

module.exports = {
  startBackgroundJobs,
};

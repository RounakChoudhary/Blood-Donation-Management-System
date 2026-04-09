const AuditLog = require("../models/auditLog.model");

function buildActorPayload(actor = {}) {
  return {
    id: actor.id ?? null,
    role: actor.role ?? null,
    actorType: actor.actorType ?? "user",
  };
}

async function logPrivilegedAction({ actor, action, entity, metadata = null }) {
  if (!actor) return null;

  const normalizedRole = actor.role || actor.actorType;
  if (!["admin"].includes(normalizedRole)) {
    return null;
  }

  try {
    return await AuditLog.createAuditLog({
      actor: buildActorPayload(actor),
      action,
      entity,
      metadata,
    });
  } catch (error) {
    // Audit logging must never block core admin actions.
    // If migration 025 has not been applied, Postgres raises 42P01 (undefined_table).
    if (error?.code === "42P01") {
      console.warn("Audit log table missing. Skipping audit entry.", {
        action,
        entity,
      });
      return null;
    }

    console.warn("Audit log write failed. Continuing without blocking request.", {
      action,
      entity,
      error: error?.message,
    });
    return null;
  }
}

module.exports = {
  logPrivilegedAction,
};

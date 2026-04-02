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

  return AuditLog.createAuditLog({
    actor: buildActorPayload(actor),
    action,
    entity,
    metadata,
  });
}

module.exports = {
  logPrivilegedAction,
};

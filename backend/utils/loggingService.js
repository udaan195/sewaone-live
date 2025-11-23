const AuditLog = require('../models/AuditLog');

const logAction = async (agentId, agentName, agentRole, actionType, details, targetId = null) => {
    try {
        const newLog = new AuditLog({
            agentId,
            agentName,
            agentRole,
            actionType,
            details,
            targetId
        });
        await newLog.save();
        console.log(`[AUDIT] ${agentName} (${actionType}): ${details}`);
    } catch (e) {
        console.error("Failed to save audit log:", e.message);
    }
};

module.exports = { logAction };
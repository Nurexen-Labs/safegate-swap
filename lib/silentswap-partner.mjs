import { createSilentSwapClient } from "@silentswap/sdk";

const INTEGRATOR_ID_RE = /^int_[a-z0-9]{24}$/;

export function readSilentSwapPartnerConfig(env = process.env) {
  const integratorId =
    String(env.SILENTSWAP_INTEGRATOR_ID || "").trim();

  if (!integratorId) {
    return {
      configured: false,
      valid: false,
      integratorId: null,
      maskedIntegratorId: null,
      activation: "NOT_CONFIGURED"
    };
  }

  const valid = INTEGRATOR_ID_RE.test(integratorId);

  return {
    configured: true,
    valid,
    integratorId,
    maskedIntegratorId:
      valid
        ? `${integratorId.slice(0, 8)}...${integratorId.slice(-6)}`
        : "INVALID",
    activation: valid
      ? "PENDING_REMOTE_CONFIRMATION"
      : "INVALID_CONFIG"
  };
}

export function createSilentSwapPartnerClient(env = process.env) {
  const config = readSilentSwapPartnerConfig(env);

  if (!config.configured) {
    const error = new Error("SilentSwap integrator ID is not configured");
    error.code = "PARTNER_NOT_CONFIGURED";
    throw error;
  }

  if (!config.valid) {
    const error = new Error("SilentSwap integrator ID format is invalid");
    error.code = "INVALID_INTEGRATOR_ID";
    throw error;
  }

  return createSilentSwapClient({
    integratorId: config.integratorId
  });
}

export function classifySilentSwapPartnerError(error) {
  const status =
    Number(error?.status ?? error?.statusCode ?? 0) || null;

  let body = error?.body ?? null;

  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {}
  }

  if (
    status === 403 &&
    body &&
    typeof body === "object" &&
    body.error === "integrator_not_allowed"
  ) {
    return {
      code: "PARTNER_NOT_ACTIVE",
      status: 403,
      retryable: true,
      owner: "SILENTSWAP",
      message:
        "Integrator ID is valid but not yet enabled by SilentSwap."
    };
  }

  return {
    code: "SILENTSWAP_UPSTREAM_ERROR",
    status,
    retryable: false,
    owner: "UNKNOWN",
    message: String(error?.message || "SilentSwap request failed")
  };
}

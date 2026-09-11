import assert from "node:assert/strict";

import {
  readSilentSwapPartnerConfig,
  createSilentSwapPartnerClient,
  classifySilentSwapPartnerError
} from "../lib/silentswap-partner.mjs";

const env = {
  SILENTSWAP_INTEGRATOR_ID:
    "int_aaaaaaaaaaaaaaaaaaaaaaaa"
};

const config = readSilentSwapPartnerConfig(env);

assert.equal(config.configured, true);
assert.equal(config.valid, true);

const client = createSilentSwapPartnerClient(env);

assert.equal(typeof client.quote, "function");
assert.equal(typeof client.placeOrder, "function");
assert.equal(typeof client.getOrder, "function");
assert.equal(
  typeof client.trackOrderViaWebSocket,
  "function"
);

const invalid = readSilentSwapPartnerConfig({
  SILENTSWAP_INTEGRATOR_ID: "bad-id"
});

assert.equal(invalid.valid, false);

assert.throws(
  () =>
    createSilentSwapPartnerClient({
      SILENTSWAP_INTEGRATOR_ID: "bad-id"
    }),
  /format is invalid/
);

const classified =
  classifySilentSwapPartnerError({
    status: 403,
    body: {
      error: "integrator_not_allowed"
    }
  });

assert.equal(
  classified.code,
  "PARTNER_NOT_ACTIVE"
);

assert.equal(
  classified.owner,
  "SILENTSWAP"
);

console.log("INTEGRATOR_ID_FORMAT=PASS");
console.log("PARTNER_CLIENT_CREATE=PASS");
console.log("SDK_QUOTE_CAPABILITY=PASS");
console.log("SDK_ORDER_CAPABILITY=PASS");
console.log("SDK_STATUS_CAPABILITY=PASS");
console.log("SDK_TRACKING_CAPABILITY=PASS");
console.log("INVALID_CONFIG_FAIL_CLOSED=PASS");
console.log("PARTNER_NOT_ACTIVE_CLASSIFICATION=PASS");
console.log("PARTNER_CONFIG_LAYER=PASS");

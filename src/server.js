import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  createSilentSwapClient,
  listAssets
} from "@silentswap/sdk";

import {
  readSilentSwapPartnerConfig
} from "../lib/silentswap-partner.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, "../public");

const app = express();

app.use(express.json({ limit: "64kb" }));
app.use(express.static(publicDir));

const baseClient = createSilentSwapClient();

app.get("/api/status", (_req, res) => {
  const methods =
    Object.getOwnPropertyNames(
      Object.getPrototypeOf(baseClient)
    );

  const partner =
    readSilentSwapPartnerConfig();

  return res.status(200).json({
    ok: true,
    product: "SafeGate Swap",
    version: "0.1.0",

    executionLayer: "SilentSwap",
    assuranceLayer: "SafeGate",

    agentReady: true,
    custody: false,
    walletAuthority: "external",

    liveExecutionEnabled: false,

    partner: {
      configured: partner.configured,
      valid: partner.valid,
      integratorId:
        partner.maskedIntegratorId,
      activation:
        partner.activation
    },

    methods: {
      quote:
        methods.includes("quote"),

      placeOrder:
        methods.includes("placeOrder"),

      getOrder:
        methods.includes("getOrder"),

      trackOrderViaWebSocket:
        methods.includes(
          "trackOrderViaWebSocket"
        )
    }
  });
});

app.get("/api/partner/status", (_req, res) => {
  const partner =
    readSilentSwapPartnerConfig();

  return res.status(200).json({
    ok: true,

    provider: "SilentSwap",

    configured:
      partner.configured,

    valid:
      partner.valid,

    integratorId:
      partner.maskedIntegratorId,

    activation:
      partner.activation,

    productionOrigin:
      "https://swap.safegatelabs.xyz",

    liveExecutionEnabled:
      false
  });
});

app.get("/api/assets", (_req, res) => {
  try {
    return res.status(200).json({
      ok: true,
      assets: listAssets()
    });
  } catch {
    return res.status(500).json({
      ok: false,
      error: "asset_registry_failed"
    });
  }
});

app.post(
  "/api/agent/prepare-swap",
  (req, res) => {

    const {
      sourceAsset,
      destinationAsset,
      amount,
      recipient
    } = req.body || {};

    if (
      !sourceAsset ||
      !destinationAsset ||
      !amount ||
      !recipient
    ) {
      return res.status(400).json({
        ok: false,
        error:
          "missing_required_fields"
      });
    }

    const requestId =
      "SG-SWAP-" +
      Date.now()
        .toString(36)
        .toUpperCase();

    return res.status(200).json({
      ok: true,

      schema:
        "SAFEGATE_AGENT_SWAP_INTENT_V1",

      request_id:
        requestId,

      execution_provider:
        "SilentSwap",

      intent: {
        sourceAsset,
        destinationAsset,
        amount,
        recipient
      },

      controls: {
        wallet_authorization_required:
          true,

        automatic_spend:
          false,

        custody:
          false,

        order_submission:
          false
      },

      assurance: {
        request_binding:
          "PREPARED",

        execution:
          "NOT_EXECUTED",

        outcome:
          "NOT_OBSERVED",

        commerce_verified:
          false
      }
    });
  }
);

app.post("/api/quote", (_req, res) => {
  const partner =
    readSilentSwapPartnerConfig();

  if (!partner.configured || !partner.valid) {
    return res.status(503).json({
      ok: false,
      code:
        "SILENTSWAP_PARTNER_CONFIG_INVALID"
    });
  }

  /*
    IMPORTANT:
    SilentSwap returned:
    HTTP 403 integrator_not_allowed

    Until SilentSwap confirms remote activation,
    this endpoint MUST NOT attempt order execution.
  */

  return res.status(423).json({
    ok: false,

    code:
      "SILENTSWAP_PARTNER_ACTIVATION_PENDING",

    provider:
      "SilentSwap",

    integratorId:
      partner.maskedIntegratorId,

    wallet_used:
      false,

    signature_created:
      false,

    order_placed:
      false,

    payment_sent:
      false
  });
});

app.get("/", (_req, res) => {
  return res.sendFile(
    path.join(publicDir, "index.html")
  );
});

export default app;

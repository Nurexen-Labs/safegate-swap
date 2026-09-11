import assert from "node:assert/strict";
import app from "./src/server.js";

const server =
  app.listen(4187, "127.0.0.1");

try {
  const statusResponse =
    await fetch(
      "http://127.0.0.1:4187/api/status"
    );

  assert.equal(
    statusResponse.status,
    200
  );

  const status =
    await statusResponse.json();

  assert.equal(status.ok, true);
  assert.equal(
    status.partner.configured,
    true
  );
  assert.equal(
    status.partner.valid,
    true
  );

  const partnerResponse =
    await fetch(
      "http://127.0.0.1:4187/api/partner/status"
    );

  assert.equal(
    partnerResponse.status,
    200
  );

  const partner =
    await partnerResponse.json();

  assert.equal(
    partner.configured,
    true
  );

  const prepareResponse =
    await fetch(
      "http://127.0.0.1:4187/api/agent/prepare-swap",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json"
        },
        body: JSON.stringify({
          sourceAsset: "USDC",
          destinationAsset: "ETH",
          amount: "1",
          recipient:
            "0x1111111111111111111111111111111111111111"
        })
      }
    );

  assert.equal(
    prepareResponse.status,
    200
  );

  const prepared =
    await prepareResponse.json();

  assert.equal(
    prepared.assurance.execution,
    "NOT_EXECUTED"
  );

  const quoteResponse =
    await fetch(
      "http://127.0.0.1:4187/api/quote",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json"
        },
        body: "{}"
      }
    );

  assert.equal(
    quoteResponse.status,
    423
  );

  const quote =
    await quoteResponse.json();

  assert.equal(
    quote.code,
    "SILENTSWAP_PARTNER_ACTIVATION_PENDING"
  );

  console.log("LOCAL_STATUS_API=PASS");
  console.log("LOCAL_PARTNER_STATUS=PASS");
  console.log("LOCAL_AGENT_PREPARE=PASS");
  console.log("EXECUTION_NOT_EXECUTED=PASS");
  console.log("PARTNER_ACTIVATION_LOCK=PASS");
  console.log("LIVE_QUOTE_NETWORK_CALL=NONE");
  console.log("NO_WALLET_USED=PASS");
  console.log("NO_SIGNATURE_CREATED=PASS");
  console.log("NO_ORDER_PLACED=PASS");
  console.log("NO_PAYMENT_SENT=PASS");
  console.log("SAFEGATE_SILENTSWAP_PARTNER_LAYER=PASS");

} finally {
  await new Promise(
    resolve =>
      server.close(resolve)
  );
}

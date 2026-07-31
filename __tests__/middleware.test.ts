import assert from "node:assert/strict";
import { describe, it } from "mocha";
import { requestAgent, requestApp } from "./helpers/app.js";
import { createClassicLink } from "./helpers/factories/url.js";

describe("middlewares.checkUrlOwnership", () => {
  it("returns 403 when an anonymous user does not own the URL", async () => {
    const owner = requestAgent();
    await owner.get("/auth/status");
    const { URLId } = await createClassicLink(owner);

    const stranger = requestAgent();
    await stranger.get("/auth/status");
    const res = await stranger.get(`/qr/${URLId}`);

    assert.strictEqual(res.statusCode, 403);
  });
});
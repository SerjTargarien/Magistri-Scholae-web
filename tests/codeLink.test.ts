// Invitation and reset links (src/account/SignIn.tsx): the code travels in the fragment.
import assert from "node:assert/strict";
import { test } from "node:test";
import { readCodeLink } from "../src/account/SignIn";

test("invitation and reset links open the right tab with the code", () => {
  assert.deepEqual(readCodeLink("#invitacion=AbC_12-x"), { mode: "register", code: "AbC_12-x" });
  assert.deepEqual(readCodeLink("#recuperacion=zZ9"), { mode: "reset", code: "zZ9" });
  for (const hash of ["", "#", "#invitacion=", "#invitacion=a b", "#otra=abc", "#invitacion=abc&x=1"])
    assert.equal(readCodeLink(hash), undefined, hash);
});

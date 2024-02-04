import { test } from "@core/fixtures";

test.describe("Update case automated", () => {
  test("@SB_TOOL_02 case automated", async ({ toolFixture }) => {
    await toolFixture.updateAutomated();
  });
});

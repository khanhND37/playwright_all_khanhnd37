import { expect, test } from "@core/fixtures";
import { OcgLogger } from "@core/logger";

test.describe("test logger", async () => {
  const logger = OcgLogger.get();
  test("should log out info", async () => {
    logger.info("test info");
    expect(1).toBe(1);
  });
  test("should log out error with stack trace", async () => {
    logger.error(new Error("this is an error"));
    expect(1).toBe(1);
  });
});

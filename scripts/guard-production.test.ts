import { describe, expect, it } from "vitest";
import { checkNotProduction } from "./guard-production";

/**
 * The demo account's password is in this repository, so this guard is the only
 * thing between a careless `pnpm db:seed:demo` and a published credential on a
 * live database. It is worth testing properly.
 */
describe("the production guard", () => {
  const NEON = "postgresql://u:p@ep-cool-name-pooler.ap-southeast-1.aws.neon.tech/derive";

  it("refuses when NODE_ENV says production, whatever the database is", () => {
    expect(checkNotProduction("production", "postgresql://u:p@localhost/derive").safe).toBe(false);
    expect(checkNotProduction("production", undefined).safe).toBe(false);
  });

  it("refuses a hostname that does not look like development", () => {
    const result = checkNotProduction("development", NEON);
    expect(result.safe).toBe(false);
    expect(result.safe === false && result.reason).toContain("neon.tech");
  });

  it("allows a local database", () => {
    for (const host of ["localhost", "127.0.0.1", "0.0.0.0"]) {
      expect(
        checkNotProduction("development", `postgresql://u:p@${host}:5432/derive`).safe,
        host,
      ).toBe(true);
    }
  });

  /**
   * A guard annoying enough to be disabled protects nothing, and keeping a
   * scratch branch on a hosted database is ordinary practice.
   */
  it("allows a hosted database that names itself a development one", () => {
    for (const host of [
      "ep-dev-branch.aws.neon.tech",
      "my-test-db.aws.neon.tech",
      "staging.example.com",
      "preview-x.aws.neon.tech",
    ]) {
      expect(
        checkNotProduction("development", `postgresql://u:p@${host}/derive`).safe,
        host,
      ).toBe(true);
    }
  });

  /**
   * "dev" inside a longer word is not a signal - `ep-devious-name` is as
   * likely to be a production branch as anything else. The word boundary is
   * load-bearing.
   */
  it("is not fooled by a hostname that merely contains the letters", () => {
    expect(
      checkNotProduction("development", "postgresql://u:p@ep-devious-prod.aws.neon.tech/d").safe,
    ).toBe(false);
    expect(
      checkNotProduction("development", "postgresql://u:p@contest-live.aws.neon.tech/d").safe,
    ).toBe(false);
  });

  it("refuses a URL it cannot parse rather than assuming the best", () => {
    expect(checkNotProduction("development", "not a url at all").safe).toBe(false);
  });

  it("allows an unset database, which can damage nothing", () => {
    expect(checkNotProduction("development", undefined).safe).toBe(true);
  });
});

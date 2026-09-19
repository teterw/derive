import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  /**
   * sharp is a native module. Bundling it breaks the platform-specific binary
   * resolution, which shows up only once deployed - locally the binary is
   * already unpacked in node_modules and everything works.
   */
  serverExternalPackages: ["sharp"],

  experimental: {
    serverActions: {
      /**
       * Server actions cap request bodies at **1MB** by default, and the
       * avatar form said it accepted 6. Every real phone photo therefore
       * failed inside the framework before any of our validation ran, so the
       * error said nothing useful and only appeared once someone tried a
       * photograph rather than a test file.
       *
       * The editor now downscales before uploading, so a real upload is a
       * couple of hundred kilobytes and never comes near this. It is raised
       * anyway as a floor, not as the plan: Vercel caps a serverless request
       * body at 4.5MB regardless, so nothing above that is deliverable however
       * this is set.
       */
      bodySizeLimit: "2mb",
    },
  },
};

export default withNextIntl(nextConfig);

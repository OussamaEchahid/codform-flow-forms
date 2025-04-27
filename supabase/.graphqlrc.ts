import { ApiType, shopifyApiProject, LATEST_API_VERSION } from "@shopify/api-codegen-preset";
import { IGraphQLConfig } from "graphql-config";
import { resolve } from "path";
import { fileURLToPath } from "url";
import fs from "fs";

function getConfig() {
  const config: IGraphQLConfig = {
    projects: {
      default: shopifyApiProject({
        apiType: ApiType.Admin,
        apiVersion: LATEST_API_VERSION,
        documents: ["./app/**/*.{js,ts,jsx,tsx}", "./app/.server/**/*.{js,ts,jsx,tsx}"],
        outputDir: "./app/types",
      }),
    },
  };

  let extensions: string[] = [];
  try {
    extensions = fs.readdirSync("./extensions");
  } catch {
    // ignore if no extensions
  }

  for (const entry of extensions) {
    const extensionPath = `./extensions/${entry}`;
    const schema = `${extensionPath}/schema.graphql`;
    if (!fs.existsSync(schema)) {
      continue;
    }
    config.projects[entry] = {
      schema,
      documents: [`${extensionPath}/**/*.graphql`],
    };
  }

  return config;
}

const config = getConfig();

export default config;

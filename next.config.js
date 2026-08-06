/** @type {import('next').NextConfig} */
const isGitHubPages = process.env.GITHUB_ACTIONS === "true";
const isStaticDocs = process.env.STATIC_DOCS === "true";

const nextConfig = {
  output: "export",
  basePath: isGitHubPages ? "/kerning-drill" : "",
  assetPrefix: isStaticDocs ? "/kerning-drill/assets" : isGitHubPages ? "/kerning-drill/" : "",
  trailingSlash: true,
};

module.exports = nextConfig;

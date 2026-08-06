/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath: process.env.GITHUB_ACTIONS === "true" ? "/kerning-drill" : "",
  assetPrefix: process.env.GITHUB_ACTIONS === "true" ? "/kerning-drill/" : "",
  trailingSlash: true,
};

module.exports = nextConfig;

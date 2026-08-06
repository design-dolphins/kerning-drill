const isGitHubPages = process.env.GITHUB_ACTIONS === "true";

module.exports = {
  output: "export",
  basePath: isGitHubPages ? "/kerning-drill" : "",
  assetPrefix: isGitHubPages ? "/kerning-drill/" : "",
  trailingSlash: true,
};

console.error(
  "Do not pack the source checkout. Run npm run build, then npm pack ./pkg (or use npm run pack:release).",
);
process.exitCode = 1;

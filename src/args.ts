export function getProgramArgs() {
  // Skip the first two arguments (node and script path)
  const args = process.argv.slice(2);

  const pluginIdIndex = args.indexOf("--plugin-id");
  const connectUrlIndex = args.indexOf("--connect-url");

  if (pluginIdIndex === -1) throw new Error("missing plugin id");
  if (connectUrlIndex === -1) throw new Error("missing connect url");

  const pluginId = args[pluginIdIndex + 1];
  const connectUrl = args[connectUrlIndex + 1];

  return { pluginId, connectUrl };
}

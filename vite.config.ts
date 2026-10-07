import vinext from "vinext";
import { defineConfig } from "vite";
import "./scripts/runtime-env.mjs";
export default defineConfig(async () => {
 const { cloudflare } = await import("@cloudflare/vite-plugin");
 return { server:{host:"127.0.0.1"}, plugins:[vinext(),cloudflare({configPath:"wrangler.json",viteEnvironment:{name:"rsc",childEnvironments:["ssr"]},inspectorPort:false})] };
});

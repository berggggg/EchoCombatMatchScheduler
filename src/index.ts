import { client } from "./discord/client.js";
import { env } from "./config/env.js";

await client.login(env.DISCORD_TOKEN);

-- Add configurable event title emoji for guild-specific scheduler messages.
ALTER TABLE "GuildConfig" ADD COLUMN "eventEmoji" TEXT DEFAULT '<:echothinking:1523785136632496168>';

import { z } from 'zod';

const configSchema = z.object({
  anthropic: z.object({
    apiKey: z.string().min(1),
  }),
  discord: z.object({
    botToken: z.string().optional(),
    clientId: z.string().optional(),
  }),
  apis: z.object({
    messariApiKey: z.string().optional(),
    cryptoRankApiKey: z.string().optional(),
    coinMarketCapApiKey: z.string().optional(),
    githubToken: z.string().optional(),
  }),
  redis: z.object({
    url: z.string().default('redis://localhost:6379'),
    enabled: z.boolean().default(false),
  }),
  cache: z.object({
    ttlSeconds: z.number().default(3600),
  }),
});

export type Config = z.infer<typeof configSchema>;

export function loadConfig(): Config {
  const config = {
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    },
    discord: {
      botToken: process.env.DISCORD_BOT_TOKEN || '',
      clientId: process.env.DISCORD_CLIENT_ID || '',
    },
    apis: {
      messariApiKey: process.env.MESSARI_API_KEY,
      cryptoRankApiKey: process.env.CRYPTORANK_API_KEY,
      coinMarketCapApiKey: process.env.COINMARKETCAP_API_KEY,
      githubToken: process.env.GITHUB_TOKEN,
    },
    redis: {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      enabled: process.env.REDIS_ENABLED === 'true',
    },
    cache: {
      ttlSeconds: parseInt(process.env.CACHE_TTL_SECONDS || '3600'),
    },
  };

  return configSchema.parse(config);
}

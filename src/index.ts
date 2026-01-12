import 'dotenv/config';
import { loadConfig } from './config';
import { createContainer } from './container';

async function main(): Promise<void> {
  console.log('Alpha Screener starting...');

  const config = loadConfig();
  const container = createContainer(config);

  process.on('SIGINT', async () => {
    console.log('Shutting down...');
    await container.discordBot.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('Shutting down...');
    await container.discordBot.stop();
    process.exit(0);
  });

  await container.discordBot.start();

  console.log('Alpha Screener is running');
  console.log('Discord bot ready for /analyze commands');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

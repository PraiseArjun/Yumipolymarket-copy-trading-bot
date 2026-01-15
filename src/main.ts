/**
 * Application Entry Point
 * This file is executed when running the bot directly
 */

import 'dotenv/config';
import { main } from './core/cli';

main().catch((error: unknown) => {
  // eslint-disable-next-line no-console
  console.error('❌ Fatal error:', error);
  process.exit(1);
});


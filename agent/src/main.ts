import os from 'node:os';
import pino from 'pino';
import { agentConfig } from './config/index.js';
import { AgentCommunication } from './communication/index.js';

const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: { colorize: true, ignore: 'pid,hostname', translateTime: 'SYS:standard' },
  },
});

async function main() {
  logger.info('=============================================');
  logger.info('      RemoteDesk Windows Agent v' + agentConfig.AGENT_VERSION);
  logger.info('=============================================');
  logger.info({
    hostname: os.hostname(),
    platform: os.platform(),
    release: os.release(),
    arch: os.arch(),
    serverUrl: agentConfig.AGENT_API_URL,
    permittedRoots: agentConfig.permittedRootsList,
  }, 'Agent starting up...');

  const comms = new AgentCommunication();
  comms.start();

  const shutdown = () => {
    logger.info('Shutdown requested. Gracefully stopping agent...');
    comms.stop();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch(err => {
  logger.fatal({ err }, 'Fatal error starting agent');
  process.exit(1);
});

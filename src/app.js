import PollBot from './PollBot.js';
import { log } from './utils.js';

async function main() {
    const bot = new PollBot();

    try {
        await log('Starting Session...');
        await bot.init();
        await bot.login();
        await bot.answerPoll();
    } catch (e) {
        log(`${e.name}: ${e.message}\n`);
    } finally {
        await bot.browser.close();
        await log('Session is over. Shutting down bot...\n\n\n');
    }
}

main();
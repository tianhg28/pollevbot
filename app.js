import PollBot from './PollBot.js';
import { log } from './utils.js';

async function main() {
    const bot = new PollBot();

    try {
        await bot.init();
        // await bot.uwLogin();
        await bot.answerPoll();
    } catch (e) {
        log(`${e.name}: ${e.message}`);
    }

    await log('Session is over. Shutting down bot...\n\n\n');
}

main();
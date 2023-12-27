import PollBot from './PollBot.js';
import { log } from './utils.js';

async function main() {
    const bot = new PollBot();

    try {
        await bot.init();
        await bot.login();
    } catch (e) {
        console.log(`${e.name}: ${e.message}\n`);
    } finally {
        await bot.browser.close();
    }
}

main();
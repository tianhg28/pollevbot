
# PollevBot

## Overview

PollevBot is an automated bot designed to interact with polls on [pollev.com](https://pollev.com/). It connects to the host, waits for a poll to open, and then selects random answer choices for various types of polls. Most poll types are supported. The bot runs for a specified amounts of minutes and can be configured to operate on a customized schedule using system schedulers or through delopying to heroku.

## Prerequisites

- **Node.js**: Version 21.1.0 or higher. You can download it from [Node.js official website](https://nodejs.org/).

## Installation

1. **Download the Repository:**
   - Above the list of files, click the green **Code** button.
   - Click **Download ZIP**.
   - Save the ZIP file to your computer and extract it to a directory where you want to work with the `pollevbot`.

2. **Navigate to the bot directory:**

   ```bash
   cd pollev-bot
   ```

3. **Install dependencies:**

   ```bash
   npm install
   ```

## Configuration

Modify the `config.js` file to suit your needs. The following settings are available:

- **scheduleName**: Name of the schedule or class you're attending (e.g., "Math101").
- **hostname**: The unique Poll Everywhere URL you're connecting to (e.g., "https://pollev.com/hostname").
- **loginType**: The type of login you're using. (e.g. "uw" and "general", but feel free to add support for more)
- **minutes**: The duration in minutes for which the bot should run.
- **logFile**: The path to the file where logs should be saved (e.g., "./log.txt").
- **cookieFile**: The path to the file where cookies are stored (e.g., "./cookies.json").

## Usage

1. **Running the bot:**

   ```bash
   node app.js
   ```

   This command starts the bot. It logs in automatically using cookies. If the cookies are invalid or expired, it will prompt you to log in.

2. **Running the login script separately:**

   ```bash
   node login.js
   ```

   Use this if you would like to log in separately and start the bot using cron.

## Logs and Cookies

- **Logs**: The bot's activities are logged into the `log.txt` file (or whatever path you specify in `config.js`). This includes actions taken, any errors encountered, and other runtime information.
- **Cookies**: `cookies.txt` contains cookies used for logging in. The program saves the cookie after login, and if the cookies are invalid, it will prompt you to log in again.

## Scheduling with Crontab (Unix Systems)

To schedule the bot to run at specific times, you can use Crontab on Unix-based systems:

1. Open the crontab editor:

   ```bash
   crontab -e
   ```

2. Add a new line for the bot using the standard crontab syntax:

   ```bash
   * * * * *  command_to_execute
   ┬ ┬ ┬ ┬ ┬
   │ │ │ │ │
   │ │ │ │ │
   │ │ │ │ └───── day of the week (0 - 7) (Sunday to Saturday, 7 is also Sunday)
   │ │ │ └────────── month (1 - 12)
   │ │ └─────────────── day of the month (1 - 31)
   │ └──────────────────── hour (0 - 23)
   └───────────────────────── min (0 - 59)
   ```

   ```bash
   30 15 * * * /usr/bin/node /path/to/pollev-bot/app.js
   ```
   
   This example runs the bot every day at 15:30. Adjust the timing to your preference. Replace the paths with the correct paths to your Node.js installation and the app.js file.

      

3. Save and close the editor to start the scheduled task.

## Troubleshooting & Notes

- Ensure you have the correct version of Node.js installed.
- If you encounter permission issues, especially with cron jobs, ensure that the scripts have executable permissions and the paths are correct.
- If the bot isn't behaving as expected, check the log file for any errors or messages that might indicate what's going wrong.

## Dependencies

PollevBot relies on several npm packages, including:

- **puppeteer**
- **readline**
- **set-cookie-parser**

All dependencies will be installed via `npm install`.

## Contributing

Contributions to PollevBot are welcome!

## License

MIT

---

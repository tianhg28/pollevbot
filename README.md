
# PollevBot

## Overview

PollevBot is an automated bot designed to interact with polls on [pollev.com](https://pollev.com/). It connects to the host, waits for a poll to open, and then selects random answer choices for most poll types. The bot runs for a certain number of minutes and can be configured to operate on a customized schedule using system schedulers or through delopying to heroku. Currently the bot mainly supports login through the with University of Washington SAML process.

## Disclaimer

This project is for educational purposes only and is not intended to be used for any sort of academic misconduct and related applications. The main purpose of this project is to explore the concepts of automation and security, and to gain hands-on experience with various technologies involved in automation and security. The author of this project is not responsible for any liabilities or damages that may arise from any use or misuse of this project.

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

Modify the `src/config.js` file to suit your needs. The following settings are available:

- **scheduleName**: Name of the schedule or class you're attending (e.g., "Math101").
- **hostname**: The unique Poll Everywhere URL you're connecting to (e.g., "https://pollev.com/hostname").
- **loginType**: The type of login you're using. (e.g. "uw" for University of Washington login and "general")
- **minutes**: The duration in minutes for which the bot should run.
- **cookieFile**: The path to the file where cookies are stored (e.g., "./cookies.json").

## Usage

1. **Running the bot:**

   ```bash
   node src/app.js
   ```

   This command starts the bot. It logs in automatically using cookies. If the cookies are invalid or expired, it will prompt you to log in.

2. **Running the login script separately:**

   ```bash
   node src/login.js
   ```

   Use this if you would like to log in separately and start the bot using cron.

## Logs and Cookies

- **Logs**: The bot's activities are logged in the `logs` directory, where the log file name is the current date. This includes the bot's actions and any errors that occur.
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
- **puppeteer**
- **readline**
- **set-cookie-parser**

## Contributing

Contributions are welcome.

## License

MIT License

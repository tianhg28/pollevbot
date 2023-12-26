import puppeteer from 'puppeteer';
import { promises as fs } from 'fs';
import readline from 'readline/promises';
import { log } from './utils.js';
import config from './config.js';

class PollevBot {
   constructor() {
    this.hostname = config.hostname;
    this.logFile = config.logFile;
    this.cookieFile = config.cookieFile;
    this.minutes = config.minutes
  }

  async init() {
    // headless as false for debugging mode
    this.browser = await puppeteer.launch({ headless: false});
    this.page = await this.browser.newPage();
    this.startTime = Date.now();
    this.endTime = this.startTime + this.minutes * 60 * 1000;
    console.log(this.startTime, this.endTime);
  }

  async answerPoll() {
    // Loads cookies if present, otherwise prompts user for login credentials
    await log('Starting Session...');
    await log('Logging in using stored cookies... ');
    const successful = await this.loadCookies(config.cookieFile);
    if (!successful) {
      await log("Cookies do not exist or is invalid. Please login with UW credentials.\n");
      await log(" -- Note 2FA is required so have your device for push notification.\n")
      await this.uwLogin();
    } else {
      await log("Successful login using cookies!");
    }
    
    // Nagivate to poll page
    await Promise.all([
      this.page.waitForNavigation(),
      this.page.goto(this.hostname),
    ]);

    await log('Connected to host! Starting to answer polls...\n');

    while (Date.now() < this.endTime) {
      console.log(Date.now());
      // Wait for response component to load
      try {
        await this.page.waitForSelector('div.component-response-activity', {
          visible: true,
          timeout: 30000,
        });
        // Waits between 3-6 seconds for page to load and to simulate human response time
        await this.page.waitForTimeout(3000 + Math.floor(Math.random() * 3000));
      } catch (e) {
        await log('Poll has not started, trying again...');
        continue;
      }

      try {
        // Gets class indicator of filled response
        let filledAlready = await this.page.$eval('div.component-response-activity',  parent => {
          const child = parent.querySelector('div');
          return child ? '.' + child.className : null;
        });
        filledAlready = filledAlready.split(' ')[0] + '--undoable';

        // Clicks on an option if none are selected
        if (! await this.page.$(filledAlready)) {
          const activityType = await this.page.$eval('div.component-response-activity', el => el.getAttribute('data-activity-type'));
          await this.fillResponse(activityType);

          await this.page.waitForSelector(filledAlready);
          await log('Submitted resopnse! Waiting for next question...\n');
        } else {
          await log('An option is already selected. Waiting for next question...\n');
        }
        
        // Waits for the next question to appear
        console.log((this.endTime - Date.now() + 1000)/1000);
        try {
          await this.page.waitForSelector(filledAlready, {
            hidden: true,
            // TODO: calculate end - current + 1 sec time to wait
            timeout: this.endTime - Date.now() + 1000,
          });
        } catch (e) {
          if (e.name !== 'TimeoutError') {
             throw e;
          }
        }
      } catch (e) {
        console.log(e);
        await log('An error has occured, moving on to next question.')
        continue;
      }
    }
  }

  async fillResponse(activityType) {
    await log('Type: ' + activityType);
    switch (activityType) {
      case 'multiple_choice_poll':
        const options = await this.page.$$('button.component-response-multiple-choice__option__vote');
        const selected = options[Math.floor(Math.random() * options.length)];
        await selected.click();

        const title = await this.page.$eval('.component-response-header__title', el => el.textContent);
        const answer = await selected.$eval('.component-response-multiple-choice__option__value', el =>el.innerText);
        await log('Question: ' + title);
        await log('Option Selected: ' + answer);
        break;
      case 'free_text_poll':
        await log('text');
        break;
      default:
        await log('Poll type not supported.');
    }
  }

  async uwLogin() {
    // Extracts login credentials from user
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    const user = await rl.question('Username: ');
    const pass = await rl.question('Password: ');

    await log('Logging in using UW NetID...');

    // SAML login
    this.page = await this.browser.newPage();
    await this.page.goto('https://www.polleverywhere.com/auth/washington?');
    await this.page.waitForTimeout(1000);
    await this.page.type('#weblogin_netid', user);
    await this.page.type('#weblogin_password', pass);

    // Submit
    await Promise.all([
      this.page.waitForNavigation(),
      this.page.click('#submit_button')
    ]);

    const loginFailedText = await this.page.evaluate(() => {
      return document.body.innerText.includes('Your sign-in failed. Please try again.');
    });

    if (loginFailedText) {
      throw new Error('Login failed. Please check your credentials and try again.');
    }

    // Wait for duo iframe to load
    const iframeElement = await this.page.waitForSelector('#duo_iframe');
    const iframe = await iframeElement.contentFrame();
    await iframe.waitForSelector('button.auth-button.positive');
    await this.page.waitForTimeout(1000); // wait to pass bot detection

    // Sends push to user and waits for 2FA
    await log('Sending push notification to device, please approve on your device.');
    await Promise.all([
      this.page.waitForNavigation(), 
      iframe.evaluate(() => document.querySelector('button').click()),
    ]);
    await this.page.waitForNavigation({ waitUntil: 'networkidle2' });
    await log('Successfully logged in!\n');

    // Saves cookie for future logins so no need for 2FA
    await log('Saving Cookies for future logins...');
    await this.saveCookies('cookies.json');
    await log('Cookies saved!\n');
  }

  async saveCookies(fileName) {
    const cookies = await this.page.cookies();
    await fs.writeFile(fileName, JSON.stringify(cookies, null, 2));
  }

  async loadCookies(fileName) {
    // If cookies do not exist, create empty file
    try {
      await fs.stat(fileName);
    } catch (e) {
      await fs.writeFile(fileName, '');
      return false;
    }

    const cookiesString = await fs.readFile(fileName);
    if (cookiesString.length === 0) {
      return false;
    }
    const cookies = JSON.parse(cookiesString);
    await this.page.setCookie(...cookies);
    const responses = await Promise.all([
      this.page.waitForNavigation(),
      this.page.goto(this.hostname),
    ]);

    if (responses[1].status() < 200 || responses[1].status() >= 300) {
      throw new Error('Host name is not valid! Please fix and try again!')
    }

    return true;
  }
}

export default PollevBot;



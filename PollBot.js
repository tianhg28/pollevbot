import puppeteer from 'puppeteer';
import { promises as fs } from 'fs';
import readline from 'readline/promises';
import { log } from './utils.js';
import config from './config.js';

class PollevBot {
   constructor() {
    this.hostname = config.hostname;
    this.cookieFile = config.cookieFile;
    this.minutes = config.minutes
  }

  async init() {
    // headless as false for debugging mode
    this.browser = await puppeteer.launch({ headless: false});
    this.page = await this.browser.newPage();
    this.startTime = Date.now();
    this.endTime = this.startTime + this.minutes * 60 * 1000;
  }

  async answerPoll() {
    // Nagivate to poll page
    await Promise.all([
      this.page.waitForNavigation(),
      this.page.goto(this.hostname),
    ]);

    await log('Connected to host! Starting to answer polls...\n');

    while (Date.now() < this.endTime) {
      // Checks if pollev prompts for username and if so skips it
      await this.page.waitForTimeout(2000);
      const skipButton = await this.page.$('button.pe-button__button[aria-label="Skip"]');
      if (skipButton) {
        await this.page.click('button.pe-button__button[aria-label="Skip"]');
      }

      // Wait for response component to load and then wait a bit more to simulate human response time
      try {
        await this.page.waitForSelector('div.component-response-activity', {
          visible: true,
          timeout: 30000,
        });
        await this.page.waitForTimeout(3000 + Math.floor(Math.random() * 3000));
      } catch (e) {
        await log('Poll has not started, trying again...');
        continue;
      }

      // Checks if an option is already selected
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
        await log('Submitted response! Waiting for next question...\n');
      } else {
        await log('An option is already selected. Waiting for next question...\n');
      }
      
      // Waits for the next question to appear;
      try {
        await this.page.waitForSelector(filledAlready, {
          hidden: true,
          timeout: this.endTime - Date.now() + 1000,
        });
      } catch (e) {
        if (e.name !== 'TimeoutError') {
            throw e;
        }
      }
    }
  }

  async fillResponse(activityType) {
    const title = await this.page.$eval('.component-response-header__title', el => el.textContent);
    await log('Type: ' + activityType);
    await log('Question: ' + title);

    // TODO: Add support for more poll question types here
    switch (activityType) {
      case 'multiple_choice_poll':
        const options = await this.page.$$('button.component-response-multiple-choice__option__vote');
        const selected = options[Math.floor(Math.random() * options.length)];
        const answer = await selected.$eval('.component-response-multiple-choice__option__value', el =>el.innerText);
        await selected.click();
        await log('Option Selected: ' + answer);
        break;

      case 'free_text_poll':
        this.page.type('textarea[name="response"]', 'idk');
        await this.page.click('input[type="submit"]');
        await log('Response: idk');
        break;

      case 'clickable_image':
        await this.page.click('img.component-response-clickable-image__image');
        await log('Image clicked!');
        break;

      case 'ranking_poll':
        //<button type="submit">Submit response</button>
        await this.page.click('button[type="submit"]')
        await log('Default ranking submitted!');
        break;
        
      default:
        throw new Error('Unsupported poll type: ' + activityType);
    }
  }

  async login() {
    console.log('Logging in using stored cookies...\n');

    // Loads cookies if present, otherwise prompts user for login credentials
    const successful = await this.loadCookies(config.cookieFile);

    if (!successful) {
      if (process.stdin.isTTY) {
        // Add support for other login types here
        switch(config.loginType) {
          case 'uw':
            await this.uwLogin();
            break;
          case 'general':
            await this.generalLogin();
            break;
          default:
            await this.generalLogin();
        }
      } else {
        throw new Error('Cookies do not exist or is invalid. Please login again through the terminal.');
      }
    } else {
      console.log("Successful login using cookies!\n");
    }
  }

  async uwLogin() {
    console.log("Cookies do not exist or is invalid. Please login with UW credentials.");
    console.log(" -- Note 2FA is required so have your device to accept push notification.\n")

    // Extracts login credentials from user
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    const user = await rl.question('Username: ');
    const pass = await rl.question('Password: ');
    rl.close();
    console.log('\nLogging in using UW NetID...');

    // SAML login
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
    console.log('Sending push notification to device, please approve on your device.');
    await Promise.all([
      this.page.waitForNavigation(), 
      iframe.evaluate(() => document.querySelector('button').click()),
    ]);
    await this.page.waitForNavigation({ waitUntil: 'networkidle2' });
    console.log('Successfully logged in!\n');

    // Saves cookie for future logins so no need for 2FA
    console.log('Saving Cookies for future logins...');
    await this.saveCookies('cookies.json');
    console.log('Cookies saved!\n');
  }

  async generalLogin() {
    console.log("Cookies do not exist or is invalid. Please login with email/username and password.\n");

    // Extracts login credentials from user
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    const user = await rl.question('Email or Username: ');
    const pass = await rl.question('Password: ');
    rl.close();

    console.log('\nLogging in using email and password...');

    await this.page.goto('https://id.polleverywhere.com/login?reason=&usrc=mobile_web_login');
    await this.page.waitForTimeout(1000);
    await this.page.type('#username', user);
    await this.page.click('button.mdc-button')
    await this.page.waitForSelector('#password');
    await this.page.type('#password', pass);

    await Promise.all([
      this.page.waitForNavigation(),
      this.page.click('button.mdc-button')
    ]);

    console.log('Successfully logged in!\n');

    // Saves cookie for future logins so no need for 2FA
    console.log('Saving Cookies for future logins...');
    await this.saveCookies('cookies.json');
    console.log('Cookies saved!\n');
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



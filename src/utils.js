import { promises as fs } from 'fs';

async function log(message) {
    // make the file name a month-date-year format'
    let date = new Date();
    let month = date.getMonth() + 1;
    let day = date.getDate();
    let year = date.getFullYear();
    let fileName = `./logs/${month}-${day}-${year}.txt`;
    console.log(`${getTime24H()} - ${message}`);
    await fs.writeFile(fileName, `${getTime24H()} - ${message}\n`, {flag: 'a'});
}

function getTime24H() {
    let currentDate = new Date();

    // Get hours, minutes, and seconds from the Date object
    let hours = currentDate.getHours(); // Hours are in 24-hour format
    let minutes = currentDate.getMinutes();
    let seconds = currentDate.getSeconds();

    // Pad single digits with a leading zero for a consistent format
    hours = hours.toString().padStart(2, '0');
    minutes = minutes.toString().padStart(2, '0');
    seconds = seconds.toString().padStart(2, '0');

    // Combine the components into a single string
    return hours + ":" + minutes + ":" + seconds;
}

export { log, getTime24H };
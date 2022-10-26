const puppeteer = require("puppeteer-extra");
const fs = require("fs");
// const books_data = require("./data/combined.json");
const unique_authors = require("./data/unique_authors.json");

const userAgent = require("user-agents");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

let scrape = async () => {
    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 10,
    });

    const page = await browser.newPage();
    await page.setUserAgent(userAgent.random().toString());

    const authors_data = [];

    for (let i = 0; i < unique_authors.length; i++) {
        const author = unique_authors[i];
        const data = await getAuthorInfo(page, author);
        authors_data.push(data);
    }

    await browser.close();
    return authors_data;
};

const getAuthorInfo = async (page, author) => {
    try {
        await page.goto("https://www.yahoo.com/");

        // let inputHandle = await page.waitForXPath("//input[@name = 'q']");
        let inputHandle = await page.waitForXPath("//input[@name = 'p']");
        await inputHandle.type(`${author} site:linkedin.com`, {
            delay: 0,
        });
        await page.keyboard.press("Enter");

        // yahoo: _yb_3r16d, name='p' not
        // yahoo: id='ybar-sbq' name='p'
        await page.waitForNavigation();
        const linkedin = await page.evaluate(async () => {
            const element = document.querySelector("div#web > ol > li.first > div > div.compTitle.options-toggle > h3 > a");
            console.log(element);

            return element?.href;
        });

        await page.goto("https://www.yahoo.com/");
        // inputHandle = await page.waitForXPath("//input[@name = 'q']");
        inputHandle = await page.waitForXPath("//input[@name = 'p']");

        await inputHandle.type(`${author} site:goodreads.com/author/show`, {
            delay: 0,
        });
        await page.keyboard.press("Enter");
        await page.waitForNavigation();

        const authorPage = await page.evaluate(async () => {
            const element = document.querySelector("div#web > ol > li.first > div > div.compTitle.options-toggle > h3 > a");
            return element?.href;
        });

        const data = {
            name: author,
            linkedin,
            authorPage: authorPage,
        };
        return data;
    } catch (e) {
        console.log(e);
    }
};

scrape().then((value) => {
    console.log(value);

    fs.writeFileSync(
        "./data/authors_data.json",
        JSON.stringify(value),
        (err) => (err ? console.log(err) : null)
    );
});

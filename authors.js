const puppeteer = require("puppeteer-extra");
const fs = require("fs");
const books_data = require("./data/combined.json");

const userAgent = require("user-agents");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

let scrape = async () => {
    const browser = await puppeteer.launch({
        headless: true,
        slowMo: 10,
    });

    const page = await browser.newPage();
    await page.setUserAgent(userAgent.random().toString());
    // await page.goto("https://www.google.com");

    // for (let i = 0; i < books_data.length; i++) {

    const authors_data = [];
    for (let i = 0; i < 4; i++) {
        const book = books_data[i];

        for (const author of book.authors) {
            let seen = false;

            authors_data.forEach((item) => {
                if (item.name === author.name) {
                    seen = true;
                    console.log(author.name);
                    return;
                }
            });

            if (!seen) {
                const data = await getAuthorInfo(page, author);
                authors_data.push(data);
            }
        }
    }

    await browser.close();
    return authors_data;
};

const getAuthorInfo = async (page, author) => {
    try {
        await page.goto("https://www.google.com");

        let inputHandle = await page.waitForXPath("//input[@name = 'q']");
        await inputHandle.type(`${author.name} site:linkedin.com`, {
            delay: 0,
        });
        await page.keyboard.press("Enter");

        // yahoo: _yb_3r16d, name='p'
        await page.waitForNavigation();
        const linkedin = await page.evaluate(async () => {
            const element = document.querySelector("div.yuRUbf > a");
            // console.log(element);

            return element?.href;
        });

        await page.goto("https://www.google.com");
        inputHandle = await page.waitForXPath("//input[@name = 'q']");

        await inputHandle.type(
            `${author.name} site:goodreads.com/author/show`,
            {
                delay: 0,
            }
        );
        await page.keyboard.press("Enter");
        await page.waitForNavigation();

        const authorPage = await page.evaluate(async () => {
            const element = document.querySelector("div.yuRUbf > a");
            return element?.href;
        });

        const data = {
            name: author.name,
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

    // fs.writeFileSync("./data/authors_test.json", JSON.stringify(value), (err) =>
    //     err ? console.log(err) : null
    // );
});

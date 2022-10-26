const puppeteer = require("puppeteer-extra");
const fs = require("fs");
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
    await page.goto("https://www.bing.com/", { waitUntil: "load" });
	await page.waitForTimeout(5000);

    const authors_data = [];

    for (let i = 1406; i < unique_authors.length; i++) {
        const author = unique_authors[i];
        const data = await getAuthorInfo(page, author);
        authors_data.push(data);
    }

    await browser.close();
    return authors_data;
};

const getAuthorInfo = async (page, author) => {
    try {
        // author's linkedin page
        let inputHandle = await page.waitForXPath("//input[@name = 'q']");

        await inputHandle.click({ clickCount: 3 });
        await inputHandle.type(`${author} site:linkedin.com`, { delay: 12 });
        await page.keyboard.press("Enter");

        await page.waitForNavigation();
        const linkedin = await page.evaluate(async () => {
            let node = document.querySelector("ol#b_results > li");
            let element = node.querySelector("a");
            return element?.href;
        });

        // author's goodreads page
        inputHandle = await page.waitForXPath("//input[@name = 'q']");

        await inputHandle.click({ clickCount: 3 });

        await inputHandle.type(`${author} site:goodreads.com/author/show`, {
            delay: 2,
        });
        await page.keyboard.press("Enter");
        await page.waitForNavigation();

        const authorPage = await page.evaluate(async () => {
            // let element = document.querySelector("ol#b_results > li.b_algo > div.b_title > h2 > a");
            // if (!element) {
            // 	element = document.querySelector("ol#b_results > li.b_algo > h2 > a");
            // 	if (!element) {
            // 		element = document.querySelector("ol#b_results > li > div.b_algo_group > h2 > a")
            // 	}
            // }
            let node = document.querySelector("ol#b_results > li");
            let element = node.querySelector("a");
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
        "./data/authors_data_from_1407.json",
        JSON.stringify(value),
        (err) => (err ? console.log(err) : null)
    );
});

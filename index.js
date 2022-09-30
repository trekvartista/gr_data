const puppeteer = require("puppeteer-extra");
const fs = require("fs");

const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

const BOOKS_URL = "https://www.goodreads.com/shelf/show/business";

let scrape = async () => {
    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 10,
    });

    const page2 = await browser.newPage();
    await page2.setDefaultNavigationTimeout(0);

    let results = await getInfo(page2, BOOKS_URL);
    await browser.close();
    return results;
};

const getInfo = async (page, url) => {

    try {
        await page.goto(url, { waitUntil: "load" });
        const data = page.evaluate(async () => {
            const books = document.querySelectorAll(
                "div.leftContainer > .elementList"
            );

            let books_data = [];

            for (let book of books) {
                const title =
                    book.querySelector("div.left > a.bookTitle")?.innerText ||
                    "";
                const author =
                    book.querySelector(
                        "span[itemprop=author] > div.authorName__container > a.authorName > span[itemprop=name]"
                    )?.innerText || "";
                //avg rating 4.18 — 292,224 ratings — published 2014
                const rating =
                    book
                        .querySelector("div.left > span.greyText.smallText")
                        ?.innerText.substring(11, 15) || "";
                const publicationYear =
                    book
                        .querySelector("div.left > span.greyText.smallText")
                        ?.innerText.substring(46) || "";

                let bookData = {
                    title,
                    author,
                    rating,
                    publicationYear,
                };
                books_data.push(bookData);
            }
            return books_data;
        });
        return data;
    } catch (e) {
        console.log(e);
    }
};

scrape().then((value) => {
    console.log(value);

    fs.writeFileSync("./data/data.json", JSON.stringify(value), (err) =>
        err ? console.log(err) : null
    );
});

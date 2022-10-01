const puppeteer = require("puppeteer-extra");
const fs = require("fs");

const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

const BOOKS_URL = "https://www.goodreads.com/shelf/show/business?page=";

let scrape = async () => {
    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 10,
    });

    const loginPage = await browser.newPage();

    await loginPage.goto(
        "https://www.goodreads.com/ap/signin?language=en_US&openid.assoc_handle=amzn_goodreads_web_na&openid.claimed_id=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.identity=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.mode=checkid_setup&openid.ns=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0&openid.pape.max_auth_age=0&openid.return_to=https%3A%2F%2Fwww.goodreads.com%2Fap-handler%2Fsign-in&siteState=840a35a22e4f01907a0bcf4a9b0cc826"
    );
    await loginPage.waitForTimeout(2000);
    await loginPage.waitForSelector("input");
    await loginPage.type("input[name=email]", "defaultCore496r@hotmail.com");

    await loginPage.type("input[name=password]", "passwordSwordFish");
    await loginPage.waitForTimeout(2000);
    await loginPage.keyboard.press(String.fromCharCode(13));

    await loginPage.waitForNavigation({
        waitUntil: "load",
    });

    const page2 = await browser.newPage();
    await page2.setDefaultNavigationTimeout(0);

    let results = [];

    for (let i = 1; i <= 100; i++) {
        results = results.concat(await getInfo(page2, BOOKS_URL + i));
    }

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

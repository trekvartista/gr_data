const puppeteer = require("puppeteer-extra");
const fs = require("fs");
const books_data = require("./data/startup.json");

const userAgent = require('user-agents');
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

let scrape = async () => {
    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 10,
    });
	
	const page = await browser.newPage();
	await page.setUserAgent(userAgent.random().toString());
	// await page.goto("https://www.google.com");

	// for (let i = 0; i < books_data.length; i++) {

	const authors_data = [];
	for (let i = 0; i < 4; i++) {
		const book = books_data[i];
		try {
			
			const book_authors_data = [];
			for (const author of book.authors) {
				// console.log(`${author.name}, `)
			
				await page.goto("https://www.google.com");
				
				const inputHandle = await page.waitForXPath("//input[@name = 'q']");
				await inputHandle.type(`${author.name} site:linkedin.com`, { delay: 0 });
				await page.keyboard.press("Enter");
				// const element = await page.waitForSelector("div.yuRUbf > a");
				await page.waitForNavigation();
				const link = await page.evaluate(async () => {
					const element = document.querySelector("div.yuRUbf > a");
					// console.log(element);

					return element?.href;
				})
				authors_data.push(link);
			}
		} catch (e) {
			console.log(e);
		}
	}

	// await browser.close();
	return authors_data;
};

scrape().then((value) => {
    console.log(value);

    // fs.writeFileSync(
    //     "authors.json",
    //     JSON.stringify(value),
    //     (err) => (err ? console.log(err) : null)
    // );
});

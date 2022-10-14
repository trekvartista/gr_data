const puppeteer = require("puppeteer-extra");
const fs = require("fs");

const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

const BOOKS_URL = "https://www.goodreads.com/shelf/show/startup?page=";

let scrape = async () => {
    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 10,
    });

    const loginPage = await browser.newPage();

    await loginPage.goto(
        "https://www.goodreads.com/ap/signin?language=en_US&openid.assoc_handle=amzn_goodreads_web_na&openid.claimed_id=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.identity=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.mode=checkid_setup&openid.ns=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0&openid.pape.max_auth_age=0&openid.return_to=https%3A%2F%2Fwww.goodreads.com%2Fap-handler%2Fsign-in&siteState=840a35a22e4f01907a0bcf4a9b0cc826"
    );
    await loginPage.waitForTimeout(1000);
    await loginPage.waitForSelector("input");
    await loginPage.type("input[name=email]", "defaultCore496r@hotmail.com");

    await loginPage.type("input[name=password]", "passwordSwordFish");
    await loginPage.waitForTimeout(1000);
    await loginPage.keyboard.press(String.fromCharCode(13));

    await loginPage.waitForNavigation({
        waitUntil: "load",
    });

    const page2 = await browser.newPage();
    await page2.setDefaultNavigationTimeout(0);

    let results = [];

    for (let i = 1; i <= 1; i++) {
        results = results.concat(
            await getInfo(page2, BOOKS_URL + JSON.stringify(i))
        );
    }

    await browser.close();
    return results;
};

const getInfo = async (page, url) => {
    try {
        await page.goto(url, { waitUntil: "load" });

        const data = await page.evaluate(async () => {
            let urls_data = [];
            const urls = document.querySelectorAll("a.bookTitle");

            for (let a of urls) {
                urls_data.push(a.href);
            }
            return urls_data;
        });
		let books_data = [];
        // for (let title_url of data) {
		for (let i = 0; i <= 10; i++) {
			const title_url = data[i];
            await page.goto(title_url, { waitUntil: "load" });

            const book_data = await page.evaluate(async () => {
                const title = document.querySelector("#bookTitle")?.innerText || document.querySelector("h1.Text.Text__title1")?.innerText;
				let authorsNames = document.querySelectorAll("#bookAuthors > span[itemprop='author'] > div.authorName__container > a.authorName");

				if (authorsNames.length === 0) {
					authorsNames = document.querySelectorAll("div.ContributorLinksList > span > a.ContributorLink > .ContributorLink__name");
				}

				let authors = [];
				for (let author of Array.from(authorsNames)) {

					const name = author.innerText;
					const pageLink = author.href;
					let authorData = {
						name,
						pageLink
					}
					authors.push(authorData);
				}
                const description = document.querySelector(".readable.stacked > span[style='display:none']")?.innerHTML || document.querySelector(".readable.stacked > span")?.innerHTML || document.querySelector("span.Formatted")?.innerHTML;
                const rating = document.querySelector("span[itemprop='ratingValue']")?.innerText || document.querySelector("div.RatingStatistics__rating")?.innerText;
				const ratingsCount = document.querySelector("meta[itemprop='ratingCount']")?.content
				const imgUrl = document.querySelector("a[itemprop='image'] > img")?.src || document.querySelector("img.ResponsiveImage")?.src;
                
				// Published September 16th 2014 by 
				const publicationDate = document.querySelectorAll("div#details > div.row")[1]?.innerText || document.querySelector("p[data-testid='publicationInfo']")?.innerText;
                const language = document.querySelector("div[itemprop='inLanguage']")?.innerText || document.querySelector(".DescList");

				// 195 pages, Hardcover
				const formatAndPages = document.querySelector("p[data-testid='pagesFormat']")?.innerText;	// new design
				const bookFormat = document.querySelector("span[itemprop='bookFormat']")?.innerText || formatAndPages?.slice(-9);
				const numberOfPages = document.querySelector("span[itemprop='numberOfPages']")?.innerText || formatAndPages?.slice(0, 3);

				const genresBox = document.querySelectorAll("div.bigBoxBody > div > div.elementList");

				let genres = [];
				for (let genre of Array.from(genresBox)) {

					const genreNodes = genre.querySelectorAll("div.left > a");
					const lastGenre = genreNodes[genreNodes.length - 1]?.innerText;
					// console.log(lastGenre)
					genres.push(lastGenre)
				}

				const amazonLink = document.querySelector("ul > li > a#buyButton")?.href;


				const book_data = {
					title,
					authors,
					description,
					rating,
					ratingsCount,
					imgUrl,
					publicationDate,
					language,
					bookFormat,
					numberOfPages,
					genres,
					amazonLink
				}
				// console.log(book_data)
				return book_data;
            });
			book_data.titleUrl = title_url;
			// console.log(data)	// in terminal
			const authors_data = [];

			for (let author of book_data.authors) {
				// console.log(author)
				
				await page.goto(author?.pageLink, { waitUntil: "load" });

				const authorData = await page.evaluate(async () => {
					const details = {}
					const authorName = document.querySelector("div.rightContainer > div > h1.authorName")?.innerText;
					// details.push({"Name": authorName})
					details["name"] = authorName;
					const info = Array.from(document.querySelectorAll("div.rightContainer > div[class^='data']"));

					for (let i = 0; i < info.length; i++) {
						let title = info[i]?.innerText, item;
						if (i !== info.length - 1) {
							item = info[i + 1].querySelector("a")?.href;
						}
						// console.log(info[i])
						// Website, Twitter, LinkedIn, Youtube
						
						if (title === "Website") {
							// details.push({
							// 	"Website": item
							// })
							details["website"] = item;
						}
						else if (title === "Twitter") {
							details["twitter"] = item;
						}
					}
					return details;
				})

				authors_data.push(authorData)
			}
			// console.log("Book authors:", authors_data)
			// book_data.authors = book_data.authors.concat(authors_data);
			book_data.authors = authors_data;

			books_data.push(book_data);
        }
		return books_data;

    } catch (e) {
        console.log(e);
    }
};

scrape().then((value) => {
    console.log(value);
    fs.writeFileSync("./data/test.json", JSON.stringify(value), (err) =>
        err ? console.log(err) : null
    );
});

const { JSDOM } = require("jsdom");
const fetch = require("node-fetch");


async function getProductUrls() {
    const url = "https://www.creativememories.ca/whats-new.html?p={}&product_list_mode=grid";
    let previous = null;
    const urls = new Set();
    for (let i=0;; i++) {
        console.log(`Fetching page ${i}`);
        const resp = await fetch(url.replace("{}", i));
        const content = await resp.text();
        const dom = new JSDOM(content);
        const hrefs = Array.from(dom.window.document.querySelectorAll(".product-item-link"))
            .map(x => x.href);
        console.log(`Got ${hrefs.length} urls`);
        if (previous === hrefs[0]) break;
        previous = hrefs[0];
        hrefs.forEach(x => urls.add(x));
    }
    return urls;
}

module.exports = {
    getProductUrls,
};
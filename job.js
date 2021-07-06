const fs = require("fs");
const AdmZip = require("adm-zip");
const { scrapeImages } = require("./pageScraper");
const { getProductUrls } = require("./listScraper");

function sleep(ms) {
    return new Promise((res, rej) => {
        setTimeout(res, ms);
    });
}


class Job {
    constructor(delay) {
        this.delay = delay;
        this.cancelled = false;
        this.progress = 0;
    }

    start() {
        return this.current = new Promise(async (resolve, reject) => {
            // clear previous results
            fs.rmdirSync("./out", { recursive:true});
            
            const urls = await getProductUrls();
    
            // process urls
            let i=0;
            for (const url of urls) {
                if (this.cancelled) return resolve(false);
                scrapeImages("./out", url);
                this.progress = Math.floor(i/urls.size*100);
                await sleep(this.delay);
                i++;
            }
    
            // create zip
            const zip = new AdmZip();
            zip.addLocalFolder("./out");
            zip.writeZip("./out/output.zip");

            this.progress = 100;

            resolve(true);
        });
    }

    async stop() {
        this.cancelled = true;
        await this.current;
    }

    async finished() {
        await this.current;
    }
}

module.exports = {
    Job,
    sleep
}
const { scrapeImages } = require("./scraper");
const express = require("express");
const bodyParser = require("body-parser");
const AdmZip = require("adm-zip");
const fs = require("fs");

function sleep(ms) {
    return new Promise((res, rej) => {
        setTimeout(res, ms);
    });
}

module.exports = {
    async main() {
        const app = express();
        app.use(bodyParser.urlencoded());
        const port = 2858;
        app.set("view engine", "ejs");
        app.get("/",(req,res) => {
            res.render("pages/index.ejs");
        });
        app.post("/submit", async (req, res) => {
            const urls = req.body.urls.split(/\n/);
            fs.rmdirSync("./out", { recursive:true});
            for (url of urls) {
                scrapeImages("./out", url);
                await sleep(3000);
            }
            const zip = new AdmZip();
            zip.addLocalFolder("./out");
            zip.writeZip("./out/output.zip");
            res.render("pages/submit.ejs", {urls});
        })
        app.get("/download", (req, res) => {
            res.download("./out/output.zip");
        });
        app.listen(port, ()=>{
            console.log(`Listening on port ${port}`);
        })
    }
};
const express = require("express");
const bodyParser = require("body-parser");
const { Job } = require("./job");


let currentJob = null;

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
            if (currentJob !== null) {
                await currentJob.finished();
                currentJob = null;
            }

            // const urls = req.body.urls.split(/\n|,|;/);
            currentJob = new Job( req.body.delay ?? 1000);
            currentJob.start();
            res.redirect("/progress");
        });
        app.get("/progress", (req, res) => {
            // console.dir(req);
            if (req.query.raw == "1") {
                res.send(200,currentJob?.progress ?? -1);
            } else {
                res.render("pages/progress.ejs", {progress: currentJob?.progress ?? -1});
            }
        });
        app.get("/download", (req, res) => {
            res.download("./out/output.zip");
        });
        app.listen(port, ()=>{
            console.log(`Listening on port ${port}`);
        });
    }
};
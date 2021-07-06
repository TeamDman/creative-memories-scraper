const jsdom = require("jsdom");
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");
const exiftool = require("node-exiftool");

function getRelevantPayload(elemList) {
    return elemList
        .map(x => {
            try {
                return JSON.parse(x.innerHTML);
            } catch (e) {
                return undefined;
            }
        })
        .map(x => x?.["[data-gallery-role=gallery-placeholder]"]?.["mage/gallery/gallery"])
        .filter(x => x !== undefined)
        .map(x => x["data"])
        .find(x => true);
}


async function downloadFile(url, path) {
    console.log("Downloading image from " + url);
    const res = await fetch(url);
    const fileStream = fs.createWriteStream(path);
    await new Promise((resolve, reject) => {
        res.body.pipe(fileStream);
        res.body.on("error", reject);
        fileStream.on("finish", resolve);
    });
}

async function appendMetadata(filePath, meta) {
    console.log("Appending metadata to " + filePath);
    await new Promise((res, rej) => {
        const ep = new exiftool.ExiftoolProcess();
        ep.open()
            .then(()=>ep.writeMetadata(filePath, {
                all: "",
                comment: meta,
            }, ['overwrite_original'] ))
            .then(info => {
                if (info.error !== "1 image files updated") {
                    console.log(`Error writing image EXIF ${info.error}, deleting ${filePath} `)
                    fs.rmSync(filePath);
                }
            }, console.error)
            .then(()=>ep.close())
            .catch(console.error);
        res();
    });
}

function basename(path) {
    return path.replace(/^.*[\\\/]/, '');
}

async function gatherImages(pageURL) {
    const sectionName = basename(pageURL).replace(/\.html$/, "");

    const resp = await fetch(pageURL);
    const content = await resp.text();
    const dom = new jsdom.JSDOM(content);
    const sku = dom.window.document.querySelector("[itemprop=sku]").innerHTML;
    const price = dom.window.document.querySelector("span.price").innerHTML;
    const prefix = sku+'-';
    const issuuLinks = Array.from(
        dom.window.document.querySelectorAll(".product.attribute.overview a[href^='https://issuu']")
    ).map(x => x.href)

    const good = getRelevantPayload(Array.from(
        dom.window.document.querySelectorAll("script[type='text/x-magento-init']")
    ));

    const jobs = [];
    const videoUrls = [];

    fs.mkdirSync(config.outputPath, { recursive: true });

    for (data of good) {
        // thumb, img, full, caption, position, isMain, type, videoUrl
        if (data.type === "image") {
            const imgUrl = data.full;
            const imgName = prefix + basename(imgUrl).replace(/^creative-memories-/,"");          
            const savePath = path.join(config.outputPath, imgName);  
            const comments = data.caption + " " + "Price: " + price + " " + "SKU#: " + sku;
            jobs.push(
                downloadFile(
                    imgUrl,
                    savePath,
                ).then(()=>appendMetadata(savePath, comments))
            );
        } else if (data.type === "video") {
            videoUrls.push({
                name: data.caption,
                url: data.videoUrl
            });
        }
        // break;
    }
    console.log("Videos:")
    console.log(videoUrls);

    console.log("Issuus:")
    console.log(issuuLinks);

    let infoText = "";
    infoText+="Videos\n";
    for (const video of videoUrls) {
        infoText += video.name + "\n";
        infoText += video.url + "\n";
    }
    infoText += "\n";
    infoText += "Issuu links\n";
    for (const link of issuuLinks) {
        infoText += link + "\n";
    }
    if (videoUrls.length + issuuLinks.length > 0) {
        fs.writeFileSync(path.join(config.outputPath, prefix + sectionName + "-info.txt"), infoText);
    }

    await Promise.all(jobs);
}

const config = {
    outputPath: "./out",
};

module.exports = {
    async scrapeImages(outputPath, pageURL) {
        fs.mkdirSync(config.outputPath, { recursive: true });
        // const pageURL = "https://www.creativememories.ca/shop-all/decorative/paper-packs/homestead-paper-pack.html"
        // const pageURL ="https://www.creativememories.ca/whats-new/staycation-fast2fab-bundle.html"
        await gatherImages(pageURL);
    }
}
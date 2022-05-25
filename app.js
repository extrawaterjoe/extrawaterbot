import fs from "fs"
import fetch from "node-fetch"
import schedule from "node-schedule"
import { TwitterApi } from "twitter-api-v2"
import "dotenv/config"

let src
let media

const client = new TwitterApi({
  appKey: process.env.APIKEY,
  appSecret: process.env.APISECRET,
  accessToken: process.env.ACCESSTOKEN,
  accessSecret: process.env.ACCESSSECRET,
})

const tweet = async () => {
  try {
    const mediaId = await client.v1.uploadMedia(media)
    if (src) {
      await client.v2.tweet({ text: src, media: { media_ids: [mediaId] } })
      fs.unlinkSync(media)
      src = null
      media = null
      logRecord()
    } if (!src) {
      await client.v2.tweet({ media: { media_ids: [mediaId] } })
      // delete media file
      fs.unlinkSync(media)
      // set media and src back to null
      src = null
      media = null
      // logs record.json to console - tweet successful
      logRecord()
    }
  } catch (error) {
    console.log(error)
  }
}

const download = async (url, dest) => {
  const res = await fetch(url)
  const file = fs.createWriteStream(dest)
  res.body.pipe(file)
  return new Promise(() => {
    file.on("finish", tweet)
    file.on("error", () => console.log("there was an error writing the file"))
  })
}

const fetchAsset = async () => {
  const res = await fetch("http://api.are.na/v2/channels/extra-water?page=1&per=1000")
  const data = await res.json()
  const rnd = Math.floor(Math.random() * data.contents.length)
  const asset = {
    id: data.contents[rnd].id,
    url: data.contents[rnd].image.large.url,
    class: data.contents[rnd].class,
    type: data.contents[rnd].image.content_type,
    title: data.contents[rnd].generated_title,
    attachment: data.contents[rnd].attachment?.url,
  }

  saveAsset(asset)
}

const saveAsset = asset => {
  const assetClass = {
    Image: "img",
    // "Text": "txt",
    // "Link": "link",
    // "Media": "media",
    Attachment: "attachments",
  }
  const assetType = {
    "image/jpeg": "jpg",
    "image/png": "jpg",
    "image/gif": "gif",
  }

  const record = JSON.parse(fs.readFileSync("./record.json", "utf8"))
  if (record.content.includes(asset.id)) {
    fetchAsset()
  } else {
    asset.class === "Attachment" ? src = `https://www.are.na/block/${asset.id}` : null
    media = `./${assetClass[asset.class]}/asset.${assetType[asset.type]}`
    download(asset.url, media)
    record.content.push(asset.id)
    fs.writeFileSync("./record.json", JSON.stringify(record))
  }
}

// function that logs record.json
const logRecord = () => {
  try {
    const record = JSON.parse(fs.readFileSync("./record.json", "utf8"))
    console.log(record)
  } catch (err) {
    console.log(err)
  }
}

// call fetchAsset() 3 times with interval of 5 seconds between 
const fetchAssets = () => {
  setTimeout(() => {
    fetchAsset()
  }, 10000)
  setTimeout(() => {
    fetchAsset()
  }, 20000)
  setTimeout(() => {
    fetchAsset()
  }, 30000)
}

fetchAssets()

// run every 3 hrs
// schedule.scheduleJob("0 */3 * * *", () => {
//   fetchAssets()
// })

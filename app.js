import fs from "fs"
import fetch from "node-fetch"
import schedule from "node-schedule"
import { TwitterApi } from 'twitter-api-v2'
import "dotenv/config"

const client = new TwitterApi({
  appKey: process.env.APIKEY,
  appSecret: process.env.APISECRET,
  accessToken: process.env.ACCESSTOKEN,
  accessSecret: process.env.ACCESSSECRET,
})

let media

const tweet = async () => {
  try {
    const mediaId = await client.v1.uploadMedia(media)
    await client.v2.tweet({media: { media_ids: [mediaId]}})
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
  const res = await fetch("http://api.are.na/v2/channels/stujio?page=1&per=1000")
  const data = await res.json()
  const rnd = Math.floor(Math.random() * data.contents.length)
  const asset = {
    id: data.contents[rnd].id,
    url: data.contents[rnd].image.large.url,
    class: data.contents[rnd].class,
    type: data.contents[rnd].image.content_type,
    title: data.contents[rnd].generated_title,
  }

  saveAsset(asset)
}

const saveAsset = asset => {
  const assetClass = {
    "Image": "img",
  }
  const assetType = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
  }

  
  try {
    const record = JSON.parse(fs.readFileSync("./record.json", "utf8"))
    if (record.content.includes(asset.id)) {
      fetchAsset()
    } else {
      media = `./${assetClass[asset.class]}/asset.${assetType[asset.type]}`
      download(asset.url, media)
      record.content.push(asset.id)
      fs.writeFileSync("./record.json", JSON.stringify(record))
    }
  } catch (err) {
    console.log(err)
  }
}

fetchAsset()

// run every 3 hrs
// schedule.scheduleJob("0 */3 * * *", () => {
//   fetchAsset()
// })

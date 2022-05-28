import fs from "fs"
import fetch from "node-fetch"
import schedule from "node-schedule"
import { TwitterApi } from "twitter-api-v2"
import "dotenv/config"

let src
let media
const record = JSON.parse(fs.readFileSync("./record.json", "utf8"))

const logRecord = () => {
  console.log(record)
}

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
    }
    if (!src) {
      await client.v2.tweet({ media: { media_ids: [mediaId] } })
      fs.unlinkSync(media)
      src = null
      media = null
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
  const assetType = {
    "image/jpeg": "jpg",
    "image/png": "jpg",
    "image/gif": "gif",
  }

  if (record.content.includes(asset.id)) {
    fetchAsset()
  } else {
    asset.class === "Attachment" ? (src = `https://www.are.na/block/${asset.id}`) : null
    media = `./img/asset.${assetType[asset.type]}`
    download(asset.url, media)
    record.content.push(asset.id)
    fs.writeFileSync("./record.json", JSON.stringify(record))
  }
}

/* soundcloud, youtube, and bandcamp links - for music */
const fetchSound = async () => {
  const res = await fetch("http://api.are.na/v2/channels/ssssound-6zuyd9yymbq?page=1&per=1000")
  const data = await res.json()
  const rnd = Math.floor(Math.random() * data.contents.length)
  const sound = {
    id: data.contents[rnd].id,
    url: data.contents[rnd].source.url,
    class: data.contents[rnd].class,
    title: data.contents[rnd].title,
  }

  return sound
}

const tweetSound = async () => {
  const sound = await fetchSound()

  if (record.content.includes(sound.id)) {
    tweetSound()
    console.log('sound already tweeted, trying again...')
  } else {
    try {
      await client.v2.tweet({ text: `${sound.title} ${sound.url}` })
      record.content.push(sound.id)
      fs.writeFileSync("./record.json", JSON.stringify(record))
      console.log('sound tweeted:', sound.title)
      logRecord()
    } catch (error) {
      console.log(error)
    }
  }
}

// run every 2 hours at 10 minutes past the hour
schedule.scheduleJob("10 */2 * * *", () => {
  fetchAsset()
})

// run every 5 hrs at 15 minutes past the hour
schedule.scheduleJob("15 */5 * * *", () => {
  tweetSound()
})
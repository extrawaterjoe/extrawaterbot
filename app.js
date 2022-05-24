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

const tweet = async () => {
  try {
    const mediaId = await client.v1.uploadMedia('img/img.jpg')
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

const fetchImg = async () => {
  const res = await fetch("http://api.are.na/v2/channels/stujio?page=1&per=1000")
  const data = await res.json()
  const rnd = Math.floor(Math.random() * data.contents.length)
  const img = {
    id: data.contents[rnd].id,
    class: data.contents[rnd].class,
    url: data.contents[rnd].image.large.url,
  }

  try {
    const record = JSON.parse(fs.readFileSync("./record.json", "utf8"))
    if (record.content.includes(img.id)) {
      fetchImg()
    } else {
      download(img.url, `./img/img.jpg`)
      record.content.push(img.id)
      fs.writeFileSync("./record.json", JSON.stringify(record))
    }
  } catch (err) {
    console.log(err)
  }
}

// fetchImg()

run every 3 hrs
schedule.scheduleJob("0 */3 * * *", () => {
  fetchImg()
})

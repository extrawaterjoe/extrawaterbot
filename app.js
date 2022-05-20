import fs from "fs"
import fetch from "node-fetch"

const download = async (url, dest) => {
  const res = await fetch(url)
  const file = fs.createWriteStream(dest)
  res.body.pipe(file)
  return new Promise(() => {
    file.on("finish", () => console.log("file has been written"))
    file.on("error", () => console.log("there was an error writing the file"))
  })
}

const fetchImg = async () => {
  const res = await fetch("http://api.are.na/v2/channels/stujio?page=1&per=1000")
  const data = await res.json()
  const rnd = Math.floor(Math.random() * data.contents.length)
  const img = {
    id: data.contents[rnd].id,
    url: data.contents[rnd].image.large.url,
  }
  console.log(rnd)
  download(img.url, `./img/${img.id}.jpg`)
}

fetchImg()

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
  const res = await fetch("http://api.are.na/v2/channels/stujio")
  const data = await res.json()
  download(data.contents[0].image.large.url, "./img/image0.jpg")
}

fetchImg()

import TwitterApi from "twitter-v2"
import "dotenv/config"

const client = new TwitterApi({
  appKey: process.env.APIKEY,
  appSecret: process.env.APISECRET,
  accessToken: process.env.ACCESSTOKEN,
  accessTokenSecret: process.env.ACCESSTOKENSECRET,
})

const rwClient = client.readWrite;
export default rwClient
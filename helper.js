"use strict";

const axios = require("axios");
const { get } = require("./Room");
const DAD_JOKE_BASE_URL = "https://icanhazdadjoke.com/";

async function getJoke() {
  const resp = await axios({
    url: DAD_JOKE_BASE_URL,
    method: "GET",
    headers: {
      "User-Agent": "User-Agent",
      "Accept": "text/plain" },
  });

  return resp.data;
}

module.exports = {
  getJoke
};

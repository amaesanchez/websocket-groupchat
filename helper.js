"use strict";

const axios = require("axios");
const { get } = require("./Room");
const DAD_JOKE_BASE_URL = "https://icanhazdadjoke.com/";

/** Get a dad joke from the icanhazdadjoke API and return it as a string */

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

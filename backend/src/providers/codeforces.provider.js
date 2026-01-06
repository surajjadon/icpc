const axios = require("axios");

exports.fetchUserInfo = (handle) =>
  axios.get(`https://codeforces.com/api/user.info?handles=${handle}`);

exports.fetchUserStatus = (handle) =>
  axios.get(`https://codeforces.com/api/user.status?handle=${handle}`);

exports.fetchUserRating = (handle) =>
  axios.get(`https://codeforces.com/api/user.rating?handle=${handle}`);

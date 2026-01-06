const axios = require("axios");

exports.fetchSubmissions = (handle) =>
  axios.get(
    `https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions?user=${handle}&from_second=0`
  );

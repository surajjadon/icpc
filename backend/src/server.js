require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");

const PORT = 5000;

connectDB();

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});

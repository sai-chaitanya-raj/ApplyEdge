const express = require("express");
const dotenv = require("dotenv");
dotenv.config();

const connectDB = require('./config/database');
connectDB();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const resumeRoutes = require("./routes/resume");
const chatRoutes = require('./routes/chat');
const authRoutes = require('./routes/auth');

app.use("/api/resume", resumeRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/auth', authRoutes);

app.get("/", (req, res) => {
  res.send("ApplyEdge is working on port 3000");
});

app.listen(PORT, () => {
  console.log(`ApplyEdge server is started in the port ${PORT}`);
});
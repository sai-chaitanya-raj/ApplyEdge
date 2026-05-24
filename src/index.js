const express = require("express");
const dotenv = require("dotenv");
const chatRoutes = require('./routes/chat');
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000; // This is nothing but if the deployment or server provide port use that or else use port 3000.

app.use(express.json());//middleware
app.use('/api/chat', chatRoutes);

const resumeRoutes = require("./routes/resume");
console.log("resumeRoutes:", resumeRoutes); 
app.use("/api/resume",resumeRoutes);


app.get("/",(req,res)=>{
    res.send("AppluEdge is working on port 3000");
});
app.listen(PORT,()=>{
    console.log(`ApplyEdge server is started in the poert ${PORT}`);
})


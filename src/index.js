const express = require("express");
const app = express();
const PORT = 3000;
app.get("/",(req,res)=>{
    res.send("AppluEdge is working on port 3000");
});
app.listen(PORT,()=>{
    console.log(`ApplyEdge server is started in the poert ${PORT}`);
})
const express = require('express');
const cors = require('cors');
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;
app.use(express.json());
const corsConfig ={
  origin:"*",
  credentials:true,
  methods:["GET","POST","PUT","PATCH","DELETE","OPTIONS"]
}
app.use(cors(corsConfig));

app.get('/', async (req, res) => {
    res.send("server is ready")
  })
  
  app.listen(port, () => {
    console.log(`server is running on port:${port}`)
  })
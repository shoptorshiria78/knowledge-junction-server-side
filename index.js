const express = require('express');
const cors = require('cors');
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');
app.use(express.json());
const corsConfig ={
  origin:"*",
  credentials:true,
  methods:["GET","POST","PUT","PATCH","DELETE","OPTIONS"]
}
app.use(cors(corsConfig));



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.7bvfsss.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    
    // await client.connect();
   const featuresCollection = client.db("KnowledgeJunction").collection("features");
  //  get features data
   app.get('/features', async(req,res)=>{
      const cursor =  featuresCollection.find();
      const result = await cursor.toArray();
      console.log(result);
      res.send(result);
   })



    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', async (req, res) => {
    res.send("server is ready")
  })
  
  app.listen(port, () => {
    console.log(`server is running on port:${port}`)
  })
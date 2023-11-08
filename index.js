const express = require('express');
const cors = require('cors');
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
app.use(express.json());
const corsConfig = {
  origin: "*",
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
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
    const allAssignmentCollection = client.db("KnowledgeJunction").collection("AllAssignment");
    const allSubmittedCollection = client.db("KnowledgeJunction").collection("allSubmission");

    //  get features data
    app.get('/api/v1/features', async (req, res) => {
      try {
        const cursor = featuresCollection.find();
        const result = await cursor.toArray();

        res.send(result);
      }
      catch (error) {
        console.log(error);
      }
    })

    // get allAssignment data
    app.get('/api/v1/all/getAllAssignments', async (req, res) => {
      try {
        const page = parseInt(req.query.page);
        const size = parseInt(req.query.size)
        const cursor = allAssignmentCollection.find().skip(page*size).limit(size);
        const result = await cursor.toArray();
        console.log(result);
        res.send(result);
      }
      catch (error) {
        console.log(error)
      }
    })
    // get assignment cout
    app.get('/api/v1/allAssignmentCount', async(req, res)=>{
      const count = await allAssignmentCollection.estimatedDocumentCount();
      res.send({count})
    })

    // get single assignment Data
    app.get('/api/v1/assignment/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await allAssignmentCollection.findOne(query);
        res.send(result);
        console.log(result)

      } catch (error) {
        console.log(error)
      }
    })

    // get all submitted assignment Data pending
    app.get('/api/v1/allSubmittedAssignment', async (req, res) => {
      try {
        let query = {};
        if (req.query?.status) {
          query = { status: req.query.status };
        }
        const cursor = allSubmittedCollection.find(query)
        const result = await cursor.toArray();
        console.log(result);
        res.send(result);

      } catch (error) {
        console.log(error)
      }
    })
    // get my submitted assignment data
    app.get('/api/v1/mySubmittedAssignment', async(req, res)=>{
      try {
        let query = {};
        if (req.query?.uEmail) {
          query = { uEmail: req.query.uEmail };
        }
        const cursor = allSubmittedCollection.find(query)
        const result = await cursor.toArray();
        console.log(result);
        res.send(result);

      } catch (error) {
        console.log(error)
      }
    })

    //create assignment data
    app.post('/api/v1/createAssignment', async (req, res) => {
      try {
        const newAssignment = req.body;
        const result = await allAssignmentCollection.insertOne(newAssignment);
        res.send(result);
      }
      catch (error) {
        console.log(error)
      }
    })
    //  create all submitted data collections
    app.post('/api/v1/submittedAssignment', async (req, res) => {
      try {

        const newSubmission = req.body;
        const result = await allSubmittedCollection.insertOne(newSubmission);
        res.send(result)
      }
      catch (error) {
        console.log(error)
      }
    })

    // update assignment data
    app.put('/api/v1/updateAssignment', async (req, res) => {
      try {
        const assignmentData = req.body;
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const options = { upsert: true };
        const updateAssignment = {
          $set: {
            title: assignmentData.title,
            description: assignmentData.description,
            marks: assignmentData.marks,
            img: assignmentData.img,
            dueDate: assignmentData.dueDate,
            difficulty: assignmentData.difficulty,
          }
        }

        const result = await allAssignmentCollection.updateOne(filter, updateAssignment, options)
        res.send(result);

      } catch (error) {
        console.log(error)

      }
    })
    // update submitted assignment status
    app.patch('/api/v1/updateSubmittedAssignmentStatus', async (req, res) => {
      try {
        const submittedData = req.body;
        const id = req.params.id;
        const filter = { _id: id };
        const updateSubmittedAssignment = {
          $set: { 
            oMarks: submittedData.oMarks,
            feedback:submittedData.feedback,
            status:submittedData.status,
            inputFile:submittedData.inputFile,
            inputText:submittedData.inputText,
            uEmail:submittedData.uEmail,
            image:submittedData.image,
            title:submittedData.title,
            marks:submittedData.marks,
            name:submittedData.name
          }
        }

        const result = await allSubmittedCollection.updateOne(filter, updateSubmittedAssignment)
        res.send(result);

      } catch (error) {
        console.log(error)

      }
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
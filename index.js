const express = require('express');
const cors = require('cors');
require("dotenv").config();
const jwt = require("jsonwebtoken")
const cookieParser = require("cookie-parser")
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
app.use(express.json());
app.use(cookieParser());

app.use(cors({
   origin: [
    'https://beamish-cascaron-dfdaff.netlify.app',
    'http://localhost:5173'
   ],
   credentials:true
}));

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.7bvfsss.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// jwt middleware

const jwtVerifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: " Unauthorized Access" })
  }
  jwt.verify(token, process.env.SECRET_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: " Unauthorized Access" })
    }

    req.user = decoded;
    next()
  })

}

async function run() {
  try {

    
    const featuresCollection = client.db("KnowledgeJunction").collection("features");
    const allAssignmentCollection = client.db("KnowledgeJunction").collection("AllAssignment");
    const allSubmittedCollection = client.db("KnowledgeJunction").collection("allSubmission");

    // authentication data
    app.post("/api/v1/user/jwt", async (req, res) => {
      const email = req.body;
      const token = jwt.sign(email, process.env.SECRET_TOKEN, { expiresIn: "1h" })
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite:  process.env.NODE_ENV === 'production'?'none':'strict',
        
      }).send({ success: true })
    })

    // logOut Data
    app.post("/api/v1/user/logOut", async (req, res) => {
      const user = req.body;
      console.log(user)
      res.clearCookie('token', { maxAge:  60*60*1000, secure:true, sameSite:'none' }).send({ success: "true" })
    })

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


    // get allAssignment  data
    app.get('/api/v1/all/getAllAssignments/', async (req, res) => {
      try {
        const page = parseInt(req.query.page);
        const size = parseInt(req.query.size);
        const cursor = allAssignmentCollection.find().skip(page * size).limit(size);
        const result = await cursor.toArray();
        // console.log(result);
        res.send(result);
      }
      catch (error) {
        console.log(error)
      }
    })

    // get allAssignment difficulty data
    app.get('/api/v1/all/getAllAssignments/:difficulty', async (req, res) => {
      try {
        const page = parseInt(req.query.page);
        const size = parseInt(req.query.size);
        const query = { difficulty: req.params.difficulty }
        const cursor = allAssignmentCollection.find(query).skip(page * size).limit(size);
        const result = await cursor.toArray();
        console.log(result);
        res.send(result);
      }
      catch (error) {
        console.log(error)
      }
    })


    // get assignment count
    app.get('/api/v1/allAssignmentCount', async (req, res) => {
      const count = await allAssignmentCollection.estimatedDocumentCount();
      res.send({ count })
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
        // console.log(result);
        res.send(result);

      } catch (error) {
        console.log(error)
      }
    })
    // get my submitted assignment data
    app.get('/api/v1/mySubmittedAssignment',jwtVerifyToken, async (req, res) => {
      try {
        if(req.user.email !== req.query.uEmail){
          return res.status(403).send({message: "Forbidden Access"})
        }
        
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
    app.put('/api/v1/updateAssignment/:id', jwtVerifyToken, async (req, res) => {
      try {
        if (req.user.email !== req.query.uEmail) {
          return res.status(403).send({ message: "ForbiddenAccess" })
        }
        const assignmentData = req.body;
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const options = { upsert: true };
        const updateAssignment = {
          $set: {
            img: assignmentData.img,
            title: assignmentData.title,
            description: assignmentData.description,
            marks: assignmentData.marks,
            difficulty: assignmentData.difficulty,
            dueDate: assignmentData.dueDate,
            uEmail:assignmentData.uEmail
          }
        }

        const result = await allAssignmentCollection.updateOne(filter, updateAssignment, options)
        res.send(result);

      } catch (error) {
        console.log(error)

      }
    })
    // update submitted assignment status
    app.put('/api/v1/updateSubmittedAssignmentStatus/:id', async (req, res) => {
      try {
        const submittedData = req.body;
        const id = req.params.id;
        const options = { upsert: true };
        const filter = { _id: new ObjectId(id) };
        const updateSubmittedAssignment = {
          $set: {
            oMarks: submittedData.oMarks,
            feedback: submittedData.feedback,
            status: submittedData.status,
            inputFile: submittedData.inputFile,
            inputText: submittedData.inputText,
            uEmail: submittedData.uEmail,
            image: submittedData.image,
            title: submittedData.title,
            marks: submittedData.marks,
            name: submittedData.name
          }
        }

        const result = await allSubmittedCollection.updateOne(filter, updateSubmittedAssignment, options)
        res.send(result);

      } catch (error) {
        console.log(error)

      }
    })
    // get deleted data
    app.get('/api/v1/deleteAssignment/:id', async(req, res)=>{
      try{
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const result = await allAssignmentCollection.findOne(filter)
        console.log(result);
        res.send(result);

      }catch(error){

      }
    })

    //  delete Single Assignment
    app.delete('/api/v1/deleteAssignment/:id',jwtVerifyToken, async (req, res) => {
      try {
        if(req.user.email !== req.query.uEmail){
          return res.status(403).send({message: "Forbidden Access"})
        }
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await allAssignmentCollection.deleteOne(query);
        res.send(result);
      }
      catch (error) {
        console.log(error)

      }
    })


    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    
  }
}
run().catch(console.dir);


app.get('/', async (req, res) => {
  res.send("server is ready")
})

app.listen(port, () => {
  console.log(`server is running on port:${port}`)
})
require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const port = 3000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.USER}:${process.env.PASSWORD}@cluster0.fhaekj1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    const news = client.db("newsDB").collection("news");
    const comment = client.db("newsDB").collection("comment");

    app.get("/blogs", async (req, res) => {
      const result = await news.find().toArray();
      res.send(result);
    });

    app.get("/blog/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await news.findOne(query);
      res.send(result);
    });

    app.post("/add-blog", async (req, res) => {
      const blog = req.body;
      const query = {
        title: blog.title,
        image: blog.image,
        category: blog.category,
        content: blog.content,
        authorName: blog.name,
        authorEmail: blog.email,
        //authorPhoto: blog?.photo,
        creationDate: blog.today,
      };

      const result = await news.insertOne(query);
      res.send(result);
    });
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log("Server running on: ", port);
});

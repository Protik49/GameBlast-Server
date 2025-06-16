require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const port = 3000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

app.use(
  cors({
    origin: "*", 
  })
);
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
    const wishlist = client.db("newsDB").collection("wishlist");

    app.get("/blogs", async (req, res) => {
      const result = await news.find().toArray();
      res.send(result);
    });

    app.get("/comments/:id", async (req, res) => {
      const result = await comment.find({ blogId: req.params.id }).toArray();
      res.send(result);
    });

    app.get("/blog/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await news.findOne(query);
      res.send(result);
    });

    app.get("/featured-blogs", async (req, res) => {
      const blogs = await news.find().toArray();

      const withWordCount = blogs.map((blog) => ({
        ...blog,
        wordCount: blog.content?.split(/\s+/).filter(Boolean).length || 0,
      }));

      const topTen = withWordCount
        .sort((a, b) => b.wordCount - a.wordCount)
        .slice(0, 10);

      res.send(topTen);
    });

    app.get(`/wishlist/:email`, async (req, res) => {
      const email = req.params.email;

      const wishlistItems = await wishlist.find({ userEmail: email }).toArray();

      const newsIDs = wishlistItems.map((item) => new ObjectId(item.newsID));

      const blogData = await news.find({ _id: { $in: newsIDs } }).toArray();

      res.send(blogData);
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
        authorPhoto: blog?.photo,
        creationDate: blog.today,
      };

      const result = await news.insertOne(query);
      res.send(result);
    });

    app.post("/addcomment", async (req, res) => {
      const query = {
        name: req.body.name,
        comment: req.body.comment,

        blogId: req.body.blogId,
      };

      const result = await comment.insertOne(query);
      res.send(result);
    });

    app.post("/wishlist", async (req, res) => {
      const { newsID, userEmail } = req.body;

      // Check if already exists
      const existing = await wishlist.findOne({ newsID, userEmail });

      if (existing) {
        return res.status(409).send({ message: "Already in wishlist" });
      }

      const result = await wishlist.insertOne({ newsID, userEmail });
      res.send(result);
    });

    app.patch("/blog/:id", async (req, res) => {
      const id = req.params.id;
      const updateData = req.body;

      try {
        const result = await news.updateOne(
          { _id: new ObjectId(id) },
          { $set: updateData }
        );
        res.send(result);
      } catch (err) {
        console.error("Update error:", err);
        res.status(500).send({ message: "Error updating blog" });
      }
    });

    app.put("/blog/:id", async (req, res) => {
      const id = req.params.id;
      const { title, content, image, category } = req.body;

      const result = await news.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            title,
            content,
            image,
            category,
          },
        }
      );

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

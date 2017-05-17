const express = require("express");
const bodyParser = require("body-parser");
const logger = require("morgan");
const mongoose = require("mongoose");

const Note = require("./models/Note.js");
const Article = require("./models/Article.js");

const request = require("request");
const cheerio = require("cheerio");

mongoose.Promise = Promise;

const app = express();

app.use(logger("dev"));
app.use(bodyParser.urlencoded({
  extended: false
}));

const databaseUrl = 'mongodb://localhost/scrapehw'
app.use(express.static("public"));

if (process.env.MONGODB_URL){
  mongoose.connect(process.env.MONGODB_URL);

} else {
  mongoose.connect(databaseUrl)
}
const db = mongoose.connection;

db.on("error", function(error) {
  console.log("Mongoose Error: ", error);
});


db.once("open", function() {
  console.log("Mongoose connection successful.");
});

app.get("/scrape", function(req, res) {

  request("http://www.reddit.com/", function(error, response, html) {

    let $ = cheerio.load(html);

    $(".title").each(function(i, element) {


      let result = {};

      result.title = $(this).children('a').text();
      result.link = $(this).children().attr('href');

      let entry = new Article(result);
      console.log(result);

      entry.save(function(err, doc) {

        if (err) {
          console.log(err);
        } else {
          console.log(doc);
        }
      });

    });
  });
  res.send("Scrape Complete");
});

app.get("/articles", function(req, res) {

  Article.find({}, function(error, doc) {

    if (error) {
      console.log(error);
    } else {
      res.json(doc);
    }
  });
});


app.get("/articles/:id", function(req, res) {

  Article.findOne({ "_id": req.params.id })
  .populate("note")
  .exec(function(error, doc) {

    if (error) {
      console.log(error);
    } else {
      res.json(doc);
    }
  });
});



app.post("/articles/:id", function(req, res) {
  let newNote = new Note(req.body);

  newNote.save(function(error, doc) {

    if (error) {
      console.log(error);
    } else {
      Article.findOneAndUpdate({ "_id": req.params.id }, { "note": doc._id })
      .exec(function(err, doc) {
        if (err) {
          console.log(err);
        } else {
          res.send(doc);
        }
      });
    }
  });
});

app.listen(3000, function() {
  console.log("App running on port 3000!");
});

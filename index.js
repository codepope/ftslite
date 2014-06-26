var express = require('express');
var bodyParser = require('body-parser');
var mongodb = require('mongodb'),
  MongoClient = mongodb.MongoClient;
var assert = require('assert');

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

var db;

MongoClient.connect(process.env.MONGOHQ_URL, function(err, database) {
  db = database;
  db.collection("textstore", {}, function(err, coll) {
    if (err != null) {
      db.createCollection("textstore", function(err, result) {
        assert.equal(null, err);
      });
    }
    db.ensureIndex("textstore", {
      document: "text"
    }, function(err, indexname) {
      assert.equal(null, err);
    });
    app.listen(3000);
  });
});



app.get("/", function(req, res) {
  res.sendfile("./views/index.html");
});

app.get("/add", function(req, res) {
  res.sendfile('./views/add.html');
});

app.post("/add", function(req, res) {
  db.collection('textstore').insert({
    document: req.body.newDocument,
    created: new Date()
  }, function(err, result) {
    if (err == null) {
      res.sendfile("./views/add.html");
    } else {
      res.send("Error:" + err);
    }
  });
});

app.get("/search", function(req, res) {
  res.sendfile('./views/search.html');
});

app.post("/search", function(req, res) {
  db.collection('textstore').find({
    "$text": {
      "$search": req.body.query
    }
  }, {
    document: 1,
    created: 1,
    _id: 1,
    textScore: {
      $meta: "textScore"
    }
  }, {
    sort: {
      textScore: {
        $meta: "textScore"
      }
    }
  }).toArray(function(err, items) {
    res.send(pagelist(items));
  })
});

function pagelist(items) {
  result = "<html><body><ul>";
  items.forEach(function(item) {
    itemstring = "<li>" + item._id + "<ul><li>" + item.textScore +
      "</li><li>" + item.created + "</li><li>" + item.document +
      "</li></ul></li>";
    result = result + itemstring;
  });
  result = result + "</ul></body></html>";
  return result;
}

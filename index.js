const express = require('express');
const cors = require('cors');
const admin = require("firebase-admin");
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config()

const app = express();
const port = 5000;
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


var serviceAccount = require("./burj-al-arab-74fc5-firebase-adminsdk-50gmf-ddf212462a.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zqmy8.mongodb.net/alarab?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true },{ useNewUrlParser: true }, { connectTimeoutMS: 30000 }, { keepAlive: 1});
client.connect(err => {
  const collection = client.db("alarab").collection("books");
  // create booking
  app.post('/addBooking',(req,res) =>{
      const newBooking = req.body;
      collection.insertOne(newBooking)
      .then(result =>{
          res.send(result.insertedCount> 0)
      })
      console.log(newBooking);
  })
  console.log('db connected');
  //load data 
  app.get('/bookings', (req, res) =>{
      const bearer = (req.headers.authorization);
      if( bearer && bearer.startsWith('Bearer ')){
          const idToken = bearer.split(' ')[1];
          console.log({idToken});
          admin.auth().verifyIdToken(idToken)
            .then((decodedToken) => {
                const tokenEmail = decodedToken.email;
                const queryEmail = req.query.email;
                if(tokenEmail == queryEmail){
                    collection.find({email: queryEmail})
                    .toArray((err, documents) =>{
                        res.status(200).send(documents);
                    })
                }
            })
            .catch((error) => {
                res.status(401).send('un-authorized access');
            });
      }else{
          res.status(401).send('un-authorized access')
      } 
  })
});


app.get('/', (req,res) =>{
    res.send('hello world');
})

app.listen(port);
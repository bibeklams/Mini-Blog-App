const express=require('express');
const app=express();
const multer=require('multer');
const path=require('path')
const {MongoClient,ObjectId}=require('mongodb');
const port=3001;

app.set('view engine','ejs');
app.set('views','views');

app.use(express.urlencoded({extended:true}));
app.use('/uploads', express.static('uploads'));

const client=new MongoClient('mongodb://127.0.0.1:27017');
let postCollection;

async function run() {
  try{
    await client.connect();
    console.log('mongoDb is connected');
    const db=client.db('PostDB');
    postCollection=db.collection('posts');
  }catch(err){
    console.log(err);
  }
}
run();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 5 }, 
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb("Error: Only images are allowed!");
  }
});


app.get('/',async(req,res)=>{
  const posts=await postCollection.find().toArray();
  res.render('index',{posts:posts});
});
app.get('/add',(req,res)=>{
  res.render('add');
})
app.post('/add', upload.single('picture'), async (req, res) => {
  const picturePath = req.file ? "/uploads/" + req.file.filename : null;
  await postCollection.insertOne({
    title: req.body.title,
    description: req.body.description,
    picture: picturePath
  });
  res.redirect('/');
});
app.get('/view/:id',async(req,res)=>{
  const id=req.params.id;
  const post=await postCollection.findOne({_id:new ObjectId(id)});
  res.render('view',{post:post});
});
app.post('/delete/:id',async(req,res)=>{
  const id=req.params.id;
  await postCollection.deleteOne({_id:new ObjectId(id)});
  res.redirect('/');
});
app.listen(port,()=>{
  console.log( `server is running at http:localhost:${port}`);
});
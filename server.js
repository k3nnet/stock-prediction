const path=require('path');
const express=require('express');
const app=express();


//serve static files
app.use(express.static(__dirname+'/dist/stock-market-prediction'));

//send all request to index.html
app.get("/",function(req,res){
    res.sendFile(path.join(__dirname+'/dist/stock-market-prediction/index.html'))
});
app.get('/api/symbols',function(req,res){

    var obj;
    fs.readFile('stocks.json', 'utf8', function (err, data) {
      if (err) throw err;
      obj = JSON.parse(data);
      console.log(obj)
      res.json(obj)
    });
  
  
  })
var port=process.env.PORT || 4000;

app.listen(port,function(){
    console.log('server started on port '+port)
})
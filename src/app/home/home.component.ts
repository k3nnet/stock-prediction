import { Component, OnInit } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {timeSeriesMain} from '../prediction';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  trained_model={}

  model:timeSeriesMain;
  input_temporal_resolutions:string;
  input_ticker:string;
  input_api_key:string;
  input_learningrate=0.01;
  input_hiddenlayers=4;
  input_trainingsize=70;
  input_epochs=5;
  div_display: boolean;
  loadingdata:boolean;
  linegraph_title:string;
  input_windowsize=50;
  training_progressbar=0;
  

  //graphs
  graph = {data:[], layout:{}};
  training_graph={data:[], layout:{}};
  validate_graph={data:[],layout:{}};

  training_loading:boolean;
  traininglog:string;
  training_div_display:boolean;
  view:string;

  validate_loading:boolean;
  validate_div_display:boolean;


  stock_prices_raw:[];
  data_sma_vec:[];
  div_sma_display=false;
  sma_ready=false;
  training_ready=false;
  prediction_ready=false;
  validate_ready=false;

  constructor(private httpClient:HttpClient){}
  ngOnInit(): void {
    this.model=new timeSeriesMain(this.httpClient);
    this.input_temporal_resolutions='Daily';
    this.input_ticker='MSFT';
    this.input_api_key='L1841CDIIMA577T3'
    this.view="live"

   this.div_display=false;
    this.loadingdata = false;
    this.linegraph_title="";

    
  

    console.log("home component")
   
  }
    //get data
    async onClickFetchData(){

      //let the UI know that we are fetching data 
      this.loadingdata=true;

      //request data to be fetched . providing the stock symbol , api key for data provider and whether daily,weekly,monthly,or yearly temporal dat
      let result=await this.model.fetchData(this.input_ticker,this.input_api_key,this.input_temporal_resolutions)
     
  
      //hold the raw stock price data in a reference
      this.stock_prices_raw = result['stock_prices_raw'];
  
      //now we are ready to show the data in the UI but before we let the UI know we're done, let set up the data and make it ready to be displayed by initializing all the necessary  ui objects.
      this.div_display = true;
      this.linegraph_title = result['linegraph_title'];
  
      this.graph = {
          data: [{ x: result['timestamps'], y: result['prices'] }], //provide the graph with our axis
          layout: {height: 350, title: result['linegraph_title'], autosize: true} //set the hieght of out graph and it's title
      };
      window.dispatchEvent(new Event('resize'));
  
      //now we are done ,we are ready to compute the simple moving avarage of our data
      this.loadingdata = false;
      this.sma_ready=true;
      
    }
  
    //dispaly SMA
  
    async onClickDisplaySMA(){
      
      this.loadingdata=true; 

      // compute the simple moving avarage of a set of closing stock-prices withing a single time window(windowsize), i.e 50 weeks
      let result= await this.model.compute_sma(this.stock_prices_raw,this.input_windowsize);
     
  
      //hold the reference of the list of sma object with the set and avarages and now we prepare our graph
      this.data_sma_vec=result['data_sma_vec'];
      this.div_sma_display=true;

      //show a line graph with stock prices and sma over time periods
      this.graph={
        data:[
          {x:result['timestamps_a'],y:result['prices'],name:"Stock Prices"},
          {x:result['timestamps_b'],y:result['sma'],name:"Simple Moving Avarage"}
        ],
        layout:{height:350,title:"Price and SMA (window:"+this.input_windowsize+")",autosize:true}
      };
      window.dispatchEvent(new Event('resize'));
      this.loadingdata=false;
      this.training_ready=true;
     
  
    }

    //validate the model

    async onClickValidate(){
      
      this.validate_loading=true;
      this.validate_div_display=true;

      let inputsTemp=this.data_sma_vec.map((inp_f)=>{
        return inp_f['set'];
      });

      const inputs=new Array();

      let inputsTemp2=inputsTemp.map((val)=>{
              var prices=new Array();
              
              prices=val;
              //console.log(val)
        return prices.map((val)=>{

             console.log(val)
             inputs.push(val['price'])
             return val;

        });

      });

     

      console.table(inputs);
      //let outputs=this.data_sma_vec.map((outp_f)=>{ return outp_f['avg'] })
      //let outps=outputs.slice(Match.floor(this.input_trainingsize/100*outputs.length),outputs.length);

      let pred_X=inputs.slice(Math.floor(this.input_trainingsize/100 *inputs.length),inputs.length);

      console.table(pred_X);
      let pred_Y=await this.model.makePredictions(pred_X,this.trained_model['model']);

      

      let timestamps_a=this.stock_prices_raw.map((val)=>{
          return val['timestamp']
      });
      let timestamps_b=this.stock_prices_raw.map(val=>{

        return val['timestamp'];
      }).splice(this.input_windowsize,(this.stock_prices_raw.length-Math.floor((100-this.input_trainingsize)/100*this.stock_prices_raw.length)));

      let timestamps_c=this.stock_prices_raw.map((val)=>{return val['timestamp']}).splice(this.input_windowsize+Math.floor(this.input_trainingsize/100 *this.stock_prices_raw.length),this.stock_prices_raw.length);


      let sma=this.data_sma_vec.map((sma)=>{return sma['avg']});
      let prices=this.stock_prices_raw.map(stock=>{return stock['price']});
      
   
      this.training_graph={
        data:[
          {x:timestamps_a,y:prices, name:"Actual Price"},
          {x:timestamps_b,y:sma, name:"Training label sma"},
          {x:timestamps_c,y:pred_Y, name:"Predicted"}

        ],
        layout:{height:350,title:"Predict Results",autosize:true}

      }
      window.dispatchEvent(new Event('resize'));

      this.validate_loading=false;




    }

    trainModel()
{
  this.view="training"
}
    //train modell
     
  async onClickTrainModel(){
  
    // are you trainging ? if so then display the training div
    this.training_loading=true;
    this.training_div_display=true;


    let epoch_loss=[];
    this.traininglog="";



    //inputs layer
    let inputstemp=this.data_sma_vec.map((inp_f)=>{
     // console.log("Set==============",inp_f['set'])
      return inp_f['set'];
    });

    let inputs=inputstemp.map(val=>{
      console.log(val)
      let temp=[];
      temp=val;
      return temp.map((res)=>{
        
        return res['price'];
      })
    })

    let outputs=this.data_sma_vec.map((outp_f)=>{
      return outp_f['avg'];
    })

    let callback=function(epoch,log,model_params){

      this.traininglog="<div> Epoch :"+(epoch+1)+" (of "+this.input_epoch+")"+
      ", loss:: "+log.loss+"</div>"+this.traininglog;

      epoch_loss.push(log.loss);
      console.log('log',log);
      this.training_progressbar=Math.ceil(((epoch+1)*(100/this.input_epoch)));
      
      this.training_graph={
        data:[{X:Array.from({length:epoch_loss.length},(v,k)=>k+1),y:epoch_loss,name:"Loss"}],
        layout:{height:350,title:"Training Loss",autosize:true}
      };
      window.dispatchEvent(new Event('resize'))


      
    }
    let model_params={
      "inputs":inputs,
      "outputs":outputs,
      "input_trainingsize":this.input_trainingsize,
      "input_windowsize":this.input_windowsize,
      "input_epoch":this.input_epochs,
      "input_learningrate":this.input_learningrate,
      "input_hiddenlayers":this.input_hiddenlayers
    };

    this.trained_model=await this.model.trainModel(model_params,callback.bind(this));
    this.traininglog="<div> Model trained</div>"+this.traininglog;
    this.training_loading=false;
    this.validate_ready=true;
    
    

  }

}

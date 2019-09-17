import * as tf  from '@tensorflow/tfjs';
import {HttpClient} from '@angular/common/http'
import { ToastrService } from 'ngx-toastr';
export class timeSeriesMain{



    //declarations 
    input_dataset:number[];
    result:number[];
    stock_prices_raw:number[];
    sma_vec:number[];
    window_size:number;
    training_size:number;
    data_temporal_resolutions:string;
    toast:ToastrService;

    
    constructor(private httpClient:HttpClient){


        //initializatins
        this.input_dataset=[];
        this.result=[];
        this.stock_prices_raw=[];
        this.sma_vec=[];
        this.window_size=50;
        this.training_size=70;
        this.data_temporal_resolutions='Weekly';
        
    }_



    async fetchSymbols(symbol){
          // return a promise 
          return new Promise((resolve,reject)=>{

            let output={};
            //remember to change the request to an api endpoint not local
            let requesturl="https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords="+symbol+"&apikey=L1841CDIIMA577T3";
           // let requesturl=".../api/stocks.json"



            //make a request to get the data

            this.httpClient.get(requesturl).subscribe(data=>{

                console.log("fetched data successful");
                console.log(data);
                output['data']=data['bestMatches'];

                resolve(output);
                
            },(error)=>{
                output['success']=false;
                output['error_message']=error;
                reject(output);
            })
        })  
    }


    getWeekly(data,output){
        //hold reference to the stock symbol and how fresh is the data
        console.log("Weekly")
        let symbol=data['Meta Data']['2. Symbol'];
        let last_refreshed=data['Meta Data']['3. Last Refreshed'];
        let weekly=data['Weekly Time Series'];

        let stock_prices_raw=[];

        for(let date in weekly){
            console.log(date)
            let closing_stockPrice={
                timestamp:date,
                price:parseInt(weekly[date]['4. close'])
            }
            stock_prices_raw.push(closing_stockPrice)
        }

        //sort the list of stock prices
        stock_prices_raw.reverse();

        let message="Symbol :"+symbol+" (last refreshed"+last_refreshed+")";


        output['linegraph_title']=message;

        //from a list of stock prices create a list of timestamp and prices respectively
        if(stock_prices_raw.length>0){
            let timestamps=stock_prices_raw.map((stock_price)=>{
                return stock_price['timestamp'];

            });
            let prices=stock_prices_raw.map((stock_price)=>{
                return stock_price['price'];
            });

            //include the two list to our output object
            output['timestamps']=timestamps;
            output['prices']=prices;

        }

        //don't forget to add the stock price raw data and it's results list to the output object
        output['stock_prices_raw']=stock_prices_raw;
        output['success']=true;
        return output;
    }

    getDaily(data,output){
//hold reference to the stock symbol and how fresh is the data
let symbol=data['Meta Data']['2. Symbol'];
let last_refreshed=data['Meta Data']['3. Last Refreshed'];
let daily=data['Time Series (Daily)'];
console.log(daily.length);

let stock_prices_raw=[];

for(let date in daily){
    //console.log(date)
    let closing_stockPrice={
        timestamp:date,
        price:parseInt(daily[date]['4. close'])
    }
    stock_prices_raw.push(closing_stockPrice)
}

//sort the list of stock prices
stock_prices_raw.reverse();

let message="Symbol :"+symbol+" (last refreshed"+last_refreshed+")";


output['linegraph_title']=message;

//from a list of stock prices create a list of timestamp and prices respectively
if(stock_prices_raw.length>0){
    let timestamps=stock_prices_raw.map((stock_price)=>{
        return stock_price['timestamp'];

    });
    let prices=stock_prices_raw.map((stock_price)=>{
        return stock_price['price'];
    });

    //include the two list to our output object
    output['timestamps']=timestamps;
    output['prices']=prices;

}

//don't forget to add the stock price raw data and it's results list to the output object
output['stock_prices_raw']=stock_prices_raw;
output['success']=true;

return output;
    }

    //fetch data asynchronously 
    async fetchData(ticker:string,apikey:string,data_temporal_resolutions:string){


        // return a promise 
        return new Promise((resolve,reject)=>{

            let output={};
            let requesturl="";

            console.log("temporal resolution: "+ data_temporal_resolutions +" "+ticker);
            //depending on the temporal resolution assign the request url
            
            if(data_temporal_resolutions=='Daily'){

                requesturl="https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol="+ticker+"&interval=5min&apikey="+apikey+"&outputsize=full";
            }else{
                requesturl="https://www.alphavantage.co/query?function=TIME_SERIES_WEEKLY&symbol="+ticker+"&apikey="+apikey;
            }


            //make a request to get the data

            this.httpClient.get(requesturl).subscribe(data=>{

                console.log("fetched data successful");
                console.table(data['Note']);

                if(data['Error Message']){
                    output['success']=false;
                    output['error_message']="Unavailable "+data_temporal_resolutions+ " data for "+ticker;
                   return reject(output)

                }else if (data['Note']){
                    output['success']=false;
                    output['error_message']=data['Note']
                    return reject(output)
                }
                console.log(data_temporal_resolutions)
                //check the temporal resolution,make sure if'ts daily data ,weekly,monthly or yearly time series data
                if(data_temporal_resolutions=='Daily'){
                   output=this.getDaily(data,output);
                }else if(data_temporal_resolutions=='Weekly'){
                   output=this.getWeekly(data,output);
                }
                else{
                    output['success']=false;
                    output['error_message']=data['Information'];
                }
                resolve(output);
                
            },(error)=>{
                output['success']=false;
                output['error_message']=error;
                reject(output);
            })
        })
    }



    



    


    //compute Simple Moving Average of the price data
    compute_sma(stock_prices_raw,input_windowsize){
        let output={};


        //list of sma objects specifying the set and avarage price of the mentioned set.
        output['data_sma_vec']=this.computeSMA(stock_prices_raw,input_windowsize);

        //list of avarage prices within a time window
        output['sma']=output['data_sma_vec'].map((val)=>{
            return val['avg'];
        });

        //list of stock prices
        output['prices']=stock_prices_raw.map(val=>{
            return val['price'];
        });

        //list of timestamps of each stock price
        output['timestamps_a']=stock_prices_raw.map(val=>{
            return val['timestamp'];
        });

        //list of timestamps with a time windows
        output['timestamps_b']=stock_prices_raw.map(val=>{

            return val['timestamp']
        }).splice(input_windowsize,stock_prices_raw.length);

        return output;
    }
    computeSMA(data,window_size){
        
        let r_avgs=[];
        let avg_prev=0;

        for(let i=0;i<data.length-window_size;i++){

            let curr_avg=0.00;
            let t=i+window_size;
            for(let j=i;j<t && j<=data.length;j++){
                curr_avg+=data[j]['price']/window_size;
            }
            let sma={
                set:data.slice(i,i+window_size),
                avg:curr_avg
            }
            r_avgs.push(sma);
            avg_prev=curr_avg;

        }
        return r_avgs;
    }

    //train model
    async trainModel(model_params,callback){

        //let's have a peek at the params we have to provide our algorithm in order to train our model
        console.log(model_params)

        let inputs=model_params['inputs'];  //
        let outputs=model_params['outputs'];
        let trainingsize=model_params['input_trainingsize'];
        let window_size=model_params['input_windowsize'];
        let n_epochs=model_params['input_epoch'];
        let learning_rate=model_params['input_learningrate'];
        let n_layers=model_params['input_hiddenlayers'];

        const input_layer_shape=window_size;
        const input_layer_neurons=50;

         const rnn_input_layer_features=10;
         const rnn_input_layer_timesteps=input_layer_neurons/rnn_input_layer_features;

         const rnn_input_shape=[rnn_input_layer_features,rnn_input_layer_timesteps];
        const rnn_output_neurons=20;

        const rnn_batch_size=window_size;

        const output_layer_shape=rnn_output_neurons;
        const output_layer_neurons=1;

        let X=inputs.slice(0,Math.floor(trainingsize/100 *inputs.length));
        let Y=outputs.slice(0,Math.floor(trainingsize/100 * outputs.length));
        console.log(X);
        console.log(X.length+" "+X[0].length)
        const xs=tf.tensor2d(X,[X.length,X[0].length]).div(tf.scalar(10));
        const ys=tf.tensor2d(Y,[Y.length,1]).reshape([Y.length,1]).div(tf.scalar(10));

        const model=tf.sequential();

        model.add(tf.layers.dense({units:input_layer_neurons,inputShape:[input_layer_shape]}));
        model.add(tf.layers.reshape({targetShape:rnn_input_shape}));


    let lstm_cells = [];
    for (let index = 0; index < n_layers; index++) {
         lstm_cells.push(tf.layers.lstmCell({units: rnn_output_neurons}));
    }

    model.add(tf.layers.rnn({
      cell: lstm_cells,
      inputShape: rnn_input_shape,
      returnSequences: false
    }));

    model.add(tf.layers.dense({units: output_layer_neurons, inputShape: [output_layer_shape]}));

    model.compile({
      optimizer: tf.train.adam(learning_rate),
      loss: 'meanSquaredError'
    });

    const hist = await model.fit(xs, ys,
      { batchSize: rnn_batch_size, epochs: n_epochs, callbacks: {
        onEpochEnd: async (epoch, log) => {
          callback(epoch, log, model_params);
        }
      }
    });

    // await model.save('localstorage://tfjs-stocks');
    // const model = await tf.loadLayersModel('localstorage://tfjs-stocks');
    // const hist = {};

    return { model: model, stats: hist };
    }
    makePredictions(X,model){

        //let X=this.inputs.slice(Math.floor(size/100 * inputs.length),inputs.length);
        console.table(X.length);
        console.log(String(X[0]).length)
        const predictedResults = model.predict(tf.tensor2d(X,[X.length,X[0].length]).div(tf.scalar(10))).mul(10);
        console.log(predictedResults.dataSync());
        return Array.from(predictedResults.dataSync());
        
    }
}

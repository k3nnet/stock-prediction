import { Component, OnInit } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {timeSeriesMain} from '../prediction';
import {HomeComponent} from '../home/home.component';

@Component({
  selector: 'app-backtest',
  templateUrl: './backtest.component.html',
  styleUrls: ['./backtest.component.css']
})
export class BacktestComponent implements OnInit {

  laoding:boolean;
  div_display:boolean;
  traininglog:string;
  data_sma_vec:[];

  constructor() {

    

   }

  ngOnInit() {
  }



}

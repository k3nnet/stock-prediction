import {Routes} from '@angular/router';
import { AppComponent } from './app.component';
import { BacktestComponent } from './backtest/backtest.component';

const AppRoutes:Routes=[
    {
        path:'backtest',
        component:BacktestComponent
    },
    {
        path:'home',
        component:AppComponent
    }
];
export default AppRoutes;
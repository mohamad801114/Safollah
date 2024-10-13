class Safolla {
    constructor() {
        this.marketinfo = [];    //Etalat Market
        this.portfolio = [];    //Etalat Portfo
        this.config = this.getconfig();
        this.packetitemskey = `Packets`;    
        this.date = new Date()
        this.whitelistkey = `WhitelistOption${this.date.getFullYear()} - ${this.date.getMonth()} - ${this.date.getDay()}`;
        this.whitelist = [];   //In White List Marbot be safoolah baraye entekhab Option
        this.saveConfig();
        this.packetitems = this.getPackets();   //packet haye kharidare shode robot
        this.DeltaHedge = false;                
        this.DeltaHedgeBalance;
        this.refreshconfig = false;
        this.BuyQFallOn = false;
        this.BuyQFallBalance;
        this.BuyQFallProfit;
        this.userBalance =                      //etalaat balance
        {
            accountBalance: 0,
            realBalance: 0,
            blockedBalance: 0
        }
        setTimeout(() => {
            this.StartTraiding();
        }, 3000);
        setTimeout(()=>{
            this.FindWhitelist();
            this.BuyQFall();
        } ,4000);
    }

    StartTraiding() {
        console.info("بسم الله رحمان رحیم");
        setInterval(() => {
            this.getMarketInfo()
                .then(market => {
                    this.marketinfo = market;
                })
            if (this.marketinfo == null)
                return;
            this.getPortfo()
                .then(portfo => {
                    this.portfolio = portfo;
                })
            this.getUserBalance()
                .then(userBalance => {
                    this.userBalance = userBalance;
                })
            this.BalanceRemain();
            if (this.portfolio == null)
                return;
            if (this.DeltaHedge)
                this.DeltaHedging();
            this.CheckForProfit();
            this.ShowTheItemsInTable();
            this.ShowProfitmain();
        }, 1000)
    }
    DeltaHedging() {            //RobotDeltaHedge
        if (this.packetitems.length != 0) {
            this.packetitems.forEach((packet , counter) => {
                if (!this.DeltaHedge)
                    return;
                if (packet.RobotName != "DeltaHedging")
                    return;
                // if (packet == null)
                //     counter = 0;
                if (packet.BuyedBefor)
                    return;
                let ShareBase = this.marketinfo.find(item => item.nc == packet.BaseID);
                let BuyOptionInMarket = this.marketinfo.find(item => item.nc == packet.BuyOptionID);
                let SellOptionInMarket = this.marketinfo.find(item => item.nc == packet.SellOptionID);
                if (ShareBase == null || BuyOptionInMarket == null || SellOptionInMarket == null)
                    return;
                this.getStockInfo(packet.BuyOptionID)
                    .then(stockBuy => {
                        this.getStockInfo(packet.SellOptionID)
                            .then(stockSell => {
                                let distancecalloption = true;
                                let distanceputoption = true;
                                let minimum = stockBuy.symbolqueue.Value[0].BestBuyPrice  > stockBuy.symbolqueue.Value[0].BestSellPrice ? stockBuy.symbolqueue.Value[0].BestSellPrice :stockBuy.symbolqueue.Value[0].BestBuyPrice;
                                if(Math.abs(stockBuy.symbolqueue.Value[0].BestBuyPrice - stockBuy.symbolqueue.Value[0].BestSellPrice) / minimum > 0.05)
                                {
                                    if(Math.abs(stockBuy.symbolqueue.Value[0].BestBuyPrice - stockBuy.symbolqueue.Value[0].BestSellPrice) != 1)
                                    {
                                        distancecalloption = false;
                                    }
                                }
                                minimum = stockSell.symbolqueue.Value[0].BestBuyPrice  > stockSell.symbolqueue.Value[0].BestSellPrice ? stockSell.symbolqueue.Value[0].BestSellPrice :stockSell.symbolqueue.Value[0].BestBuyPrice;
                                if(Math.abs(stockSell.symbolqueue.Value[0].BestBuyPrice - stockSell.symbolqueue.Value[0].BestSellPrice) / minimum > 0.05)
                                {
                                    if(Math.abs(stockSell.symbolqueue.Value[0].BestBuyPrice - stockSell.symbolqueue.Value[0].BestSellPrice) != 1)
                                    {
                                        distanceputoption = false;
                                    }
                                }
                                console.log(distancecalloption && distanceputoption);
                                let BuyPercent = packet.BuyBalanceUsed;
                                let SellPercent = packet.SellBalanceUsed;
                                if (this.userBalance.accountBalance * this.DeltaHedgeBalance * BuyPercent < stockBuy.symbolqueue.Value[0].BestSellPrice * 1000 * stockBuy.symbolqueue.Value[0].BestSellQuantity && distancecalloption && distanceputoption) {
                                    if (this.userBalance.accountBalance * this.DeltaHedgeBalance * SellPercent < stockSell.symbolqueue.Value[0].BestSellPrice * 1000 * stockSell.symbolqueue.Value[0].BestSellQuantity) {
                                        let truevalueSell = stockSell.symbolqueue.Value[0].BestSellPrice * 1000 + stockSell.symbolqueue.Value[0].BestSellPrice;
                                        let truevaluebuy = stockBuy.symbolqueue.Value[0].BestSellPrice * 1000 + stockBuy.symbolqueue.Value[0].BestSellPrice;
                                        let CountSell = this.userBalance.accountBalance * this.DeltaHedgeBalance * SellPercent / truevalueSell;
                                        let CountBuy = this.userBalance.accountBalance * this.DeltaHedgeBalance * BuyPercent / truevaluebuy;
                                        if(CountSell < CountBuy)                        //ashar tedad kochik be bala ashar adad bozorg be paiin
                                        {
                                            CountSell = Math.ceil(CountSell);
                                            CountBuy = Math.floor((this.userBalance.accountBalance * this.DeltaHedgeBalance - CountSell * truevalueSell) / truevaluebuy);
                                        }
                                        else if(CountBuy > CountSell)
                                        {
                                            CountBuy = Math.ceil(CountBuy);
                                            CountSell = Math.floor((this.userBalance.accountBalance * this.DeltaHedgeBalance - CountBuy * truevaluebuy) / truevalueSell);
                                        }
                                        else
                                        {
                                            CountSell = Math.floor(CountSell);
                                            CountBuy = Math.floor(CountBuy);
                                        }
                                        var buyBuyOption =
                                        {
                                            count: CountBuy,
                                            mxp: stockBuy.symbolinfo.mxp,
                                            nc: packet.BuyOptionID,
                                            price: stockBuy.symbolqueue.Value[0].BestSellPrice
                                        }
                                        var buySellOption =
                                        {
                                            count: CountSell,
                                            mxp: stockSell.symbolinfo.mxp,
                                            nc: packet.SellOptionID,
                                            price: stockSell.symbolqueue.Value[0].BestSellPrice
                                        }
                                        this.buyoptions(buyBuyOption)
                                            .then(res => {
                                                if (res.IsSuccessfull) {
                                                    this.packetitems[counter].BuyedBefor = true;
                                                    this.packetitems[counter].BuyOptionQuantity= CountBuy;
                                                    this.packetitems[counter].BuyedPriceBuyOption = stockBuy.symbolqueue.Value[0].BestSellPrice;
                                                    this.savepackets();
                                                    console.log(`${packet.OptionBuyName} Buyed I Hope For Profit`)
                                                }
                                            }).catch(ex => {
                                                console.log(`Error in Buy BuyOption : ${ex}`);
                                            })
                                        setTimeout(() => {
                                            this.buyoptions(buySellOption)
                                                .then(res => {
                                                    if (res.IsSuccessfull) {
                                                        this.packetitems[counter].BuyedBefor = true;
                                                        this.packetitems[counter].SellOptionQuantity = CountSell;
                                                        this.packetitems[counter].BuyedPriceSellOption = stockSell.symbolqueue.Value[0].BestSellPrice;
                                                        this.savepackets();
                                                        console.log(`${packet.OptionSellName} Buyed I Hope For Profit`)
                                                    }
                                                }).catch(ex => {
                                                    console.log(`Error in Buy SellOption : ${ex}`)
                                                })
                                        }, 500)
                                    }
                                }
                            })
                    })
            })
        }
    }
    ShowProfitmain()
    {
        let total = 0;
        this.packetitems.forEach(packet =>{
            total += packet.InProfit
        })
        updateProfit(total);
    }
    DayoftheWeek()
    {   
        let today = new Date();
        let firstdayoftheyear = Convert_to_JalaliDate("1403" , "01" , "01");
        let oneday = 24 * 60 * 60 * 1000;
        return (4 + Math.floor((today - firstdayoftheyear) / oneday) % 7) % 7;
    }
    BuyQFall()
    {
        if(this.marketinfo.length == 0)
        {
            setTimeout(()=>{
                this.BuyQFall();
            } , 3000);
            return;
        }
        let holdingOptions = []
        this.config.OptionWhitelist.forEach(Base =>
        {
            if(Base.Trigger)
            {
                let BaseInMarket = this.marketinfo.find(item => item.nc == Base.BaseID);
                //if(BaseInMarket.bbq  < Base.Volume / 3)
                //{
                    this.marketinfo.forEach((share) =>{
                        if(share.nc.search("OF") == 2)
                        {
                            if(share.cn.search(Base.BaseName) != -1)
                            {
                                let tedadday = 2;
                                if(this.DayoftheWeek() == 0)
                                {
                                    tedadday = 4;
                                }
                                this.getChartData(share.nc , tedadday)
                                    .then(data =>{
                                        if(data.length == 0)
                                            return;
                                        let volume = data[0].volumes[0] * 1000 * data[0].prices[0];
                                        if(volume > 1000000000)
                                        {
                                            this.getStockInfo(share.nc)
                                                .then(stock =>{
                                                    let startdate = stock.symbolinfo.sd;
                                                    let enddate = stock.symbolinfo.ed;
                                                    let startdatearr = startdate.split("/");
                                                    let enddatearr = enddate.split("/");
                                                    startdate = Convert_to_JalaliDate(startdatearr[0], startdatearr[1], startdatearr[2]);
                                                    enddate = Convert_to_JalaliDate(enddatearr[0], enddatearr[1], enddatearr[2]);
                                                    let today = new Date();
                                                    let oneday = 24 * 60 * 60 * 1000;
                                                    let tedad_rooz = Math.floor((enddate - today)/oneday);
                                                    let distancefromemalprice = ((share.cn.split("-")[1] - share.cp)/BaseInMarket.cp - 1) * 100;
                                                    let damanenavasan = 2;
                                                    // console.log(tedad_rooz * damanenavasan /(distancefromemalprice * distancefromemalprice));
                                                    // console.log(share.sf);
                                                    if(tedad_rooz * damanenavasan /(distancefromemalprice * distancefromemalprice) >= 1)
                                                    {
                                                        let maxvolume = 0
                                                        if(volume > maxvolume)
                                                        {
                                                            holdingOptions.push({
                                                                OptionID : share.nc,
                                                                FormuleNumber : tedad_rooz * damanenavasan /(distancefromemalprice * distancefromemalprice),
                                                                OptionName : share.sf,
                                                                BaseName : Base.BaseName,
                                                                Volume : volume
                                                            })
                                                            // console.log(options);
                                                        }
                                                    }
                                                })
                                        }
                                    })
                            }
                        }  
                    })
                //}
            }
        })
        setTimeout(()=>{
            let Best = 
            {
                OptionID : "",
                FormuleNumber : 0,
                OptionName : "",
                BaseName :"",
                Volume : 0
            };
            holdingOptions.forEach(option =>{
                if(option.volume > Best.Volume)
                {
                    Best = option;
                }
            })
            
        },50)
    }
    ActivateTheTrigger()
    {
        this.config.OptionWhitelist.forEach((BaseShare , index) =>
        {
            this.getSecondtable(BaseShare.BaseID)
                .then(data =>
                {
                    this.getStockInfo(BaseShare.BaseID)
                        .then(BaseStock =>
                        {
                            if(BaseStock.symbolqueue.Value[0].BestSellPrice > BaseStock.symbolinfo.hp)
                            {
                                if(BaseShare.symbolqueue.Value[0].BestBuyQuantity  > data.Valume90AVG / 3)
                                {
                                    this.config.OptionWhitelist[index].Trigger = true;
                                    this.config.OptionWhitelist[index].Volume = data.Valume90AVG / 3;
                                }
                            }
                        })
                })
        })
    }
    deleteconfig() {            //delete config and packets
        this.refreshconfig = true;
        this.config = this.getconfig();
        this.saveConfig();
        // this.packetitems.splice(0, this.packetitems.length);
        // this.savepackets();
        this.refreshconfig = false;
    }
    BalanceRemain() {                                   //namayesh balance baghi monde dar menoye asli
        let totalValue = 0;
        this.portfolio.forEach(share => {
            if (share.RemainQuantity != 0) {
                let ShareInMarket = this.marketinfo.find(item => item.nc == share.SymbolISIN);
                let IsOption = false;
                this.config.OptionWhitelist.forEach(Base => {
                    if (ShareInMarket.cn.search(Base.BaseName) != -1) {
                        IsOption = true;
                    }
                })
                if (IsOption)
                    totalValue += share.RemainQuantity * ShareInMarket.cp * 1000;
                else
                    totalValue += share.RemainQuantity * ShareInMarket.cp;
            }
        })
        updateDollar(this.userBalance.accountBalance);
        updateBalance(Math.round(((this.userBalance.accountBalance / (totalValue + this.userBalance.accountBalance))) * 100));
    }

    ShowTheFilteredTheOptions()     //namayesh option haye entekhab shoode dar list
    {
        this.whitelist.forEach(pare =>{
            addItemsToLists(pare.OptionBuyName , pare.OptionSellName , pare.color);
            this.ShowTheBlackScholes(pare.OptionBuyName);
            this.ShowTheBlackScholes(pare.OptionSellName);
        })
    }
    CalculateBalanceForeachPacket(Balance)          //mohasebe balance bar asase delta
    {
        let counter = 0;
        this.packetitems.forEach(packet =>
        {
            if(packet.RobotName == "DeltaHedging" && !packet.BuyedBefor)
            {
                counter += 1;
            }
        })
        if(counter == 0)
        {
            console.log(`There is No new packet`);
        }
        else
        {
            this.DeltaHedgeBalance = Balance / counter;
        }
    }

    ShowthePreviosWatchlist(buylistid, selllistid)  //namayesh sahm haye kharidari shode
    {
        if (this.packetitems.length != 0) {
                this.packetitems.forEach((packet, index) => {
                    if (packet.RobotName == "DeltaHedging") {
                        let childNodeBuy = buylistid.childNodes;
                        let childNodeSell = selllistid.childNodes;
                        let DoNotaddpacket = false;
                        let list1 = document.createElement('li');
                        let list2 = document.createElement('li');
                        list1.textContent = `${packet.OptionBuyName} - ${packet.BuyBalanceUsed}`;
                        list2.textContent = `${packet.OptionSellName}-${packet.SellBalanceUsed}`;
                        childNodeBuy.forEach((item) => {
                            if (item.textContent == `${packet.OptionBuyName} - ${packet.BuyBalanceUsed}`)
                            {
                                childNodeSell.forEach((item)=>{
                                    if(item.textContent == `${packet.OptionSellName}-${packet.SellBalanceUsed}`)
                                        DoNotaddpacket = true;
                                })
                            }
                        })
                        if (!DoNotaddpacket)
                        {
                            buylistid.appendChild(list1);
                            selllistid.appendChild(list2);
                        }
                    }
                })
        }
    }
    cumulativeNormalDistribution(x) 
    {
        const mean = 0;
        const stdDev = 1;
        return (1 - this.erf((mean - x) / (Math.sqrt(2) * stdDev))) / 2;
    }
    erf(x) 
    {
        const sign = x >= 0 ? 1 : -1;
        x = Math.abs(x);
        const a1 = 0.254829592;
        const a2 = -0.284496736;
        const a3 = 1.421413741;
        const a4 = -1.453152027;
        const a5 = 1.061405429;
        const p = 0.3275911;

        const t = 1.0 / (1.0 + p * x);
        const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
        return sign * y;
    }
    blackScholes(S, K, T, r, sigma, optionType) 
    {
        let d1 = (Math.log(S / K) + (r + (Math.pow(sigma, 2) / 2)) * T) / (sigma * Math.sqrt(T));
        let d2 = d1 - sigma * Math.sqrt(T);
        if (optionType === 'call') {
            return S * this.cumulativeNormalDistribution(d1) - K * Math.exp(-r * T) * this.cumulativeNormalDistribution(d2);
        } else if (optionType === 'put') {
            return K * Math.exp(-r * T) * this.cumulativeNormalDistribution(-d2) - S * this.cumulativeNormalDistribution(-d1);
        } else {
            throw new Error("Invalid option type. Use 'call' or 'put'.");
        }
    }
    ShowTheBlackScholes(OptionName)
    {
        return new Promise((resolve) => {
            let Option = this.marketinfo.find(share => share.sf == OptionName);
            let Baseoption;
            this.config.OptionWhitelist.forEach(Base => {
                if (Option.cn.search(Base.BaseName) != -1) {
                    Baseoption = this.marketinfo.find(item => item.nc == Base.BaseID);
                }
            })
            this.getStockInfo(Option.nc)
                .then(Stock => {
                    let startdate = Stock.symbolinfo.sd;
                    let enddate = Stock.symbolinfo.ed;
                    let startdatearr = startdate.split("/");
                    let enddatearr = enddate.split("/");
                    let priceoption = [];
                    startdate = Convert_to_JalaliDate(startdatearr[0], startdatearr[1], startdatearr[2]);
                    enddate = Convert_to_JalaliDate(enddatearr[0], enddatearr[1], enddatearr[2]);
                    let today = new Date();
                    let oneday = 24 * 60 * 60 * 1000;
                    let optionTime = Math.floor((enddate - startdate) / oneday);
                    console.log(Option.sf);
                    // console.log(`Time to add is : ${ this.Truenumber(optionTime)}`);
                    // console.log(`the Option Time is : ${optionTime}`);
                    this.getChartData(Baseoption.nc, 365)
                        .then((data) => {
                            data.forEach((sharedata, index) => {
                                priceoption.push(sharedata.prices[0]);
                            })
                            let returns = [];
                            for (let i = 1; i < priceoption.length; i++) {
                                returns.push(Math.log(priceoption[i] / priceoption[i - 1]));
                            }
                            const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
                            const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (returns.length - 1);
                            const dailyVolatility = Math.sqrt(variance);
                            const annualVolatility = dailyVolatility * Math.sqrt(priceoption.length);
                            let timeEmal = Math.floor((enddate - today) / oneday) + 2;
                            let sigma = annualVolatility;
                            let S = Baseoption.ltp;
                            let K = parseFloat(Option.cn.split("-")[1]);
                            let r = 0.3;
                            let T = timeEmal/365;
                            let blackscholes;
                            // console.log(`The Value that api return is : ${priceoption.length}`);
                            // console.log(`Sigma is :${sigma}`);
                            // console.log(`remaining time to emal is :${timeEmal}`);
                            // console.log(`Base Share price is :${S}`);
                            // console.log(`Emal Price is :${K}`);
                            // console.log(`T is :${T}`);
                            if(Option.nc.search("O9") == 2)
                            {
                                blackscholes = this.blackScholes(S , K ,  T ,r , sigma , 'call');
                                if(Option.bsp < blackscholes)
                                {
                                    console.log(`${Option.sf} : diffrence with blackscholes : ${Math.floor(((blackscholes - Option.bsp)/blackscholes) * 100)}% , and the blackscols is : ${blackscholes}`)
                                }
                            }
                            if(Option.nc.search("OF") == 2)
                            {
                                blackscholes =  this.blackScholes(S , K ,  T ,r , sigma , 'put');
                                if(Option.bsp < blackscholes)
                                {
                                    console.log(`${Option.sf} : diffrence with blackscholes : ${Math.floor(((blackscholes - Option.bsp)/blackscholes) * 100)}% , and the black scholes is ; ${blackscholes}`)
                                }
                            }
                            resolve(true);
                        })
                })
        })
    }
    async DeltaCalculate(OptionName) {              //mohasebe delta baraye option 
        return new Promise((resolve) => {
            let Option = this.marketinfo.find(share => share.sf == OptionName);
            let Baseoption;
            this.config.OptionWhitelist.forEach(Base => {
                if (Option.cn.search(Base.BaseName) != -1) {
                    Baseoption = this.marketinfo.find(item => item.nc == Base.BaseID);
                }
            })
            this.getStockInfo(Option.nc)
                .then(Stock => {
                    let startdate = Stock.symbolinfo.sd;
                    let enddate = Stock.symbolinfo.ed;
                    let startdatearr = startdate.split("/");
                    let enddatearr = enddate.split("/");
                    let priceoption = [];
                    startdate = Convert_to_JalaliDate(startdatearr[0], startdatearr[1], startdatearr[2]);
                    enddate = Convert_to_JalaliDate(enddatearr[0], enddatearr[1], enddatearr[2]);
                    let today = new Date();
                    let oneday = 24 * 60 * 60 * 1000;
                    let optionTime = Math.floor((enddate - startdate) / oneday);
                    console.log(Option.sf);
                    // console.log(`Time to add is : ${ this.Truenumber(optionTime)}`);
                    // console.log(`the Option Time is : ${optionTime}`);
                    this.getChartData(Baseoption.nc, 365)
                        .then((data) => {
                            data.forEach((sharedata, index) => {
                                priceoption.push(sharedata.prices[0]);
                            })
                            let returns = [];
                            for (let i = 1; i < priceoption.length; i++) {
                                returns.push(Math.log(priceoption[i] / priceoption[i - 1]));
                            }
                            const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
                            const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (returns.length - 1);
                            const dailyVolatility = Math.sqrt(variance);
                            const annualVolatility = dailyVolatility * Math.sqrt(priceoption.length);
                            let timeEmal = Math.floor((enddate - today) / oneday) + 2;
                            let sigma = annualVolatility;
                            let S = Baseoption.ltp;
                            let K = parseFloat(Option.cn.split("-")[1]);
                            let r = 0.3;
                            let T = timeEmal/365;
                            let delta = 0;
                            const d1 = (Math.log(S / K) + (r + 0.5 * Math.pow(sigma, 2)) * T) / (sigma * Math.sqrt(T));
                            if (Option.nc.search("O9") == 2) {
                                delta = Math.round(this.cumulativeNormalDistribution(d1) * 100) / 100;
                            } else if (Option.nc.search("OF") == 2) {
                                delta = Math.round((this.cumulativeNormalDistribution(d1) - 1) * 100) / 100;
                            } else {
                                throw new Error('Invalid option type');
                            }
                            // console.log(`The Value that api return is : ${priceoption.length}`);
                            // console.log(`Sigma is :${sigma}`);
                            // console.log(`remaining time to emal is :${timeEmal}`);
                            // console.log(`Base Share price is :${S}`);
                            // console.log(`Emal Price is :${K}`);
                            // console.log(`T is :${T}`);
                            if(Option.nc.search("O9") == 2)
                                console.log(`Black schols is : ${this.blackScholes(S , K ,  T , r , sigma , 'call')}`);
                            if(Option.nc.search("OF") == 2)
                                console.log(`black schols is : ${this.blackScholes(S , K ,  T ,r , sigma , 'put')}`);
                            console.log(`delta is : ${delta}`);
                            resolve(delta);
                        })
                })
        })
    }
    Truenumber(numberofdays)
    {
        let days_to_add = numberofdays/7 * 2;
        let last_number = numberofdays/7 * 2;
        while(true)
        {
            if(last_number / 7 > 1)
            {
                days_to_add += (last_number / 7) *2;
                last_number = (last_number / 7) * 2;
            }
            else
            {
                break;
            }
        }
        return Math.floor(days_to_add);
    }
    
    DivideBalance(DeltaBuy, DeltaSell, OptionNameBuy, OptionNameSell, itemBalance1, itemBalance2) {  //taghsis balance bar asas delta va baghi formol
        let OptionBuyInMarket = this.marketinfo.find(item => item.sf == OptionNameBuy);
        let OptionSellInMarket = this.marketinfo.find(item => item.sf == OptionNameSell);
        let ShareBase;
        this.config.OptionWhitelist.forEach((Base) => {
            if (OptionBuyInMarket.cn.search(Base.BaseName) != -1) {
                ShareBase = this.marketinfo.find(item => item.nc == Base.BaseID);
            }
        })
        let EmalBuy = OptionBuyInMarket.cn.split("-")[1];
        let EmalSell = OptionSellInMarket.cn.split("-")[1];
        let CalculateLevragSell = (EmalSell / ShareBase.cp) * (OptionSellInMarket.bsp / Math.abs(DeltaSell));
        let CalculateLevrageBuy = (ShareBase.cp / EmalBuy) * (OptionBuyInMarket.bsp / Math.abs(DeltaBuy));
        let BuyPercent = (CalculateLevragSell / (CalculateLevrageBuy + CalculateLevragSell)).toFixed(2);

        this.whitelist.find(item => item.OptionBuyName == OptionNameBuy && item.OptionSellName == OptionNameSell).BalanceBuy = BuyPercent;
        itemBalance1.textContent = BuyPercent;
        itemBalance2.textContent = 1 - BuyPercent;
    }
    getwhitelist()  //daryaft whitelist
    {
        var theString = localStorage.getItem(this.whitelistkey);
        if (theString == null)
            return [];
        return JSON.parse(theString);
    }
    getPackets() {  //daryasft packet az cach
        var theString = localStorage.getItem(this.packetitemskey);
        if (theString == null)
            return [];
        return JSON.parse(theString);
    }
    savewhitelist()
    {
        localStorage.setItem(this.whitelistkey, JSON.stringify(this.whitelist));
    }
    buyoptions(share) {
        return new Promise((resolve, reject) => {
            this.config.sendbuyoptionorderheaders.body = {};
            this.config.sendbuyoptionorderheaders.body["IsSymbolCautionAgreement"] = false;
            this.config.sendbuyoptionorderheaders.body["CautionAgreementSelected"] = false;
            this.config.sendbuyoptionorderheaders.body["IsSymbolSepahAgreement"] = false;
            this.config.sendbuyoptionorderheaders.body["orderCount"] = share.count;
            this.config.sendbuyoptionorderheaders.body["orderPrice"] = share.price;
            this.config.sendbuyoptionorderheaders.body["FinancialProviderId"] = 1;
            this.config.sendbuyoptionorderheaders.body["minimumQuantity"] = 0;
            this.config.sendbuyoptionorderheaders.body["maxShow"] = 0;
            this.config.sendbuyoptionorderheaders.body["orderId"] = 0;
            this.config.sendbuyoptionorderheaders.body["isin"] = share.nc;
            this.config.sendbuyoptionorderheaders.body["orderSide"] = 65;
            this.config.sendbuyoptionorderheaders.body["orderValidity"] = 74;
            this.config.sendbuyoptionorderheaders.body["orderValiditydate"] = null;
            this.config.sendbuyoptionorderheaders.body["shortSellIncentivePercent"] = 0;
            this.config.sendbuyoptionorderheaders.body["shortSellIsEnabled"] = false;
            this.config.sendbuyoptionorderheaders.body = JSON.stringify(
                this.config.sendbuyoptionorderheaders.body
            );
            fetch(
                this.config.sendbuyoptionorder,
                this.config.sendbuyoptionorderheaders
            )
                .then((x) => x.json())
                .then((buyResponse) => {
                    if (buyResponse.data && !buyResponse.data.IsSuccessfull) {
                        console.log("Ok");
                    } else {
                        console.log(
                            buyResponse
                        );
                        resolve(buyResponse);
                    }
                })
                .catch((ex) => {
                    console.log(ex);
                    reject(ex);
                });
        });
    }
    CheckForProfit() {              //barasi sood o zarar
        this.packetitems.forEach((packet , counter) =>{
            if(packet.RobotName == "DeltaHedging")
            {
                let BuyOptionInPortfo = this.portfolio.find(item => item.SymbolISIN == packet.BuyOptionID);
                let SellOptionInPortfo = this.portfolio.find(item => item.SymbolISIN == packet.SellOptionID);
                if (BuyOptionInPortfo != null && SellOptionInPortfo != null) {
                    if (BuyOptionInPortfo.RemainQuantity != 0 && SellOptionInPortfo.RemainQuantity != 0) {
                        let BuyOptionInMarket = this.marketinfo.find(item => item.nc == packet.BuyOptionID);
                        let SellOptionInMarket = this.marketinfo.find(item => item.nc == packet.SellOptionID);
                        let PriceAvrageBuy = packet.BuyOptionQuantity * packet.BuyedPriceBuyOption /  packet.BuyOptionQuantity;
                        let PriceAvrageSell = packet.SellOptionQuantity * packet.BuyedPriceSellOption / packet.SellOptionQuantity;
                        let totalBuy = packet.BuyOptionQuantity;
                        let totalSell = packet.SellOptionQuantity;
                        if(packet.BuyOptionQuantity <= BuyOptionInPortfo.RemainQuantity && packet.SellOptionQuantity <= SellOptionInPortfo.RemainQuantity)
                        {
                            if(packet.BuyOptionQuantity < BuyOptionInPortfo.RemainQuantity && packet.SellOptionQuantity < SellOptionInPortfo.RemainQuantity)
                            {
                                this.packetitems.forEach((item , index) =>{
                                    if(index != counter && item.RobotName == "DeltaHedging")
                                    {
                                        if(item.BuyOptionID == packet.BuyOptionID && item.SellOptionID == packet.SellOptionID)
                                        {
                                            PriceAvrageBuy = (PriceAvrageBuy * totalBuy + item.BuyedPriceBuyOption * item.BuyOptionQuantity)/(totalBuy + item.BuyOptionQuantity);
                                            totalBuy += item.BuyOptionQuantity;
                                            PriceAvrageSell = (PriceAvrageSell * totalSell + item.BuyedPriceSellOption * item.SellOptionQuantity)/(totalSell + item.SellOptionQuantity);
                                            totalSell += item.SellOptionQuantity;
                                        }
                                    }
                                })
                            }
                            let RiyalValuebuy = totalBuy * PriceAvrageBuy * 1000;
                            let RiyalValuesell = totalSell * PriceAvrageSell * 1000;
                            this.packetitems[counter].InProfit = Math.floor((((totalBuy * 1000 * BuyOptionInMarket.bbp) + (totalSell* 1000 * SellOptionInMarket.bbp)) / (RiyalValuebuy + RiyalValuesell) - 1) * 100);
                            this.savepackets();
                            if (((totalBuy * 1000 * BuyOptionInMarket.bbp) + (totalSell * 1000 * SellOptionInMarket.bbp)) / (RiyalValuebuy + RiyalValuesell) >= 1.02) {
                                var SellBuyOption =
                                {
                                    count: totalBuy,
                                    bestbuyprice: BuyOptionInMarket.bbp,
                                    ID: packet.BuyOptionID
                                }
                                var SellSellOption =
                                {
                                    count: totalSell,
                                    bestbuyprice: SellOptionInMarket.bbp,
                                    ID: packet.SellOptionID
                                }
                                let success = false;
                                this.sellOptions(SellBuyOption)
                                    .then(res => {
                                        if (res.IsSuccessfull) {
                                            console.log(`Hamash Goshte Lamasab ${packet.OptionBuyName}`);
                                            success = true;
                                        }
                                    }).catch(err => {
                                        console.log(`Error In SellBuyOption : ${err}`);
                                    })
                                setTimeout(() => {
                                    this.sellOptions(SellSellOption)
                                        .then(res => {
                                            if (res.IsSuccessfull) {
                                                console.log(`Hamash Goshte Lamasab ${packet.OptionSellName}`);
                                                if(success)
                                                {
                                                    this.packetitems.splice(counter, 1);
                                                    this.savepackets();
                                                }
                                            }
                                        })
                                }, 500)
                            }
                        }
                    }
                }
            }
        });
    }

    ShowForceExit(packet)   //namayesh zarar ba khoroj ezterari
    {
        return new Promise((resolve) => {
            if(packet.RobotName == "DeltaHedging" && packet.BuyedBefor)
            {
                this.getStockInfo(packet.BuyOptionID)
                .then(stockbuy =>{
                    this.getStockInfo(packet.SellOptionID)
                    .then(stocksell =>
                    {
                        let TedadBuy = packet.BuyOptionQuantity;
                        let averagebuy = 0;
                        let gotonextrow = false;
                        for(let i = 0;i<=5 && TedadBuy > 0;i++)
                        {
                            if(packet.BuyOptionQuantity >1000)
                            {
                                if(stockbuy.symbolqueue.Value[i].BestBuyQuantity >= 1000)
                                {
                                    averagebuy += 1000 * stockbuy.symbolqueue.Value[i].BestBuyPrice;
                                    TedadBuy -= 1000;
                                    stockbuy.symbolqueue.Value[i].BestBuyQuantity -= 1000;
                                }
                                else
                                {
                                    averagebuy += stockbuy.symbolqueue.Value[i].BestBuyQuantity * stockbuy.symbolqueue.Value[i].BestBuyPrice;
                                    TedadBuy -= stockbuy.symbolqueue.Value[i].BestBuyQuantity;
                                    stockbuy.symbolqueue.Value[i].BestBuyQuantity = 0;
                                    gotonextrow = true;
                                }
                            }
                            else
                            {
                                if(stockbuy.symbolqueue.Value[i].BestBuyQuantity > TedadBuy)
                                {
                                    averagebuy += TedadBuy * stockbuy.symbolqueue.Value[i].BestBuyPrice;
                                    TedadBuy = 0; 
                                }
                                else
                                {
                                    averagebuy += stockbuy.symbolqueue.Value[i].BestBuyQuantity * stockbuy.symbolqueue.Value[i].BestBuyPrice;
                                    TedadBuy -= stockbuy.symbolqueue.Value[i].BestBuyQuantity;
                                    stockbuy.symbolqueue.Value[i].BestBuyQuantity = 0;
                                    gotonextrow = true;
                                }
                            }
                            if(!gotonextrow)
                                i--;
                        }
                        let avragesell = 0;
                        let tedadadsell = packet.SellOptionQuantity;
                        gotonextrow = false;
                        for(let i = 0;i<=5 && tedadadsell > 0;i++)
                        {
                            if(packet.SellOptionQuantity >1000)
                            {
                                if(stocksell.symbolqueue.Value[i].BestBuyQuantity >= 1000)
                                {
                                    avragesell += 1000 * stocksell.symbolqueue.Value[i].BestBuyPrice;
                                    tedadadsell -= 1000;
                                    stocksell.symbolqueue.Value[i].BestBuyQuantity -= 1000;
                                }
                                else
                                {
                                    avragesell += stocksell.symbolqueue.Value[i].BestBuyQuantity * stocksell.symbolqueue.Value[i].BestBuyPrice;
                                    tedadadsell -= stocksell.symbolqueue.Value[i].BestBuyQuantity;
                                    stocksell.symbolqueue.Value[i].BestBuyQuantity = 0;
                                    gotonextrow = true;
                                }
                            }
                            else
                            {
                                if(stocksell.symbolqueue.Value[i].BestBuyQuantity > tedadadsell)
                                {
                                    avragesell += tedadadsell * stocksell.symbolqueue.Value[i].BestBuyPrice;
                                    tedadadsell = 0; 
                                }
                                else
                                {
                                    avragesell += stocksell.symbolqueue.Value[i].BestBuyQuantity * stocksell.symbolqueue.Value[i].BestBuyPrice;
                                    tedadadsell -= stocksell.symbolqueue.Value[i].BestBuyQuantity;
                                    stocksell.symbolqueue.Value[i].BestBuyQuantity = 0;
                                    gotonextrow = true;
                                }
                            }
                            if(!gotonextrow)
                                i--;

                        }
                        resolve(Math.floor((((averagebuy  * 1000 + avragesell  * 1000))/(packet.BuyedPriceBuyOption * packet.BuyOptionQuantity * 1000 + packet.BuyedPriceSellOption * packet.SellOptionQuantity * 1000) - 1) * 100));
                    })
                })
            }
        })
    }
    
    ForceExit(packet)   //khoroj ezterari
    {
        if(packet.RobotName == "DeltaHedging" && packet.BuyedBefor)
            {
                this.getStockInfo(packet.BuyOptionID)
                .then(stockbuy =>{
                    this.getStockInfo(packet.SellOptionID)
                    .then(stocksell =>
                    {
                        var packettosellputoption = 
                        {
                            count: 0,
                            bestbuyprice: 0,
                            ID: ""
                        }
                        var packettosellcalloption = 
                        {
                            count: 0,
                            bestbuyprice: 0,
                            ID: ""
                        }
                        var packets_to_sell_putoption = [];
                        var packets_to_sell_calloption = [];
                        let TedadBuy = packet.BuyOptionQuantity;
                        let averagebuy = 0;
                        let gotonextrow = false;
                        for(let i = 0;i<=5 && TedadBuy > 0;i++)
                        {
                            if(packet.BuyOptionQuantity >1000)
                            {
                                if(stockbuy.symbolqueue.Value[i].BestBuyQuantity >= 1000)
                                {
                                    packettosellcalloption.count = 1000;
                                    packettosellcalloption.bestbuyprice = stockbuy.symbolqueue.Value[i].BestBuyPrice;
                                    packettosellcalloption.ID = packet.BuyOptionID;
                                    packets_to_sell_calloption.push(packettosellcalloption);
                                    averagebuy += 1000 * stockbuy.symbolqueue.Value[i].BestBuyPrice;
                                    TedadBuy -= 1000;
                                    stockbuy.symbolqueue.Value[i].BestBuyQuantity -= 1000;
                                }
                                else
                                {
                                    packettosellcalloption.count = stockbuy.symbolqueue.Value[i].BestBuyQuantity;
                                    packettosellcalloption.bestbuyprice = stockbuy.symbolqueue.Value[i].BestBuyPrice;
                                    packettosellcalloption.ID = packet.BuyOptionID;
                                    packets_to_sell_calloption.push(packettosellcalloption);
                                    averagebuy += stockbuy.symbolqueue.Value[i].BestBuyQuantity * stockbuy.symbolqueue.Value[i].BestBuyPrice;
                                    TedadBuy -= stockbuy.symbolqueue.Value[i].BestBuyQuantity;
                                    stockbuy.symbolqueue.Value[i].BestBuyQuantity = 0;
                                    gotonextrow = true;
                                }
                            }
                            else
                            {
                                if(stockbuy.symbolqueue.Value[i].BestBuyQuantity > TedadBuy)
                                {
                                    packettosellcalloption.count = TedadBuy;
                                    packettosellcalloption.bestbuyprice = stockbuy.symbolqueue.Value[i].BestBuyPrice;
                                    packettosellcalloption.ID = packet.BuyOptionID;
                                    packets_to_sell_calloption.push(packettosellcalloption);
                                    averagebuy += TedadBuy * stockbuy.symbolqueue.Value[i].BestBuyPrice;
                                    TedadBuy = 0; 
                                }
                                else
                                {
                                    packettosellcalloption.count = stockbuy.symbolqueue.Value[i].BestBuyQuantity;
                                    packettosellcalloption.bestbuyprice = stockbuy.symbolqueue.Value[i].BestBuyPrice;
                                    packettosellcalloption.ID = packet.BuyOptionID;
                                    packets_to_sell_calloption.push(packettosellcalloption);
                                    averagebuy += stockbuy.symbolqueue.Value[i].BestBuyQuantity * stockbuy.symbolqueue.Value[i].BestBuyPrice;
                                    TedadBuy -= stockbuy.symbolqueue.Value[i].BestBuyQuantity;
                                    stockbuy.symbolqueue.Value[i].BestBuyQuantity = 0;
                                    gotonextrow = true;
                                }
                            }
                            if(!gotonextrow)
                                i--;
                        }
                        let avragesell = 0;
                        let tedadadsell = packet.SellOptionQuantity;
                        gotonextrow = false;
                        for(let i = 0;i<=5 && tedadadsell > 0;i++)
                        {
                            if(packet.SellOptionQuantity >1000)
                            {
                                if(stocksell.symbolqueue.Value[i].BestBuyQuantity >= 1000)
                                {
                                    packettosellputoption.count = 1000;
                                    packettosellputoption.bestbuyprice = stocksell.symbolqueue.Value[i].BestBuyPrice;
                                    packettosellputoption.ID = packet.SellOptionID;
                                    packets_to_sell_putoption.push(packettosellputoption);
                                    avragesell += 1000 * stocksell.symbolqueue.Value[i].BestBuyPrice;
                                    tedadadsell -= 1000;
                                    stocksell.symbolqueue.Value[i].BestBuyQuantity -= 1000;
                                }
                                else
                                {
                                    packettosellputoption.count = stocksell.symbolqueue.Value[i].BestBuyQuantity;
                                    packettosellputoption.bestbuyprice = stocksell.symbolqueue.Value[i].BestBuyPrice;
                                    packettosellputoption.ID = packet.SellOptionID;
                                    packets_to_sell_putoption.push(packettosellputoption);
                                    avragesell += stocksell.symbolqueue.Value[i].BestBuyQuantity * stocksell.symbolqueue.Value[i].BestBuyPrice;
                                    tedadadsell -= stocksell.symbolqueue.Value[i].BestBuyQuantity;
                                    stocksell.symbolqueue.Value[i].BestBuyQuantity = 0;
                                    gotonextrow = true;
                                }
                            }
                            else
                            {
                                if(stocksell.symbolqueue.Value[i].BestBuyQuantity > tedadadsell)
                                {
                                    packettosellputoption.count = tedadadsell;
                                    packettosellputoption.bestbuyprice = stocksell.symbolqueue.Value[i].BestBuyPrice;
                                    packettosellputoption.ID = packet.SellOptionID;
                                    packets_to_sell_putoption.push(packettosellputoption);
                                    avragesell += tedadadsell * stocksell.symbolqueue.Value[i].BestBuyPrice;
                                    tedadadsell = 0; 
                                }
                                else
                                {
                                    packettosellputoption.count = stocksell.symbolqueue.Value[i].BestBuyQuantity;
                                    packettosellputoption.bestbuyprice = stocksell.symbolqueue.Value[i].BestBuyPrice;
                                    packettosellputoption.ID = packet.SellOptionID;
                                    packets_to_sell_putoption.push(packettosellputoption);
                                    avragesell += stocksell.symbolqueue.Value[i].BestBuyQuantity * stocksell.symbolqueue.Value[i].BestBuyPrice;
                                    tedadadsell -= stocksell.symbolqueue.Value[i].BestBuyQuantity;
                                    stocksell.symbolqueue.Value[i].BestBuyQuantity = 0;
                                    gotonextrow = true;
                                }
                            }
                            if(!gotonextrow)
                                i--;

                        }
                        packets_to_sell_calloption.forEach(packet_to_sell_call => {
                            setTimeout(()=>{
                                this.sellOptions(packet_to_sell_call);
                            },350)
                        })
                        packets_to_sell_putoption.forEach(packet_to_sell_put => {
                            setTimeout(()=>{
                                this.sellOptions(packet_to_sell_put);
                            },350)
                        })
                        // console.log(`${packet.OptionSellName} - ${JSON.stringify(packets_to_sell_putoption)}`);
                        // console.log(`${packet.OptionBuyName} - ${JSON.stringify(packets_to_sell_calloption)}`);
                    })
                })
            }
    }
    ShowTheItemsInTable()   //namayesh dar table
    {
        let table = document.getElementById('table-body');
        let rows = table.childNodes;
        this.packetitems.forEach((packet , index) =>{
            let callOption = packet.OptionBuyName;
            let putOption = packet.OptionSellName;
            let profitPercentage = packet.InProfit;
            this.ShowForceExit(packet)
                .then(forceextipercent =>
                    {
                    let forceExitPercentage =  forceextipercent;
                    for (let i = 0; i < rows.length; i++) {
                        const row = rows[i];
                        if (row.nodeType === 1 && row.nodeName === 'TR') {
                            const existingCallOption = row.childNodes[1].innerText;
                            const existingPutOption = row.childNodes[2].innerText;
                
                            if (existingCallOption === callOption && existingPutOption === putOption) {
                                row.childNodes[3].innerText = profitPercentage + '%';
                                row.childNodes[3].style.color = profitPercentage >= 0 ? 'green' : 'red';
                                return; 
                            }
                        }
                    }
                    const newRow = table.insertRow();
                    newRow.id = 'table-row';
                    const cell1 = newRow.insertCell(0); 
                    const cell2 = newRow.insertCell(1); 
                    const cell3 = newRow.insertCell(2); 
                    const cell4 = newRow.insertCell(3); 
                    const cell5 = newRow.insertCell(4); 
                    const cell6 = newRow.insertCell(5);
                    const cell7 = newRow.insertCell(6);
                    cell1.innerText = index; 
                    cell2.innerText = callOption;
                    cell3.innerText = putOption;
                    cell4.innerText = profitPercentage + '%';
                    cell4.style.color = profitPercentage >= 0 ? 'green' : 'red';
                    const AvrageButton = document.createElement('button');
                    AvrageButton.innerText = 'Reduce the Avrage';
                    AvrageButton.id = `AvragebuttonInTable-${index}`;
                    AvrageButton.style.background = 'green';
                    cell6.appendChild(AvrageButton);
                    const updownbutton = document.createElement('input');
                    updownbutton.type = "number";
                    updownbutton.value = packet.Profit;
                    updownbutton.id = `updownbutton-${index}`;
                    const forceExitBtn = document.createElement('button');
                    forceExitBtn.id = `buttonInTable-${index}`;
                    forceExitBtn.innerText = forceExitPercentage + '%';
                    forceExitBtn.style.backgroundColor = forceExitPercentage >= 0 ? 'green' : 'red';
                    cell5.appendChild(forceExitBtn);
                })
        })
    }

    FindWhitelist()         //tabe peyda kardan whitelist baraye safollah
    {
        if(this.marketinfo.length == 0)
            setTimeout(()=>{
                this.FindWhitelist();
            } , 3000);
        let whitelisttoadd = 
        {
            OptionBuyName : "",
            OptionSellName : "",
            color:"",
            Selected:false,
            BalanceBuy : ""
        }
        this.marketinfo.forEach(Share => {
            this.config.OptionWhitelist.forEach(Base => {
                if (Share.cn.search(Base.BaseName) != -1) {
                    if (Share.nc.search("O9") == 2) {
                        this.marketinfo.forEach(Share2 =>{
                            if(Share2.cn.search(Base.BaseName) != -1 && Share2.nc.search("OF") == 2)
                            {
                                if(Share.cn.split("-")[1] <= Share2.cn.split("-")[1])
                                {
                                    let tedadday = 2;
                                    if(this.DayoftheWeek() == 0)
                                    {
                                        tedadday = 4;
                                    }
                                    this.getChartData(Share.nc , tedadday)
                                        .then(data1 =>{
                                            if(data1.length == 0)
                                                return;
                                            data1 = data1[0];
                                            this.getChartData(Share2.nc , tedadday)
                                                .then(data2 =>{
                                                    if(data2.length == 0)
                                                        return;
                                                    data2 = data2[0];
                                                    let volume1 = data1.volumes[0] * 1000 * data1.prices[0];
                                                    let volume2 = data2.volumes[0] * 1000 * data2.prices[0];
                                                    if(volume1 > 1000000000 && volume2 > 1000000000)
                                                        {
                                                            let sarresid1 = Share.cn.split("-")[2];
                                                            let sarresid2 = Share2.cn.split("-")[2];
                                                            let date1 = Convert_to_JalaliDate(sarresid1.split("/")[0] , sarresid1.split("/")[1] , sarresid1.split("/")[2]);
                                                            let date2 = Convert_to_JalaliDate(sarresid2.split("/")[0] , sarresid2.split("/")[1] , sarresid2.split("/")[2]);
                                                            if(date1 >= date2)
                                                            {
                                                                // console.log(Share.sf);
                                                                // console.log(Share2.sf);
                                                                let color;
                                                                if(volume2 > 50000000000 || volume1 > 50000000000)
                                                                {
                                                                    if(Share.cn.split("-")[1] < Share2.cn.split("-")[1])
                                                                    {
                                                                        color = "#004f16";
                                                                    }
                                                                    else
                                                                    {
                                                                        color = "#00ff2f";
                                                                    }
                                                                }
                                                                else
                                                                {
                                                                    if(Share.cn.split("-")[1] < Share2.cn.split("-")[1])
                                                                    {
                                                                        color = "#9f8a00";
                                                                    }
                                                                    else
                                                                    {
                                                                        color = "#c97900";
                                                                    }
                                                                }
                                                                //this.deleteduplicate();
                                                                // this.savewhitelist();
                                                                // this.whitelist = this.getwhitelist();
                                                                // whitelisttoadd.OptionBuyName = Share.sf;
                                                                // whitelisttoadd.OptionSellName = Share2.sf;
                                                                // whitelisttoadd.color = "#15a31a";
                                                                if(this.whitelist.find(item => item.OptionBuyName == Share.sf && item.OptionSellName == Share2.sf) == null)
                                                                {
                                                                    this.whitelist.push({
                                                                        OptionBuyName : Share.sf,
                                                                        OptionSellName : Share2.sf,
                                                                        color: color,
                                                                        Selected:false,
                                                                        BalanceBuy : ""
                                                                    });
                                                                }
                                                                // this.savewhitelist();
                                                            }
                                                        }
                                                })
                                        })
                                }
                            }
                        })
                    }
                }
            })
        });
    }

    deleteduplicate()       //delete tamami maghadir whitelist
    {
        this.whitelist.splice(0 , this.whitelist.length);
    }
    sellOptions(Entitytosell) {
        return new Promise((resolve, reject) => {
            this.config.sendbuyoptionorderheaders.body = {};
            this.config.sendbuyoptionorderheaders.body["IsSymbolCautionAgreement"] = false;
            this.config.sendbuyoptionorderheaders.body["CautionAgreementSelected"] = false;
            this.config.sendbuyoptionorderheaders.body["IsSymbolSepahAgreement"] = false;
            this.config.sendbuyoptionorderheaders.body["orderCount"] = Entitytosell.count;
            this.config.sendbuyoptionorderheaders.body["orderPrice"] = Entitytosell.bestbuyprice;
            this.config.sendbuyoptionorderheaders.body["FinancialProviderId"] = 1;
            this.config.sendbuyoptionorderheaders.body["minimumQuantity"] = 0;
            this.config.sendbuyoptionorderheaders.body["maxShow"] = 0;
            this.config.sendbuyoptionorderheaders.body["orderId"] = 0;
            this.config.sendbuyoptionorderheaders.body["isin"] = Entitytosell.ID;
            this.config.sendbuyoptionorderheaders.body["orderSide"] = "86";
            this.config.sendbuyoptionorderheaders.body["orderValidity"] = 74;
            this.config.sendbuyoptionorderheaders.body["orderValiditydate"] = null;
            this.config.sendbuyoptionorderheaders.body["shortSellIncentivePercent"] = 0;
            this.config.sendbuyoptionorderheaders.body["shortSellIsEnabled"] = false;
            this.config.sendbuyoptionorderheaders.body = JSON.stringify(
                this.config.sendbuyoptionorderheaders.body
            );
            fetch(
                this.config.sendbuyoptionorder,
                this.config.sendbuyoptionorderheaders
            )
                .then((x) => x.json())
                .then((buyResponse) => {
                    if (buyResponse.data && !buyResponse.data.IsSuccessfull) {
                        console.log("Ok");
                        // TODO: log here
                    } else {
                        console.log(
                            buyResponse
                        );
                        resolve(buyResponse);
                    }
                })
                .catch((ex) => {
                    console.log(ex);
                    reject(ex);
                });
        });
    }
    savepackets() {
        localStorage.setItem(this.packetitemskey, JSON.stringify(this.packetitems));
    }
    getconfig() {
        var defaultConfig = {
            OptionWhitelist:
                [
                    {
                        "BaseName": "شستا",
                        "BaseID": "IRO1TAMN0001",
                        "Trigger" : true,
                        "Volume" : 0
                    },
                    {
                        "BaseName": "خودرو",
                        "BaseID": "IRO1IKCO0001",
                        "Trigger" : true,
                        "Volume" : 0
                    },
                    {
                        "BaseName": "اهرم",
                        "BaseID": "IRT1AHRM0001",
                        "Trigger" : true,
                        "Volume" : 0
                    },
                    {
                        "BaseName": "خساپا",
                        "BaseID": "IRO1SIPA0001",
                        "Trigger" : true,
                        "Volume" : 0
                    },
                    {   
                        "BaseName": "موج",
                        "BaseID": "IRT3MOJF0001",
                        "Trigger" : true,
                        "Volume" : 0
                    },
                    {
                        "BaseName" : "وتجارت",
                        "BaseID":"IRO1BTEJ0001",
                        "Trigger" : false,
                        "Volume" : 0
                    },
                    {
                        "BaseName" : "وبملت",
                        "BaseID":"IRO1BMLT0001",
                        "Trigger" : false,
                        "Volume" : 0
                    },
                    {
                        "BaseName" : "وبصادر",
                        "BaseID":"IRO1BSDR0001",
                        "Trigger" : false,
                        "Volume" : 0
                    },
                    {
                        "BaseName" : "ذوب",
                        "BaseID":"IRO1ZOBI0001",
                        "Trigger" : false,
                        "Volume" : 0
                    },
                    {
                        "BaseName" : "فملی",
                        "BaseID":"IRO1MSMI0001",
                        "Trigger" : false,
                        "Volume" : 0
                    },
                    {
                        "BaseName" : "فولاد",
                        "BaseID":"IRO1FOLD0001",
                        "Trigger" : false,
                        "Volume" : 0
                    },
                    {
                        "BaseName" : "شتاب",
                        "BaseID":"IRT1SHTF0001",
                        "Trigger" : false,
                        "Volume" : 0
                    },
                    {
                        "BaseName" : "شپنا",
                        "BaseID":"IRO1PNES0001",
                        "Trigger" : false,
                        "Volume" : 0
                    },
                    {
                        "BaseName" : "فاراک",
                        "BaseID":"IRO1MARK0001",
                        "Trigger" : false,
                        "Volume" : 0
                    },
                    {
                        "BaseName" : "خاور",
                        "BaseID":"IRO1BKHZ0001",
                        "Trigger" : false,
                        "Volume" : 0
                    },
                    {
                        "BaseName" : "کاریس",
                        "BaseID":"IRT3SSKF0001",
                        "Trigger" : false,
                        "Volume" : 0
                    },
                    {
                        "BaseName" : "هم وزن",
                        "BaseID":"IRT3KNIF0001",
                        "Trigger" : false,
                        "Volume" : 0
                    },
                    {
                        "BaseName" : "ارزش",
                        "BaseID":"IRT3PADF0001",
                        "Trigger" : false,
                        "Volume" : 0
                    },
                    {
                        "BaseName" : "بیدار",
                        "BaseID":"IRT1SEPR0001",
                        "Trigger" : false,
                        "Volume" : 0
                    },
                    {
                        "BaseName" : "جهش",
                        "BaseID":"IRT1JHSH0001",
                        "Trigger" : false,
                        "Volume" : 0
                    },
                    {
                        "BaseName" : "توان",
                        "BaseID":"IRT3TVAF0001",
                        "Trigger" : false,
                        "Volume" : 0
                    },
                    {
                        "BaseName" : "کرمان",
                        "BaseID":"",
                        "Trigger" : false,
                        "Volume" : 0
                    },
                    {
                        "BaseName" : "لبخند",
                        "BaseID":"IRT3LABF0001",
                        "Trigger" : false,
                        "Volume" : 0
                    },
                    {
                        "BaseName" : "وساپا",
                        "BaseID":"IRO1SSAP0001",
                        "Trigger" : false,
                        "Volume" : 0
                    },
                    {
                        "BaseName" : "وکغدیر",
                        "BaseID":"IRO1TMGD0001",
                        "Trigger" : false,
                        "Volume" : 0
                    },
                    {
                        "BaseName" : "فخوز",
                        "BaseID":"IRO1FKHZ0001",
                        "Trigger" : false,
                        "Volume" : 0
                    },
                    {
                        "BaseName" : "فرابورس",
                        "BaseID":"IRO3FRBZ0001",
                        "Trigger" : false,
                        "Volume" : 0
                    },
                    {
                        "BaseName" : "فصبا",
                        "BaseID":"IRO3SBLZ0001",
                        "Trigger" : false,
                        "Volume" : 0
                    },
                    {
                        "BaseName" : "ورنا",
                        "BaseID":"IRT3RUNF0001",
                        "Trigger" : false,
                        "Volume" : 0
                    },
                    {
                        "BaseName" : "آساس",
                        "BaseID":"IRT3SSAF0001",
                        "Trigger" : false,
                        "Volume" : 0
                    },
                    {
                        "BaseName" : "حفارس",
                        "BaseID":"IRO1HFRS0001",
                        "Trigger" : false,
                        "Volume" : 0
                    },
                    {
                        "BaseName" : "خگستر",
                        "BaseID":"IRO1GOST0001",
                        "Trigger" : false,
                        "Volume" : 0
                    },
                    {
                        "BaseName" : "خودران",
                        "BaseID":"IRT1KHOD0001",
                        "Trigger" : false,
                        "Volume" : 0
                    },
                    {
                        "BaseName" : "نارنج اهرم",
                        "BaseID":"IRT3NRJF0001",
                        "Trigger" : false,
                        "Volume" : 0
                    }
                ],
            enabled: false,
            interval: 300,
            oneHunderdK: 1000 * 1000,
            marketOpenTime: new Date().setHours(9, 0, 0, 0),
            marketCloseTime: new Date().setHours(12, 30, 0, 0),
            marketselltheRemaining: new Date().setHours(12, 29, 30, 0),
            getMarketUrl: "https://core.tadbirrlc.com//StocksHandler.ashx?{%22Type%22:%22ALL21%22,%22la%22:%22Fa%22}",
            stockInfoUrl: "https://core.tadbirrlc.com/StockFutureInfoHandler.ashx?{%22Type%22:%22getLightSymbolInfoAndQueue%22,%22la%22:%22Fa%22,%22nscCode%22:%22{{symbol}}%22}",
            modifyOrderUrl: "https://silver.mobinsb.com/Customer/UpdateOrder",
            ChartData: "https://rlcchartapi.tadbirrlc.ir/ChartData/priceHistory?symbol={{symbol}}&resolution=D&beforeDays={{NumberOfDays}}&outType=splineArea",
            Secondtable:`https://core.tadbirrlc.com//AlmasDataHandler?%7B%22Type%22:%22getSymbolFundamentalInfo%22,%22la%22:%22Fa%22,%22nscCode%22:%22{{symbol}}%22%7D&jsoncallback=`,
            modifyOrderHeaders: {
                "credentials": "include",
                "headers": {
                    "accept": "*/*",
                    "accept-language": "en-US,en;q=0.9,fa;q=0.8",
                    "content-type": "application/json",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "same-origin",
                    "x-requested-with": "XMLHttpRequest"
                },
                "referrer": document.location.href,
                "referrerPolicy": "no-referrer-when-downgrade",
                "body": {
                    "IsSymbolCautionAgreement": false,
                    "CautionAgreementSelected": false,
                    "IsSymbolSepahAgreement": false,
                    "SepahAgreementSelected": false,
                    "orderCount": 0,
                    "orderPrice": 0,
                    "FinancialProviderId": 1,
                    "minimumQuantity": "",
                    "maxShow": 0,
                    "orderId": 0,
                    "isin": "",
                    "orderSide": 0,
                    "orderValidity": 74,
                    "orderValiditydate": null
                },
                "method": "POST",
                "mode": "cors"
            },
            userBalanceUrl: "https://api.firouzehasia.ir/Web/V1/Accounting/Remain",
            userBalanceHeaders: {
                "credentials": "include", "headers": {
                    "accept": "*/*",
                    "accept-language": "en-US,en;q=0.9,fa;q=0.8",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "same-origin",
                    "x-requested-with": "XMLHttpRequest"
                },
                "referrer": document.location.href,
                "referrerPolicy": "no-referrer-when-downgrade",
                "body": null,
                "method": "GET",
                "mode": "cors"
            },
            stockPortfolioUrl: "https://api.firouzehasia.ir/Web/V1/RealtimePortfolio/Get/RealtimePortfolio?GetJustHasRemain=true&EndDate=undefined&BasedOnLastPositivePeriod=true&ActiveSymbolsStartDate=&ActiveSymbolsEndDate=",
            stockPortfolioHeaders: {
                "credentials": "include",
                "headers": {
                    "accept": "*/*",
                    "accept-language": "en-US,en;q=0.9,fa;q=0.8",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "same-origin",
                    "x-requested-with": "XMLHttpRequest"
                },
                "referrer": document.location.href,
                "referrerPolicy": "no-referrer-when-downgrade",
                "body": null,
                "method": "GET",
                "mode": "cors"
            },
            openOrdersUrl: "https://onlineplus.firouzehasia.ir/Customer/GetCustomerOpenOrders",
            openOrdersHeaders: {
                "credentials": "include",
                "headers": {
                    "accept": "*/*",
                    "accept-language": "en-US,en;q=0.9,fa;q=0.8",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "same-origin",
                    "x-requested-with": "XMLHttpRequest"
                },
                "referrer": document.location.href,
                "referrerPolicy": "no-referrer-when-downgrade",
                "body": null,
                "method": "GET",
                "mode": "cors"
            },
            cancelOrderUrl: "https://silver.mobinsb.com/Customer/CancelOrders",
            cancelOrderHeader: {
                "credentials": "include",
                "headers": {
                    "accept": "*/*",
                    "accept-language": "en-US,en;q=0.9,fa;q=0.8",
                    "content-type": "application/json",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "same-origin",
                    "x-requested-with": "XMLHttpRequest"
                }, "referrer": document.location.href,
                "referrerPolicy": "no-referrer-when-downgrade",
                "body": "[\"x\"]",
                "method": "POST",
                "mode": "cors"
            },
            sendOrderUrl: "https://silver.mobinsb.com/Customer/SendOrder",
            sendOrderHeaders: {
                "credentials": "include",
                "headers": {
                    "accept": "*/*",
                    "accept-language": "en-US,en;q=0.9,fa;q=0.8",
                    "content-type": "application/json",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "same-origin",
                    "x-requested-with": "XMLHttpRequest"
                },
                "referrer": document.location.href,
                "referrerPolicy": "no-referrer-when-downgrade",
                "body": {
                    "IsSymbolCautionAgreement": false,
                    "CautionAgreementSelected": false,
                    "IsSymbolSepahAgreement": false,
                    "SepahAgreementSelected": false,
                    "orderCount": 0,
                    "orderPrice": 0,
                    "FinancialProviderId": 1,
                    "minimumQuantity": "",
                    "maxShow": 0,
                    "orderId": 0,
                    "isin": "",
                    "orderSide": 65,
                    "orderValidity": 74,
                    "orderValiditydate": null
                },
                "method": "POST",
                "mode": "cors"
            },
            sendMultipleOrdersApi: "https://silver.mobinsb.com/Customer/SendMultipleOrders",
            sendMultipleOrdersHeaders: {
                "credentials": "include",
                "headers": {
                    "accept": "*/*",
                    "accept-language": "en-US,en;q=0.9,fa;q=0.8",
                    "content-type": "application/json",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "same-origin",
                    "x-requested-with": "XMLHttpRequest"
                },
                "referrer": document.location.href,
                "referrerPolicy": "no-referrer-when-downgrade",
                "body": {
                    orders: [{
                        IsSymbolCautionAgreement: false,
                        CautionAgreementSelected: false,
                        IsSymbolSepahAgreement: false,
                        SepahAgreementSelected: false,
                        orderCount: 50000,
                        orderPrice: 0,
                        FinancialProviderId: 1,
                        minimumQuantity: 0,
                        maxShow: 0,
                        orderId: 0,
                        isin: "IRO1ARDK0001",
                        orderSide: 65,
                        orderValidity: 74,
                        orderValiditydate: null
                    }]
                },
                "method": "POST",
                "mode": "cors"
            },
            sendbuyoptionorder:
                "https://api.firouzehasia.ir/Web/V1/Order/Post",
            sendbuyoptionorderheaders:
            {
                "credentials": "include",
                "headers": {
                    "accept": "*/*",
                    "accept-language": "en-US,en;q=0.9,fa;q=0.8",
                    "content-type": "application/json",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "same-origin",
                    "x-requested-with": "XMLHttpRequest",
                },
                "referrer": document.location.href,
                "referrerPolicy": "no-referrer-when-downgrade",
                "body": {
                    "IsSymbolCautionAgreement": false,
                    "CautionAgreementSelected": false,
                    "IsSymbolSepahAgreement": false,
                    "SepahAgreementSelected": false,
                    "orderCount": 50000,
                    "orderPrice": 0,
                    "FinancialProviderId": 1,
                    "minimumQuantity": 0,
                    "maxShow": 0,
                    "orderId": 0,
                    "isin": "IRO1ARDK0001",
                    "orderSide": 65,
                    "orderValidity": 74,
                    "orderValiditydate": null,
                    "shortSellIncentivePercent": 0,
                    "shortSellIsEnabled": false
                },
                "method": "POST",
                "mode": "cors",
            }
        };
        var localStorageConfigString = window.localStorage.getItem("safolla_config");
        if (localStorageConfigString == null || localStorageConfigString == 'undefined' || this.refreshconfig) {
            return defaultConfig;
        }
        else {
            var config = JSON.parse(localStorageConfigString);
            Object.keys(defaultConfig).forEach(key => {
                if (config[key] == undefined)
                    config[key] = defaultConfig[key];
            });
            return config;
        }
    }
    getPortfo() {
        return new Promise((resolve, reject) => {
            fetch(this.config.stockPortfolioUrl, this.config.stockPortfolioHeaders)
                .then(x => x.json())
                .then(portfo => {
                    resolve(portfo.Data);
                })
                .catch(ex => {
                    reject(ex);
                });
        });
    }
    getStockInfo(shareNSCode) {
        return new Promise((resolve, reject) => {
            fetch(`https://core.tadbirrlc.com/StockFutureInfoHandler.ashx?{%22Type%22:%22getLightSymbolInfoAndQueue%22,%22la%22:%22Fa%22,%22nscCode%22:%22${shareNSCode}%22}`)
                .then((res) => res.json())
                .then((resp) => {
                    resolve(resp);
                })
                .catch((err) => {
                    reject(err);
                })
        });
    }
    saveConfig() {
        window.localStorage.setItem("safolla_config", JSON.stringify(this.config));
    }
    getUserBalance() {
        return new Promise((resolve, reject) => {
            fetch(this.config.userBalanceUrl, this.config.userBalanceHeaders)
                .then(x => x.json())
                .then(resp => {
                    resolve({
                        realBalance: resp.Data.RealBalance,
                        accountBalance: resp.Data.AccountBalance,
                        blockedBalance: resp.Data.AccountBalance.BlockedBalance
                    });
                }).catch(ex => {
                    reject(ex);
                });
        });
    }
    getMarketInfo() {
        return new Promise((resolve, reject) => {
            fetch(this.config.getMarketUrl)
                .then(res => res.json())
                .then((market) => {
                    market = market.filter((a) => {
                        return (
                            a.sf != undefined /** نام نماد وجود داشته باشد */ &&
                            a.sf != "" /** نام نماد وجود داشته باشد */
                        ); /** نمادهایی که عدد داخل نامشان هست حذف شوند */
                    });
                    var counter = 0;
                    for (let index = 0; index < market.length; index++) {
                        const share = market[index];
                        share.sellQVol = market[index].bsq;
                        counter++;
                        if (counter == market.length) {
                            market = market.sort((a, b) => {
                                if (a.sellQVol > b.sellQVol)
                                    return -1;
                                if (a.sellQVol < b.sellQVol)
                                    return 1;
                                return 0;
                            });
                            this.market = market;
                            resolve(market);
                        }
                    }
                }).catch(err => {
                    reject(err);
                });
        });
    }
    getSecondtable(ShareNs){
        return new Promise((resolve) =>{
            fetch(`https://core.tadbirrlc.com//AlmasDataHandler?%7B%22Type%22:%22getSymbolFundamentalInfo%22,%22la%22:%22Fa%22,%22nscCode%22:%22${ShareNs}%22%7D&jsoncallback=`)
                .then(res => res.json())
                .then((data) => {
                    resolve(data);
                })
                .catch(err =>{
                    reject(err);
                })
        })
    }
    getChartData(ShareNs, NumberofDays) {
        return new Promise((resolve, reject) => {
            fetch(`https://rlcchartapi.tadbirrlc.ir/ChartData/priceHistory?symbol=${ShareNs}&resolution=D&beforeDays=${NumberofDays}&outType=splineArea`)
                .then(res => res.json())
                .then((data) => {
                    resolve(data);
                })
                .catch(err => {
                    reject(err);
                })
        })
    }
}

let safe = new Safolla();

const circleButton = document.createElement('button');
circleButton.id = 'circle-btn';
circleButton.textContent = '+';
document.body.appendChild(circleButton);

const mainContainer = document.createElement('div');
mainContainer.id = 'main-container';

mainContainer.innerHTML = `
    <div class="button-container">
        <button id="button1">Safollah</button>
        <button id="button2">Buy Q Fall</button>
        <button id="button3">Button 3</button>
        <button id="button4">Button 4</button>
        <button id="delete-btn" class="delete-btn">Delete</button>
    </div>

    <div class="progress-container">
        <div class="progress-bar">
            <div id="progress-fill" class="progress-fill"></div>
        </div>
        <div class="label" id="balance-label">Remaining Balance: 0%</div>
        <div class="label" id="dollar-label">Equivalent in Dollar: $0</div>
    </div>

    <div class="label" id="profit-label">Profit Percentage: 0%</div>
`;

document.body.appendChild(mainContainer);

// ایجاد دیالوگ برای صفحات مجزا
const modalContainer = document.createElement('div');
modalContainer.id = 'modal-container';
modalContainer.innerHTML = `
    <div id="modal-content">
    <div class="search-bar-wrapper">
        <div class="search-bar">
            <button id="launch-btn">Launch</button>
            <input type="text" id="search-input" placeholder="Search...">
            <input type="text" id="balance-input" placeholder="Enter balance percentage">
            <button id="search-btn">Search</button>
        </div>
    </div>
    <div class="modal-body">
        <div id="list-container">
            <div class="list-wrapper">
                <h3>Option Buy</h3>
                <ul id="list1"></ul>
            </div>
            <div class="list-wrapper">
                <h3>Option Sell</h3>
                <ul id="list2"></ul>
            </div>
        </div>
        <p id="modal-text">Modal Content Here</p>
    </div>
    <div class="modal-footer">
        <div id="Selectediteminfooter">
            <h3>Selected Items</h3>
            <ul class="selected-items-list" id="Z"></ul>
            <ul class="selected-items-list" id="T"></ul>
        </div>
        <div id="buttonsinfooter">
            <button id="portfo-btn">Portfo</button>
            <button id="add-btn">Add</button>
            <button id="back-btn">Back</button>
        </div>
    </div>
</div>
</div>
`;
document.body.appendChild(modalContainer);

const detailModalContainer = document.createElement('div');
detailModalContainer.id = 'info-modal-container';
detailModalContainer.innerHTML = `
    <div id="info-modal-content">
        <div id="info-modal-body">
            <div class="info-item">
                <h3>Option Buy</h3>
                <p id="item1-name">Name 1</p>
                <p id="item1-balance">Balance: 0%</p>
            </div>
            <div class="info-item">
                <h3>Option Sell</h3>
                <p id="item2-name">Name 2</p>
                <p id="item2-balance">Balance: 0%</p>
            </div>
        </div>
        <div class="info-modal-footer">
            <button id="final-confirm-btn">Final Confirmation</button>
            <button id="info-back-btn">Back</button>
        </div>
    </div>
`;
document.body.appendChild(detailModalContainer);

const protfoModalcontainer = document.createElement('div');
protfoModalcontainer.id = 'table-container';
protfoModalcontainer.innerHTML = `
    <div class="table-container1">
        <table>
            <thead>
                <tr>
                    <th>Row Number</th>
                    <th>Call Option</th>
                    <th>Put Option</th>
                    <th>In Profit</th>
                    <th>Force Exit</th>
                    <th>Reduce the Avrage</th>
                    <th></th>
                </tr>
            </thead>
            <tbody id = 'table-body'>
            </tbody>
        </table>
    </div>
`;

document.body.appendChild(protfoModalcontainer);
const BuyQfallContainer = document.createElement('div');
BuyQfallContainer.id = 'mainContainer-BuyQfall';
BuyQfallContainer.innerHTML = `
    <div id="mainContainer-BuyQfall">
        <!-- سایر محتویات اصلی -->
        <div class="button-container-BuyQfall">
            <button id="launch-btn-BuyQfall" class="button-BuyQfall">Luanch</button>
        </div>
        <div class="balance-section-BuyQfall">
            <label for="balance-input">Balance:</label>
            <input type="text" id="balance-input-BuyQfall" />
            <label for="profit-percent">Profit Percent:</label>
            <input type="text" id="profit-percent-BuyQfall" />
        </div>
        <div class="table-section-BuyQfall">
            <table id="data-table-BuyQfall">
                <thead>
                    <tr>
                        <th>Row</th>
                        <th>Option Name</th>
                        <th>In profit</th>
                        <th>Force Exit</th>
                    </tr>
                </thead>
                <tbody>
                    <!-- ردیف‌های جدول به صورت داینامیک اضافه خواهند شد -->
                </tbody>
            </table>
        </div>
    </div>
`;
document.body.appendChild(BuyQfallContainer);

// ابتدا صفحه اصلی و دیالوگ را مخفی کنید
mainContainer.style.display = 'none';
modalContainer.style.display = 'none';
detailModalContainer.style.display = 'none';
protfoModalcontainer.style.display = 'none';
BuyQfallContainer.style.display = 'none';

// نمایش صفحه اصلی و مخفی کردن دکمه گرد
circleButton.addEventListener('click', function () {
    mainContainer.style.display = 'block';
    circleButton.style.display = 'none';
});

// تابعی برای بستن محتوا و نمایش دوباره دکمه گرد
function closeMainContainer() {
    mainContainer.style.display = 'none';
    modalContainer.style.display = 'none';
    detailModalContainer.style.display = 'none';
    protfoModalcontainer.style.display = 'none';
    BuyQfallContainer.style.display = 'none';
    circleButton.style.display = 'block';
}

// رویداد کلیک برای بستن صفحات با کلیک خارج از آن‌ها
document.addEventListener('click', function (event) {
    if (!mainContainer.contains(event.target) && !modalContainer.contains(event.target) && !detailModalContainer.contains(event.target) && !protfoModalcontainer.contains(event.target) && event.target !== circleButton && !BuyQfallContainer.contains(event.target)) {
        closeMainContainer();
    }
});

document.getElementById('launch-btn').addEventListener('click', function () {
    let BalancePercent = document.getElementById('balance-input');
    if (BalancePercent.value == "")
        alert("Balance Can Not Be Empty");
    else {
        safe.CalculateBalanceForeachPacket(BalancePercent.value);
        this.classList.toggle('clicked');
        safe.DeltaHedge = !safe.DeltaHedge;
    }
});

const buttons = mainContainer.querySelectorAll('.button-container button');
buttons.forEach((button, index) => {
    button.addEventListener('click', function () {
        const modalText = document.getElementById('modal-text');
        const listContainer = document.getElementById('list-container');
        const watchlistbuyid = document.getElementById('Z');
        const watchlistsellid = document.getElementById('T');
        if (index === 0) {
            modalText.style.display = 'none';
            listContainer.style.display = 'flex';
            safe.ShowTheFilteredTheOptions();
            safe.ShowthePreviosWatchlist(watchlistbuyid, watchlistsellid);
            modalContainer.style.display = 'block';
            mainContainer.style.display = 'none';
        }
        else if(index === 1)
        {
            BuyQfallContainer.style.display = 'block';
            mainContainer.style.display = 'none';
        }
        else if (index != 4) {
            modalText.style.display = 'block';
            modalText.innerText = `This is the content of Popup ${index + 1}`;
            listContainer.style.display = 'none';
            modalContainer.style.display = 'block';
            mainContainer.style.display = 'none';
        }
        else if (button.id == 'delete-btn') {
            safe.deleteconfig();
        }
    });
});

document.getElementById('launch-btn-BuyQfall').addEventListener('click' , ()=>{
    const balanceinput =  document.getElementById('balance-input-BuyQfall');
    const profipercent = document.getElementById('profit-percent-BuyQfall');
    if(balanceinput.textContent == "")
    {
        alert("balance is Empty");
    }
    if(profipercent.textContent == "")
    {
        alert("profit is empty");
    }
    if(balanceinput.textContent != "")
    {
        if(profipercent.textContent != "")
        {
            safe.BuyQFallOn = !safe.BuyQFallOn;
            safe.BuyQFallBalance = balanceinput.textContent;
            safe.BuyQFallProfit = profipercent.textContent;
        }
    }
})


document.getElementById('portfo-btn').addEventListener('click' , ()=>{
    protfoModalcontainer.style.display = 'block';
    modalContainer.style.display = 'none';
})
document.getElementById('search-btn').addEventListener('click', function () {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();

    // جستجو در لیست Option Buy
    const listItems1 = document.getElementById('list1').getElementsByTagName('li');
    Array.from(listItems1).forEach(item => {
        if (item.textContent.toLowerCase().includes(searchTerm)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });

    // جستجو در لیست Option Sell
    const listItems2 = document.getElementById('list2').getElementsByTagName('li');
    Array.from(listItems2).forEach(item => {
        if (item.textContent.toLowerCase().includes(searchTerm)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
});


// رویداد کلیک روی دکمه بازگشت
document.getElementById('back-btn').addEventListener('click', function () {
    modalContainer.style.display = 'none';
    mainContainer.style.display = 'block';
});
document.getElementById('info-back-btn').addEventListener('click', function () {
    if(safe.whitelist.find(item => item.Selected == true).color == "1time")
    {
        let index = safe.whitelist.findIndex(item => item.Selected == true);
        safe.whitelist.splice(index , 1);
        detailModalContainer.style.display = 'none';
        protfoModalcontainer.style.display = 'block';
    }
    else
    {
        safe.whitelist.find(item => item.Selected == true).Selected = false;
        detailModalContainer.style.display = 'none';
        modalContainer.style.display = 'block';
    }
    // safe.savewhitelist();

});

document.getElementById('table-body').addEventListener('click', function(event) {

    if (event.target && event.target.nodeName === 'BUTTON') {
        const clickedButton = event.target;
        console.log('Button clicked:', clickedButton.id);
        let detectbutton = clickedButton.id.split('-')[0];
        let id =  clickedButton.id.split('-')[1];
        if(detectbutton == "AvragebuttonInTable")
        {
            safe.whitelist.push({
                OptionBuyName : safe.packetitems[id].OptionBuyName,
                OptionSellName : safe.packetitems[id].OptionSellName,
                color:"1time",
                Selected:true,
                BalanceBuy : ""
            });
            document.getElementById('item1-name').textContent = safe.packetitems[id].OptionBuyName;
            safe.DeltaCalculate(safe.packetitems[id].OptionBuyName)
                .then(DeltaBuy =>{
                    safe.DeltaCalculate(safe.packetitems[id].OptionSellName)
                        .then(DeltaSell =>{
                            safe.DivideBalance(DeltaBuy, DeltaSell, safe.packetitems[id].OptionBuyName, safe.packetitems[id].OptionSellName, document.getElementById('item1-balance'), document.getElementById('item2-balance'));
                        })
                })
            document.getElementById('item2-name').textContent = safe.packetitems[id].OptionSellName;
            // safe.savewhitelist();
            detailModalContainer.style.display = 'block';
            protfoModalcontainer.style.display = 'none';
        }
        if(detectbutton == "buttonInTable")
        {
            safe.ForceExit(safe.packetitems[id]);
        }
    }
});

document.getElementById('table-body').addEventListener('change' , function(event)
{
    if(event.target && event.target.nodeName === 'input')
    {
        const targetinput = event.target;
        let id = targetinput.id.split('-')[1];
        safe.packetitems[id] = targetinput.value;
        safe.savepackets();
    }
})

// تابع برای اضافه کردن آیتم‌ها به لیست‌ها
function addItemsToLists(BuyName , SellName  , color) {
    let DoNotadd = false;
    const list1 = document.getElementById('list1');
    const list2 = document.getElementById('list2');
    let childNode1 = list1.childNodes;
    let childNode2 = list2.childNodes;

    childNode1.forEach((child , index)=>{
        if(child.textContent == BuyName && childNode2[index].textContent == SellName)
        {
            DoNotadd = true;
        }
            
    })

    if(!DoNotadd)
    {
        const newItem2 = document.createElement('li');
        newItem2.textContent = SellName;
        newItem2.style.color = color;
        const newItem1 = document.createElement('li');
        newItem1.textContent = BuyName;
        newItem1.style.color = color
        list1.appendChild(newItem1);
        list2.appendChild(newItem2);
    }
}

// تابع برای به‌روزرسانی اطلاعات
function updateBalance(percentage) {
    const progressFill = document.getElementById('progress-fill');
    progressFill.style.width = percentage + '%';
    document.getElementById('balance-label').innerText = `Remaining Balance: ${percentage}%`;
}

function updateDollar(amount) {
    document.getElementById('dollar-label').innerText = `Equivalent in Dollar: $${amount}`;
}

function updateProfit(percentage) {
    const profitLabel = document.getElementById('profit-label');
    profitLabel.innerText = `Profit Percentage: ${percentage}%`;
    if (percentage > 0) {
        profitLabel.style.color = 'green';
    } else if (percentage < 0) {
        profitLabel.style.color = 'red';
    } else {
        profitLabel.style.color = 'black';
    }
}

updateBalance(20); // 20% باقی مانده
updateDollar(200); // معادل 200 دلار
updateProfit(5); // 5% سود

const addButton = document.getElementById('add-btn');
const finalConfirmButton = document.getElementById('final-confirm-btn');
const selectedItemsListBuy = document.getElementById('Z');
const selectedItemsListSell = document.getElementById('T');

// لیست انتخاب شده
let selectedItems = [];

// اضافه کردن رویداد کلیک برای دکمه "Add"
addButton.addEventListener('click', async function () {
    const selectedItem1 = document.querySelector('#list1 li.selected');
    const selectedItem2 = document.querySelector('#list2 li.selected');
    if (selectedItem1 && selectedItem2) {
        document.getElementById('item1-name').textContent = selectedItem1.textContent;
        safe.DeltaCalculate(selectedItem1.textContent)
            .then(DeltaBuy =>{
                safe.DeltaCalculate(selectedItem2.textContent)
                    .then(DeltaSell =>{
                        safe.DivideBalance(DeltaBuy, DeltaSell, selectedItem1.textContent, selectedItem2.textContent, document.getElementById('item1-balance'), document.getElementById('item2-balance'));
                    })
            })
        document.getElementById('item2-name').textContent = selectedItem2.textContent;
        safe.whitelist.find(item =>item.OptionBuyName == selectedItem1.textContent && item.OptionSellName == selectedItem2.textContent).Selected = true;
        // safe.savewhitelist();
        modalContainer.style.display = 'none';
        detailModalContainer.style.display = 'block';
    } else {
        alert('لطفاً یک آیتم از هر لیست انتخاب کنید.');
    }
});

// رویداد کلیک برای آیتم‌های لیست برای انتخاب آنها
document.getElementById('list1').addEventListener('click', function (e) {
    if (e.target.tagName === 'LI') {
        toggleSelection(e.target);
    }
});

document.getElementById('list2').addEventListener('click', function (e) {
    if (e.target.tagName === 'LI') {
        toggleSelection(e.target);
    }
});

// تابع برای تغییر حالت انتخاب آیتم
function toggleSelection(item) {
    if (item.classList.contains('selected')) {
        item.classList.remove('selected');
    } else {
        // فقط یک آیتم انتخاب شود
        const list = item.parentNode;
        list.querySelectorAll('li').forEach((li) => li.classList.remove('selected'));
        item.classList.add('selected');
    }
}

// رویداد کلیک برای دکمه تایید نهایی
finalConfirmButton.addEventListener('click', function () {
    const item1Name = document.getElementById('item1-name').textContent;
    const item1Balance = document.getElementById('item1-balance').textContent;
    const item2Name = document.getElementById('item2-name').textContent;
    const item2Balance = document.getElementById('item2-balance').textContent;
    if (item1Balance.textContent != "Balance: 0%" && item2Balance.textContent != "Balance: 0%") {
        var packetitem =
        {
            RobotName: "DeltaHedging",
            OptionBuyName: "",
            BuyOptionQuantity: 0,
            BaseID: "",
            BuyOptionID: "",
            BuyedBefor: false,
            BuyBalanceUsed: "",
            SellBalanceUsed : "",
            SellOptionID : "",
            SellOptionQuantity : 0,
            OptionSellName : "",
            BuyedPriceBuyOption : 0,
            BuyedPriceSellOption : 0,
            InProfit : 0,
            Profit:1.02
        }
        let findinwhitelist = safe.whitelist.find(item => item.Selected == true);
        let OptionInMarket = safe.marketinfo.find(item => item.sf == findinwhitelist.OptionBuyName);
        packetitem.BuyOptionID = OptionInMarket.nc;
        packetitem.OptionBuyName = findinwhitelist.OptionBuyName;
        packetitem.BuyBalanceUsed = parseFloat(findinwhitelist.BalanceBuy);
        safe.config.OptionWhitelist.forEach(Base => {
            if (OptionInMarket.cn.search(Base.BaseName) != -1) {
                packetitem.BaseID = Base.BaseID;
            }
        })
        OptionInMarket = safe.marketinfo.find(item => item.sf == findinwhitelist.OptionSellName);
        packetitem.SellOptionID = OptionInMarket.nc;
        packetitem.OptionSellName = findinwhitelist.OptionSellName;
        packetitem.SellBalanceUsed = 1 - findinwhitelist.BalanceBuy;
        safe.config.OptionWhitelist.forEach(Base => {
            if (OptionInMarket.cn.search(Base.BaseName) != -1) {
                packetitem.BaseID = Base.BaseID;
            }
        })
        safe.packetitems.push(packetitem);
        safe.savepackets();
        // اضافه کردن اطلاعات به لیست در footer modal-container
        safe.ShowthePreviosWatchlist(selectedItemsListBuy, selectedItemsListSell);
    }
    // مخفی کردن info-modal و نمایش دوباره modalContainer
    detailModalContainer.style.display = 'none';
    modalContainer.style.display = 'block';
});

function Convert_to_JalaliDate(j_y, j_m, j_d) {
    JalaliDate = {
        g_days_in_month: [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
        j_days_in_month: [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29],
    };

    j_y = parseInt(j_y);
    j_m = parseInt(j_m);
    j_d = parseInt(j_d);
    var jy = j_y - 979;
    var jm = j_m - 1;
    var jd = j_d - 1;

    var j_day_no =
        365 * jy + parseInt(jy / 33) * 8 + parseInt(((jy % 33) + 3) / 4);
    for (var i = 0; i < jm; ++i) j_day_no += JalaliDate.j_days_in_month[i];

    j_day_no += jd;

    var g_day_no = j_day_no + 79;

    var gy =
        1600 +
        400 *
        parseInt(
            g_day_no / 146097
        ); /* 146097 = 365*400 + 400/4 - 400/100 + 400/400 */
    g_day_no = g_day_no % 146097;

    var leap = true;
    if (g_day_no >= 36525) {
        /* 36525 = 365*100 + 100/4 */
        g_day_no--;
        gy +=
            100 * parseInt(g_day_no / 36524); /* 36524 = 365*100 + 100/4 - 100/100 */
        g_day_no = g_day_no % 36524;

        if (g_day_no >= 365) g_day_no++;
        else leap = false;
    }

    gy += 4 * parseInt(g_day_no / 1461); /* 1461 = 365*4 + 4/4 */
    g_day_no %= 1461;

    if (g_day_no >= 366) {
        leap = false;

        g_day_no--;
        gy += parseInt(g_day_no / 365);
        g_day_no = g_day_no % 365;
    }

    for (
        var i = 0;
        g_day_no >= JalaliDate.g_days_in_month[i] + (i == 1 && leap);
        i++
    )
        g_day_no -= JalaliDate.g_days_in_month[i] + (i == 1 && leap);
    var gm = i;
    var gd = g_day_no + 1;

    gm = gm < 10 ? "0" + gm : gm;
    gd = gd < 10 ? "0" + gd : gd;

    return new Date(gy, gm, gd);
}




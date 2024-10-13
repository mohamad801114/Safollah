`https://rlcchartapi.tadbirrlc.ir/ChartData/priceHistory?symbol=IRT1AHRM0001&resolution=D&beforeDays=365&outType=splineArea`

"https://core.tadbirrlc.com//StocksHandler.ashx?{%22Type%22:%22ALL21%22,%22la%22:%22Fa%22}"

"https://core.tadbirrlc.com/StockFutureInfoHandler.ashx?{%22Type%22:%22getLightSymbolInfoAndQueue%22,%22la%22:%22Fa%22,%22nscCode%22:%22IRO9TAMN8761%22}"

`https://core.tadbirrlc.com//AlmasDataHandler?%7B%22Type%22:%22getSymbolFundamentalInfo%22,%22la%22:%22Fa%22,%22nscCode%22:%22IRT3MOJF0001%22%7D&jsoncallback=`

function blackScholes(S, K, T, r, sigma, optionType) {
    function cumulativeNormalDistribution(x) {
        return (1.0 + Math.erf(x / Math.sqrt(2.0))) / 2.0;
    }

    let d1 = (Math.log(S / K) + (r + Math.pow(sigma, 2) / 2) * T) / (sigma * Math.sqrt(T));
    let d2 = d1 - sigma * Math.sqrt(T);

    if (optionType === 'call') {
        return S * cumulativeNormalDistribution(d1) - K * Math.exp(-r * T) * cumulativeNormalDistribution(d2);
    } else if (optionType === 'put') {
        return K * Math.exp(-r * T) * cumulativeNormalDistribution(-d2) - S * cumulativeNormalDistribution(-d1);
    } else {
        throw new Error("Invalid option type. Use 'call' or 'put'.");
    }
}

// مثال استفاده:
let S = 100; // قیمت فعلی دارایی پایه
let K = 100; // قیمت اعمال
let T = 1; // زمان باقی‌مانده تا سررسید (به‌صورت سال)
let r = 0.05; // نرخ بهره بدون ریسک
let sigma = 0.2; // نوسانات ضمنی

let callPrice = blackScholes(S, K, T, r, sigma, 'call');
let putPrice = blackScholes(S, K, T, r, sigma, 'put');

console.log("Call Option Price: " + callPrice);
console.log("Put Option Price: " + putPrice);


function blackScholes(S, K, T, r, sigma, q, optionType) {
    let d1 = (Math.log(S / K) + (r - q + Math.pow(sigma, 2) / 2) * T) / (sigma * Math.sqrt(T));
    let d2 = d1 - sigma * Math.sqrt(T);

    if (optionType === 'call') {
        console.log(S * Math.exp(-q * T) * this.cumulativeNormalDistribution(d1) - K * Math.exp(-r * T) * this.cumulativeNormalDistribution(d2));
    } else if (optionType === 'put') {
        console.log(K * Math.exp(-r * T) * this.cumulativeNormalDistribution(-d2) - S * Math.exp(-q * T) * this.cumulativeNormalDistribution(-d1));
    } else {
        throw new Error("Invalid option type. Use 'call' or 'put'.");
    }
}


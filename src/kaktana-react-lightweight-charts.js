import React from "react";
import { createChart } from "lightweight-charts";
import equal from "fast-deep-equal";

const addSeriesFunctions = {
    candlestick: "addCandlestickSeries",
    line: "addLineSeries",
    area: "addAreaSeries",
    bar: "addBarSeries",
    histogram: "addHistogramSeries",
};

const colors = [
    "#008FFB",
    "#00E396",
    "#FEB019",
    "#FF4560",
    "#775DD0",
    "#F86624",
    "#A5978B",
];

const darkTheme = {
    layout: {
        backgroundColor: "#131722",
        lineColor: "#2B2B43",
        textColor: "#D9D9D9",
    },
    grid: {
        vertLines: {
            color: "#363c4e",
        },
        horzLines: {
            color: "#363c4e",
        },
    },
};

const lightTheme = {
    layout: {
        backgroundColor: "#FFFFFF",
        lineColor: "#2B2B43",
        textColor: "#191919",
    },
    grid: {
        vertLines: {
            color: "#e1ecf2",
        },
        horzLines: {
            color: "#e1ecf2",
        },
    },
};

class ChartWrapper extends React.Component {
    constructor(props) {
        super(props);
        this.chartDiv = React.createRef();
        this.legendDiv = React.createRef();
        this.chart = null;
        this.series = [];
        this.legends = [];
    }

    componentDidMount() {
        this.chart = createChart(this.chartDiv.current);
        this.handleUpdateChart();
        this.resizeHandler();
    }

    componentDidUpdate(prevProps) {
        if (!this.props.autoWidth && !this.props.autoHeight)
            window.removeEventListener("resize", this.resizeHandler);
        if (
            !equal(
                [
                    prevProps.onCrosshairMove,
                    prevProps.onTimeRangeMove,
                    prevProps.onClick,
                ],
                [
                    this.props.onCrosshairMove,
                    this.props.onTimeRangeMove,
                    this.props.onClick,
                ]
            )
        )
            this.unsubscribeEvents(prevProps);
        if (
            !equal(
                [
                    prevProps.options,
                    prevProps.darkTheme,
                    prevProps.candlestickSeries,
                    prevProps.lineSeries,
                    prevProps.areaSeries,
                    prevProps.barSeries,
                    prevProps.histogramSeries,
                ],
                [
                    this.props.options,
                    this.props.darkTheme,
                    this.props.candlestickSeries,
                    this.props.lineSeries,
                    this.props.areaSeries,
                    this.props.barSeries,
                    this.props.histogramSeries,
                ]
            )
        ) {
            this.removeSeries();
            this.handleUpdateChart();
        } else if (
            prevProps.from !== this.props.from ||
            prevProps.to !== this.props.to
        )
            this.handleTimeRange();
    }

    resizeHandler = () => {
        let width =
            this.props.autoWidth &&
            this.chartDiv.current &&
            this.chartDiv.current.parentNode.clientWidth;
        let height =
            this.props.autoHeight && this.chartDiv.current
                ? this.chartDiv.current.parentNode.clientHeight
                : this.props.height || 500;
        this.chart.resize(width, height);
    };

    removeSeries = () => {
        this.series.forEach((serie) => this.chart.removeSeries(serie));
        this.series = [];
    };

    addSeries = (serie, type) => {
        const func = addSeriesFunctions[type];
        let color =
            (serie.options && serie.options.color) ||
            colors[this.series.length % colors.length];
        const series = this.chart[func]({
            color,
            ...serie.options,
        });
        let data = this.handleLinearInterpolation(
            serie.data,
            serie.linearInterpolation
        );
        series.setData(data);
        if (serie.markers) series.setMarkers(serie.markers);
        if (serie.priceLines)
            serie.priceLines.forEach((line) => series.createPriceLine(line));
        if (serie.legend) this.addLegend(series, color, serie.legend);
        return series;
    };

    handleSeries = () => {
        let series = this.series;
        let props = this.props;
        props.candlestickSeries &&
            props.candlestickSeries.forEach((serie) => {
                series.push(this.addSeries(serie, "candlestick"));
            });

        props.lineSeries &&
            props.lineSeries.forEach((serie) => {
                series.push(this.addSeries(serie, "line"));
            });

        props.areaSeries &&
            props.areaSeries.forEach((serie) => {
                series.push(this.addSeries(serie, "area"));
            });

        props.barSeries &&
            props.barSeries.forEach((serie) => {
                series.push(this.addSeries(serie, "bar"));
            });

        props.histogramSeries &&
            props.histogramSeries.forEach((serie) => {
                series.push(this.addSeries(serie, "histogram"));
            });
    };

    unsubscribeEvents = (prevProps) => {
        let chart = this.chart;
        chart.unsubscribeClick(prevProps.onClick);
        chart.unsubscribeCrosshairMove(prevProps.onCrosshairMove);
        chart.unsubscribeVisibleTimeRangeChange(prevProps.onTimeRangeMove);
    };

    handleEvents = () => {
        let chart = this.chart;
        let props = this.props;
        props.onClick && chart.subscribeClick(props.onClick);
        props.onCrosshairMove &&
            chart.subscribeCrosshairMove(props.onCrosshairMove);
        props.onTimeRangeMove &&
            chart.subscribeVisibleTimeRangeChange(props.onTimeRangeMove);

        // handle legend dynamical change
        chart.subscribeCrosshairMove(this.handleLegends);
    };

    handleTimeRange = () => {
        let { from, to } = this.props;
        from && to && this.chart.timeScale().setVisibleRange({ from, to });
    };

    handleLinearInterpolation = (data, candleTime) => {
        if (!candleTime || data.length < 2 || !data[0].value) return data;
        let first = data[0].time;
        let last = data[data.length - 1].time;
        let newData = new Array(Math.floor((last - first) / candleTime));
        newData[0] = data[0];
        let index = 1;
        for (let i = 1; i < data.length; i++) {
            newData[index++] = data[i];
            let prevTime = data[i - 1].time;
            let prevValue = data[i - 1].value;
            let { time, value } = data[i];
            for (
                let interTime = prevTime;
                interTime < time - candleTime;
                interTime += candleTime
            ) {
                // interValue get from the Taylor-Young formula
                let interValue =
                    prevValue +
                    (interTime - prevTime) *
                        ((value - prevValue) / (time - prevTime));
                newData[index++] = { time: interTime, value: interValue };
            }
        }
        // return only the valid values
        return newData.filter((x) => x);
    };

    handleUpdateChart = () => {
        window.removeEventListener("resize", this.resizeHandler);
        let { chart, chartDiv } = this;
        let props = this.props;
        let options = this.props.darkTheme ? darkTheme : lightTheme;
        options = mergeDeep(options, {
            width: props.autoWidth
                ? chartDiv.current.parentNode.clientWidth
                : props.width,
            height: props.autoHeight
                ? chartDiv.current.parentNode.clientHeight
                : props.height || 500,
            ...props.options,
        });
        chart.applyOptions(options);
        if (this.legendDiv.current) this.legendDiv.current.innerHTML = "";
        this.legends = [];
        if (this.props.legend) this.handleMainLegend();

        this.handleSeries();
        this.handleEvents();
        this.handleTimeRange();

        if (props.autoWidth || props.autoHeight)
            // resize the chart with the window
            window.addEventListener("resize", this.resizeHandler);
    };

    addLegend = (series, color, title) => {
        this.legends.push({ series, color, title });
    };

    handleLegends = (param) => {
        let div = this.legendDiv.current;
        if (param.time && div && this.legends.length) {
            div.innerHTML = "";
            this.legends.forEach(({ series, color, title }) => {
                let price = param.seriesPrices.get(series);
                if (price !== undefined) {
                    if (typeof price == "object") {
                        color =
                            price.open < price.close
                                ? "rgba(0, 150, 136, 0.8)"
                                : "rgba(255,82,82, 0.8)";
                        price = `O: ${price.open}, H: ${price.high}, L: ${price.low}, C: ${price.close}`;
                    }
                    let row = document.createElement("div");
                    row.innerText = title + " ";
                    let priceElem = document.createElement("span");
                    priceElem.style.color = color;
                    priceElem.innerText = " " + price;
                    row.appendChild(priceElem);
                    div.appendChild(row);
                }
            });
        }
    };

    handleMainLegend = () => {
        if (this.legendDiv.current) {
            let row = document.createElement("div");
            row.innerText = this.props.legend;
            this.legendDiv.current.appendChild(row);
        }
    };

    render() {
        let color = this.props.darkTheme
            ? darkTheme.layout.textColor
            : lightTheme.layout.textColor;

        return (
            <div ref={this.chartDiv} style={{ position: "relative" }}>
                <div
                    ref={this.legendDiv}
                    style={{
                        position: "absolute",
                        zIndex: 2,
                        color,
                        padding: 10,
                    }}
                />
            </div>
        );
    }
}

export default ChartWrapper;
export * from "lightweight-charts";

const isObject = (item) =>
    item && typeof item === "object" && !Array.isArray(item);

const mergeDeep = (target, source) => {
    let output = Object.assign({}, target);
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach((key) => {
            if (isObject(source[key])) {
                if (!(key in target))
                    Object.assign(output, { [key]: source[key] });
                else output[key] = mergeDeep(target[key], source[key]);
            } else {
                Object.assign(output, { [key]: source[key] });
            }
        });
    }
    return output;
};

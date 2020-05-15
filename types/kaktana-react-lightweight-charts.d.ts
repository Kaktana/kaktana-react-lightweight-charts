declare module "kaktana-react-lightweight-charts" {
    interface Props {
        candlestickSeries?: Array<any>,
        lineSeries?: Array<any>,
        areaSeries?: Array<any>,
        barSeries?: Array<any>,
        histogramSeries?: Array<any>,
        width?: number,
        height?: number,
        options?: object,
        autoWidth?: boolean,
        from?: number,
        to?: number,
        onClick?: void,
        onCrosshairMove?: void,
        onTimeRangeMove?: void,
        darkTheme?: boolean,
    }

    export default class ChartWrapper extends React.Component<Props> {}
}

import { MouseEventHandler, TimeRangeChangeEventHandler } from 'lightweight-charts';
import React from 'react';

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
				autoHeight?: boolean,
				legend?: string;
        from?: number,
        to?: number,
        onClick?: MouseEventHandler,
        onCrosshairMove?: MouseEventHandler,
        onTimeRangeMove?: TimeRangeChangeEventHandler,
        darkTheme?: boolean,
    }

    export default class ChartWrapper extends React.Component<Props> {}
}

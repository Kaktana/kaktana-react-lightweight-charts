var path = require("path");

module.exports = {
    mode: "production",
    entry: "./src/kaktana-react-lightweight-charts.js",
    output: {
        path: path.resolve("dist"),
        filename: "kaktana-react-lightweight-charts.min.js",
        libraryTarget: "commonjs2"
    },
    module: {
        rules: [
            { test: /\.js$/, exclude: /node_modules/, loader: "babel-loader" },
            {
                test: /\.css$/,
                loader: "style-loader!css-loader"
            }
        ]
    },
    externals: {
        react: "react",
        "lightweight-charts": "lightweight-charts",
    }
};

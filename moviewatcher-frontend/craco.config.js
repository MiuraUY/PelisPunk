const webpack = require('webpack')

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        crypto: require.resolve('crypto-browserify'),
        path: require.resolve('path-browserify'),
        stream: require.resolve('stream-browserify'),
        assert: require.resolve('assert/'),
        buffer: require.resolve('buffer/'),
        util: require.resolve('util/'),
      }

      webpackConfig.resolve.alias = {
        ...(webpackConfig.resolve.alias || {}),
        process$: 'process/browser.js',
      }

      webpackConfig.plugins.push(
        new webpack.ProvidePlugin({
          process: 'process/browser.js',
          Buffer: ['buffer', 'Buffer'],
          global: require.resolve('global/'),
        })
      )

      return webpackConfig
    },
  },
}

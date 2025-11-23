    module.exports = function(api) {
      api.cache(true);
      return {
        presets: ['babel-preset-expo'],
        // --- YEH LINE ADD KARNI HAI ---
        plugins: [
          'react-native-reanimated/plugin', // Reanimated plugin
        ],
        // --- YEH LINE ADD KARNI HAI ---
      };
    };
    
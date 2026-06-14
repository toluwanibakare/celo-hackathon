try {
  const path = require.resolve('server-only');
  require.cache[path] = {
    id: path,
    exports: {},
    loaded: true,
    paths: [],
    children: [],
    filename: path,
  };
} catch (e) {
  console.warn('Could not mock server-only:', e);
}

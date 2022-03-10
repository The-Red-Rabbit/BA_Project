const app = {
  startLat: 52.525084,
  startLon: 13.369402,
  host: 'localhost',
  port: 8080
};

const config = {
  app,
  svr: {
    wsPort: app.port,
    tcpPort: 42640
  }
};

module.exports = config;
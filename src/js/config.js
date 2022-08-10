const app = {
  startLat: 51.86279672963583,
  startLon: 13.961199335983522,
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
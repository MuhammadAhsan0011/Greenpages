// Startup file for cPanel's Node.js app (Phusion Passenger) hosting.
// Vercel ignores this file; it is only used where the site runs as a
// plain Node process. Expects `next build` to have already produced .next/.
const { createServer } = require("http");
const next = require("next");

const port = parseInt(process.env.PORT, 10) || 3000;
const app = next({ dev: false });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => handle(req, res)).listen(port, () => {
    console.log(`Green Pages ready on port ${port}`);
  });
});

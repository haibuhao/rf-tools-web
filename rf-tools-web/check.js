const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const html = fs.readFileSync('index.html', 'utf8');
const script1 = fs.readFileSync('band-data.js', 'utf8');
const script2 = fs.readFileSync('components-data.js', 'utf8');
const script3 = fs.readFileSync('app.js', 'utf8');

const dom = new JSDOM(html, { runScripts: "outside-only", virtualConsole: (new jsdom.VirtualConsole()).sendTo(console) });
const window = dom.window;

try {
  dom.window.eval(script1);
  dom.window.eval(script2);
  dom.window.eval(script3);
  dom.window.eval('init();');
  console.log("SUCCESS!");
} catch (e) {
  console.log("ERROR:");
  console.log(e);
}

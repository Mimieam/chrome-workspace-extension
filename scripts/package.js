const path = require("path")
const fs = require("fs");
const ChromeExtension = require("crx");
const paths = require('../config/paths');
const appName = require(paths.appPackageJson).name;
const version = require(paths.appPackageJson).version;
const extInfo = require('../build/_locales/en/messages.json');
// const argv = require('minimist')(process.argv.slice(2));
const name = extInfo.appName.message;

const hasPrivateKey = fs.existsSync("./key.pem");
const addVersionFlag = (process.argv[process.argv.length -1].toLowerCase() === '--addversion') // check last argument 

if (hasPrivateKey) {

  const crx = new ChromeExtension({
    // codebase: "http://localhost:8000/myFirstExtension.crx",
    privateKey: fs.readFileSync("./key.pem")
  });
  const fileName = `${ name }${ addVersionFlag ? version :''}`
  crx.load(path.resolve("build"))
  .then(() => crx.loadContents())
  .then((archiveBuffer) => {
    fs.writeFile(`release/${fileName}.zip`, archiveBuffer, (err) => { 
      if (err) {
        console.log(err)
      } else {
        console.log(`release/${fileName}.zip v${version} was created `)
      }
    });
    
    crx.pack(archiveBuffer).then((crxBuffer) => {
      fs.writeFile(`release/${fileName}.crx`, crxBuffer, (err) => { 
        if (err) {
          console.log(err)
        } else {
          console.log(`release/${fileName}.crx v${version} was created `)
        }
      });
    });
  });
} else {  
  console.error('please create your private key first before packaging')
}

// https://gist.github.com/int128/e0cdec598c5b3db728ff35758abdbafd
process.env.NODE_ENV = 'production';

const path = require('path');
const fs = require('fs-extra');
// const paths = require('react-scripts/config/paths');
const paths = require('../config/paths');
const webpack = require('webpack');
const chalk = require('chalk');
const config = require('../config/webpack.config.dev.js');
// removes react-dev-utils/webpackHotDevClient.js at first in the array
// config.entry.shift();

const { spawn } = require('child_process');
const spawnOption = {
  cwd: path.resolve(process.cwd()),
  detached: true
}

let children = [] // pos 0 will always contain the active build

webpack(config).watch({}, (err, stats) => {
  if (err) {
    console.error(err);
  } 
  
  console.log(chalk.bgBlack(chalk.cyan('\n=====================================================')))
  // console.log(chalk.bgCyan(chalk.yellow('\n=====================================================')))
  var parentDir = path.resolve(process.cwd());
  try {
    if (children.length) {
      process.kill(-children[0].pid) // attempt to kill previous process
     
    }
    const child = spawn('yarn', ['build'], spawnOption);
    children.push(child)

    let childPID = chalk.cyan(`${child.pid}`)

    console.log(chalk.cyan(`(New Build) Node {${childPID}}`))
    
    // use child.stdout.setEncoding('utf8'); if you want text chunks
    child.stdout.on('data', (chunk) => {
      console.log(`  ${childPID}:   `+chunk.toString())
    });
  
    child.stderr.on('data', function(chunk) {
      console.error(chunk.toString());
    }); 
    
    child.on('close', (code) => {
      const terminated = children.shift() // if we reached here somebody is done or dead
      let childPID = chalk.cyan(`${child.pid}`)
      let status = (child.pid===terminated.pid) ? chalk.cyan('True'): chalk.red('False')
      if (code === 0) {
        console.log(chalk.blue(`(Current) Node {${childPID}} terminated Successfully = ${status}`));
      } else {
        console.log(chalk.yellow(`(Previous Build) Node{${chalk.red(''+child.pid)}} died in the line of duty (code=${chalk.red(''+code)})`));
      }
    });
  } catch (err){
    console.error(chalk.red("An Error Happened", err))
  }

});



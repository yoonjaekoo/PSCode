#!/usr/bin/env node
const { execSync } = require('child_process');
const os = require('os');

const url = 'https://github.com/yoonjaekoo-edu/PSCode/releases/latest/download/PSCode_Setup.exe';
const file = `${os.tmpdir()}\\PSCode_Setup.exe`;

console.log('Downloading PSCode...');
execSync(`curl -L -o "${file}" "${url}"`, { stdio: 'inherit' });

console.log('Installing...');
execSync(`"${file}"`, { stdio: 'inherit' });

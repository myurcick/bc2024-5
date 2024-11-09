const express = require('express');
const { Command } = require('commander');

const app = express();
const program = new Command();

program
  .requiredOption('-h, --host <string>', 'server address')
  .requiredOption('-p, --port <number>', 'server port')
  .requiredOption('-c, --cache <path>', 'cache directory path')
  .parse(process.argv);

const { host, port, cache } = program.opts();

console.log(`Server starting at http://${host}:${port}`);
console.log(`Cache directory: ${cache}`);

app.get('/', (req, res) => {
  res.send('Server is running!');
});

app.listen(port, host, () => {
  console.log(`Server is running at http://${host}:${port}`);
});

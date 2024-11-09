const express = require('express');
const { Command } = require('commander');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const program = new Command();

program
  .requiredOption('-h, --host <string>', 'server address')
  .requiredOption('-p, --port <number>', 'server port')
  .requiredOption('-c, --cache <path>', 'cache directory path')
  .parse(process.argv);

const { host, port, cache } = program.opts();

// Перевірка наявності каталогу для кешу
(async () => {
  try {
    await fs.access(cache);
  } catch (err) {
    console.error(`Cache directory "${cache}" does not exist.`);
    process.exit(1);
  }
})();

app.use(express.urlencoded({ extended: true })); // Для обробки form-data
app.use(express.json()); // Для обробки JSON

// Вказуємо Express на обслуговування статичних файлів з кореневої директорії
app.use(express.static(path.join(__dirname))); // Вказуємо поточну директорію для статичних файлів

// GET /notes/:noteName
app.get('/notes/:noteName', async (req, res) => {
  const noteName = req.params.noteName;
  const notePath = path.join(cache, `${noteName}.txt`);

  try {
    const noteContent = await fs.readFile(notePath, 'utf8');
    res.send(noteContent);
  } catch (error) {
    res.status(404).send('Note not found');
  }
});

// PUT /notes/:noteName
app.put('/notes/:noteName', async (req, res) => {
  const noteName = req.params.noteName;
  const notePath = path.join(cache, `${noteName}.txt`);

  try {
    await fs.access(notePath);
    await fs.writeFile(notePath, req.body.text || '');
    res.send('Note updated');
  } catch (error) {
    res.status(404).send('Note not found');
  }
});

// DELETE /notes/:noteName
app.delete('/notes/:noteName', async (req, res) => {
  const noteName = req.params.noteName;
  const notePath = path.join(cache, `${noteName}.txt`);

  try {
    await fs.unlink(notePath);
    res.send('Note deleted');
  } catch (error) {
    res.status(404).send('Note not found');
  }
});

// GET /notes
app.get('/notes', async (req, res) => {
  try {
    const files = await fs.readdir(cache);
    const notes = await Promise.all(
      files.map(async (file) => {
        const content = await fs.readFile(path.join(cache, file), 'utf8');
        return { name: path.basename(file, '.txt'), text: content };
      })
    );
    res.status(200).json(notes);
  } catch (error) {
    res.status(500).send('Internal Server Error');
  }
});

// POST /write
app.post('/write', async (req, res) => {
  const { note_name: noteName, note: noteText } = req.body;
  const notePath = path.join(cache, `${noteName}.txt`);

  try {
    // Перевірка, чи існує файл з таким ім'ям
    await fs.access(notePath);
    res.status(400).send('Note already exists');
  } catch {
    // Створення нотатки
    await fs.writeFile(notePath, noteText || '');
    res.status(201).send('Note created');
  }
});

app.listen(port, host, () => {
  console.log(`Server is running at http://${host}:${port}`);
});



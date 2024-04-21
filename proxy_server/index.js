const express = require('express');
const app = express();

const corsOptions = {
  origin: 'chrome-extension://*',
};

app.use(cors(corsOptions));
app.use(express.json());

app.get('/', (req, res) => {
  try {
    res.status(200).send('Hello World!');
  } catch (error) {
    res.status(400).end();
  }
});

async function responseToJson(url) {
  const response = await fetch(url);
  return await response.json();
}

const USE_POINT_URL = `https://www.degen.tips/api/airdrop2/season3/points?address=`;
const USE_TIP_URL = `https://www.degen.tips/api/airdrop2/tip-allowance?address=`;
app.get('/points', async (req, res) => {
  try {
    const { address } = req.query;

    const result = await responseToJson(USE_POINT_URL + address);
    console.log(result);
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(400).send({ error });
  }
});

app.get('/tips', async (req, res) => {
  try {
    const { address } = req.query;

    const result = await responseToJson(USE_TIP_URL + address);
    console.log(result);
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(400).send({ error });
  }
});

app.listen(1005, () => {
  console.log(`SERVER START PORT 1005.`);
});

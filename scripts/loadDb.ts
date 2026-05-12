import { DataAPIClient } from "@datastax/astra-db-ts";
import OpenAI from "openai";
import { PuppeteerWebBaseLoader } from "@langchain/community/document_loaders/web/puppeteer";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

import "dotenv/config";
import { log } from "console";
import { url } from "inspector";

type SimilarityMetric = "dot_product" | "cosine" | "euclidean";

const {
  ASTRA_DB_NAMESPACE,
  ASTRA_DB_COLLECTION,
  ASTRA_DB_API_ENDPOINT,
  ASTRA_DB_APPLICATION_TOKEN,
  OPENAI_API_KEY,
} = process.env;

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

const f1Data = [
  "https://en.wikipedia.org/wiki/Formula_One",
  "https://en.wikipedia.org/wiki/Formula_One_Grand_Prix",
  "https://en.wikipedia.org/wiki/Formula_One_drivers",
  "https://en.wikipedia.org/wiki/Formula_One_teams",
  "https://www.formula1.com/en/racing/2026",
  "https://www.formula1.com/en/teams",
  "https://www.formula1.com/en/results/2026/races",
  "https://www.formula1.com/en/results/2026/drivers",
  "https://www.formula1.com/en/results/2026/team",
  "https://www.formula1.com/en/latest",
  "https://www.espn.in/f1/",
  "https://www.forbes.com/sites/brettknight/2025/12/09/formula-1s-highest-paid-drivers-2025/",
  "https://www.forbes.com/sites/brettknight/2025/11/20/formula-1s-most-valuable-teams-2025/",
  "https://www.formula1.com/en/latest/article/drivers-teams-cars-circuits-and-more-everything-you-need-to-know-about.7iQfL3Rivf1comzdqV5jwc",
  "https://en.wikipedia.org/wiki/Formula_One_regulations",
  "https://www.formula1.com/en/latest/article/the-beginners-guide-to-the-2026-regulations.6j0tS0hrHG2T01tpmK6XYz",
];

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
const db = client.db(ASTRA_DB_API_ENDPOINT, { namespace: ASTRA_DB_NAMESPACE });

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 512,
  chunkOverlap: 100,
});

const createCollection = async (
  similarityMetric: SimilarityMetric = "dot_product",
) => {
  const res = await db.createCollection(ASTRA_DB_COLLECTION, {
    vector: {
      dimension: 1536,
      metric: similarityMetric,
    },
  });
  console.log("Collection created:", res);
};

const loadSampleData = async () => {
  const collection = await db.collection(ASTRA_DB_COLLECTION);
  for await (const url of f1Data) {
    const content = await scrapePage(url);
    const chunks = await splitter.splitText(content);
    for await (const chunk of chunks) {
      const embedding = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: chunk,
        encoding_format: "float",
      });

      const vector = embedding.data[0].embedding;

      const res = await collection.insertOne({
        $vector: vector,
        text: chunk,
      });

      console.log("Inserted chunk with ID:", res);
    }
  }
};

const scrapePage = async (url: string) => {
  const loader = new PuppeteerWebBaseLoader(url, {
    launchOptions: {
      headless: true,
    },
    gotoOptions: {
      waitUntil: "domcontentloaded",
    },
    evaluate: async (page, browser) => {
      const result = await page.evaluate(() => document.body.innerText);
      await browser.close();
      return result;
    },
  });

  return (await loader.scrape())?.replace(/<[^>]*>?/gm, "");
};

createCollection().then(() => loadSampleData());

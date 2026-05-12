import { openai } from "@ai-sdk/openai";
import { streamText, convertToModelMessages } from "ai";
import { DataAPIClient } from "@datastax/astra-db-ts";

const {
  ASTRA_DB_NAMESPACE,
  ASTRA_DB_COLLECTION,
  ASTRA_DB_API_ENDPOINT,
  ASTRA_DB_APPLICATION_TOKEN,
} = process.env;

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);

const db = client.db(ASTRA_DB_API_ENDPOINT!, {
  namespace: ASTRA_DB_NAMESPACE,
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const latestMessage = messages[messages.length - 1];

    const latestText =
      latestMessage.parts
        ?.filter((part: any) => part.type === "text")
        ?.map((part: any) => part.text)
        ?.join("") || "";

    let docContext = "";

    const embeddingResult = await openai
      .textEmbeddingModel("text-embedding-3-small")
      .doEmbed({
        values: [latestText],
      });

    const embedding = embeddingResult.embeddings[0];

    try {
      const collection = await db.collection(ASTRA_DB_COLLECTION!);

      const cursor = await collection.find(
        {},
        {
          sort: {
            $vector: embedding,
          },
          limit: 20,
          includeSimilarity: true,
        },
      );

      const documents = await cursor.toArray();

      console.log(
        "Retrieved documents from Astra DB:",
        documents.length,
        documents.map((doc: any) => doc.$similarity?.toFixed(4)),
      );
      const docsMap = documents.map(
        (doc: any, index: number) => `Document ${index + 1}:\n${doc.text}`,
      );

      docContext = docsMap.join("\n\n---\n\n");
    } catch (error) {
      console.error("Error querying DB...", error);

      docContext = "";
    }

    const systemPrompt = `You are an AI assistant who knows everything about Formula One. Use the below context to augment what you know about Formula One racing. The context will provide you with the most recent page data from wikipedia, the official F1 website and others. If the context doesn't include the information you need answer based on your existing knowledge and don't mention the source of your information or what the context does or doesn't include. Format responses using markdown where applicable and don't return images.
      ---------
      START CONTEXT
      ${docContext}
      END CONTEXT
      ---------
      QUESTION: ${latestMessage}
      ---------
      `;

    const result = streamText({
      model: openai("gpt-4"),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Error processing request...", error);

    return new Response("Internal Server Error", {
      status: 500,
    });
  }
}

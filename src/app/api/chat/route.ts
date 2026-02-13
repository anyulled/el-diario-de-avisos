import { aiProviderRegistry } from "@/lib/ai-provider-registry";
import chalk from "chalk";
import { getLatestContent, getRelevantContext, constructSystemPrompt, convertToModelMessages, executeWithFallback, UIMessage } from "./chat-request-runner";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();
    const latestContent = getLatestContent(messages);

    console.log(chalk.blue.bold("🤖 [Chatbot] Received prompt:"), chalk.blue(latestContent));

    // 1. Find relevant context from the newspaper archives
    const contextArticles = await getRelevantContext(latestContent);

    // 2. Augment the prompt
    const systemPrompt = constructSystemPrompt(contextArticles);

    // 3. Get fallback chain and try providers
    const fallbackChain = aiProviderRegistry.getFallbackChain();
    const modelMessages = convertToModelMessages(messages);

    return await executeWithFallback(fallbackChain, modelMessages, systemPrompt);
  } catch (error) {
    console.error(chalk.red("❌ [Error] Chat API:"), error);
    // Return a specific error message for testing consistency
    return Response.json({ error: "Ha ocurrido un error en vuestra consulta. Por favor, intentad más tarde." }, { status: 500 });
  }
}

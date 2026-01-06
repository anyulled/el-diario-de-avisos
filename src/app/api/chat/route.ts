import { findSimilarArticles } from "@/lib/vector-store";
import { createGroq } from "@ai-sdk/groq";
import { streamText } from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();
  const latestMessage = messages[messages.length - 1];

  // Extract text content from UIMessage parts
  const latestContent =
    latestMessage.parts
      ?.filter((part: { type: string }) => part.type === "text")
      .map((part: { text: string }) => part.text)
      .join("") ||
    latestMessage.content ||
    "";

  // 1. Find relevant context from the newspaper archives
  const contextArticles = await findSimilarArticles(latestContent, 3);

  const contextString =
    contextArticles.length > 0
      ? contextArticles.map((a) => `- "${a.title}" (${a.date}) [ID: ${a.id}] - Relevancia: ${Math.round(a.similarity * 100)}%`).join("\n")
      : "No se encontraron artículos específicos en el archivo para esta consulta.";

  // 2. Augment the prompt
  const systemPrompt = `
Eres un distinguido cronista y archivero de la "Gazeta Musical de Caracas", transportado desde el siglo XIX al presente por las artes de la tecnología.
Tu lenguaje debe ser el castellano elegante, formal y florido de la Caracas decimonónica.

REGLAS DE ORO DE TU COMPORTAMIENTO:
1. TEMÁTICA ÚNICA: Tu conocimiento y conversación deben girar exclusivamente en torno a:
   - Las noticias, tertulias y eventos musicales en la Caracas del siglo XIX.
   - Los "Integrantes" (colaboradores e investigadores de este proyecto).
   - El "Tutor" (el catedrático responsable de esta noble labor).

2. RESTRICCIONES:
   - Si se os pregunta por temas ajenos a la música, la historia de Caracas en 1800, o sobre los mencionados integrantes y tutores, debéis rehusar con suma elegancia.
   - Decid algo como: "Lamento informaros, distinguido lector, que mi pluma y memoria están consagradas únicamente a la lira y los anales de nuestra Caracas musical. No poseo noticias sobre tales asuntos modernos/ajenos."

3. ESTILO Y TRATO:
   - Dirígete al usuario con deferencia: "Estimado lector", "Vuestra merced", "Excelentísimo señor".
   - Usa un léxico rico: "filarmonía", "soberbia ejecución", "crónica", "éxtasis sonoro", "gazeta".
   - No rompas nunca el personaje.

4. CITACIÓN DE FUENTES:
   - Cuando menciones información de los artículos del archivo, DEBES incluir un enlace usando este formato exacto:
   - [Título del artículo](/article/ID)
   - Por ejemplo: [Concierto en el Teatro Municipal](/article/123)
   - Los IDs de los artículos disponibles se encuentran en el contexto abajo.

CONTEXTO DE NUESTRAS GAZETAS (Usa estos datos para vuestras respuestas):
${contextString}

Si los datos arriba expuestos son de provecho, citad el título y fecha de la nota como se hacía en las mejores publicaciones de antaño, e INCLUYE el enlace al artículo usando el formato [Título](/article/ID).
`;

  const groq = createGroq({
    apiKey: process.env.GROQ_KEY,
  });

  // Convert UIMessage format to CoreMessage format for streamText
  const coreMessages = messages.map((msg: { role: string; parts?: Array<{ type: string; text?: string }>; content?: string }) => {
    // Extract text from parts if present, otherwise use content
    const textContent =
      msg.parts
        ?.filter((part) => part.type === "text")
        .map((part) => part.text)
        .join("") ||
      msg.content ||
      "";

    return {
      role: msg.role,
      content: textContent,
    };
  });

  // 3. Stream the response using Groq (Llama 3)
  const result = streamText({
    model: groq("llama-3.3-70b-versatile"),
    system: systemPrompt,
    messages: coreMessages,
  });

  return result.toUIMessageStreamResponse();
}

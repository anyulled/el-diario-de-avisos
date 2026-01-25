import { getArticleById } from "@/app/actions";
import fs from "fs";
import { ImageResponse } from "next/og";
import path from "path";

export const alt = "Noticias Musicales en el Diario de Avisos - Detalle de Noticia";
export const size = {
  width: 1200,
  height: 630,
};

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = await getArticleById(Number(id));

  const bgPath = path.join(process.cwd(), "public/og-background.png");
  const bgData = await fs.promises.readFile(bgPath);
  const bgBase64 = `data:image/png;base64,${bgData.toString("base64")}`;

  if (!article) {
    return new ImageResponse(
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#fdfbf7",
          backgroundImage: `url(${bgBase64})`,
          backgroundSize: "100% 100%",
        }}
      >
        <h1 style={{ fontSize: "60px", fontFamily: "serif" }}>Artículo no encontrado</h1>
      </div>,
      { ...size },
    );
  }

  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "flex-end",
        backgroundColor: "#fdfbf7",
        backgroundImage: `url(${bgBase64})`,
        backgroundSize: "100% 100%",
        padding: "80px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          maxWidth: "900px",
          marginBottom: "40px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <span
            style={{
              backgroundColor: "#d97706",
              color: "white",
              padding: "8px 16px",
              fontSize: "20px",
              fontWeight: "bold",
              textTransform: "uppercase",
              marginRight: "20px",
            }}
          >
            Noticia
          </span>
          <span style={{ fontSize: "24px", color: "#64748b" }}>{article.date || `Año ${article.publicationYear}`}</span>
        </div>
        <h1
          style={{
            fontSize: "64px",
            fontFamily: "serif",
            color: "#1e293b",
            margin: 0,
            lineHeight: 1.1,
            fontWeight: "bold",
          }}
        >
          {article.title || "Sin Título"}
        </h1>
      </div>
    </div>,
    {
      ...size,
    },
  );
}

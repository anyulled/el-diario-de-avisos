import fs from "fs";
import { ImageResponse } from "next/og";
import path from "path";

export const alt = "El Diario de Avisos - Archivo Histórico";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image() {
  const bgPath = path.join(process.cwd(), "public/og-background.png");
  const bgData = fs.readFileSync(bgPath);
  const bgBase64 = `data:image/png;base64,${bgData.toString("base64")}`;

  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fdfbf7",
        backgroundImage: `url(${bgBase64})`,
        backgroundSize: "100% 100%",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: "80px",
            fontFamily: "serif",
            color: "#1e293b",
            margin: 0,
            fontWeight: "bold",
            letterSpacing: "-0.05em",
          }}
        >
          El Diario de Avisos
        </h1>
        <p
          style={{
            fontSize: "32px",
            fontFamily: "serif",
            color: "#64748b",
            marginTop: "20px",
            fontStyle: "italic",
          }}
        >
          Archivo Histórico Digital
        </p>
      </div>
    </div>,
    {
      ...size,
    },
  );
}

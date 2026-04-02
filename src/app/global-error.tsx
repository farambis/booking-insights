"use client";

export default function GlobalError() {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          color: "#171717",
          backgroundColor: "#ffffff",
          padding: "16px",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: "24px", fontWeight: 600, margin: 0 }}>
          Booking Insights is unavailable
        </h1>
        <p
          style={{
            fontSize: "14px",
            color: "#737373",
            margin: 0,
            maxWidth: "360px",
          }}
        >
          The application encountered a critical error. Please reload the page.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: "16px",
            padding: "8px 16px",
            fontSize: "14px",
            fontWeight: 500,
            color: "#ffffff",
            backgroundColor: "#171717",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Reload
        </button>
      </body>
    </html>
  );
}

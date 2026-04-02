"use client";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error(error);

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
          fontFamily:
            'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
          backgroundColor: "#f4f7fa",
          color: "#1a1a1a",
          textAlign: "center",
          padding: "1rem",
        }}
      >
        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: 600,
            letterSpacing: "-0.025em",
            margin: 0,
          }}
        >
          Northscope is unavailable
        </h1>
        <p
          style={{
            marginTop: "0.5rem",
            maxWidth: "28rem",
            color: "#737880",
            fontSize: "1rem",
            lineHeight: 1.5,
          }}
        >
          The application encountered a critical error. Please reload the page.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: "1.5rem",
            padding: "0.625rem 1.25rem",
            fontSize: "0.875rem",
            fontWeight: 500,
            color: "#ffffff",
            backgroundColor: "#006fd6",
            border: "none",
            borderRadius: "0.5rem",
            cursor: "pointer",
          }}
        >
          Reload
        </button>
      </body>
    </html>
  );
}

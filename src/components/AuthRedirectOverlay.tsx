import wordmark from "@/assets/rebase-wordmark.png";

export default function AuthRedirectOverlay() {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#0A0A0A",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "28px",
      }}
    >
      <img
        src={wordmark}
        alt="Rebase"
        style={{
          height: 48,
          width: "auto",
          filter: "brightness(0) invert(1)",
        }}
      />
      <div
        style={{
          width: 36,
          height: 36,
          border: "3px solid rgba(255,255,255,0.15)",
          borderTopColor: "#F9ECD9",
          borderRadius: "50%",
          animation: "rebase-auth-spin 1s linear infinite",
        }}
      />
      <style>{`@keyframes rebase-auth-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

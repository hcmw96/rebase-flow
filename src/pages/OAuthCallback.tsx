import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const OAuthCallback = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const code = searchParams.get("code");
    const idToken = searchParams.get("id_token");

    if (!code) {
      setError("Authorization code não encontrado.");
      setLoading(false);
      return;
    }

    const exchangeToken = async () => {
      try {
        const response = await fetch(
          "https://wdgyuxkqqmtxcltsfkel.supabase.co/functions/v1/getMindbodyToken",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              // Se a function exigir autenticação, inclua:
              "Authorization": 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkZ3l1eGtxcW10eGNsdHNma2VsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMjk4MjksImV4cCI6MjA2ODkwNTgyOX0.mmXnxGqS9lyviLYcQ-XPkpimRGypJQkDcqlMb5poHIo',
            },
            body: JSON.stringify({ code }),
          }
        );

        if (!response.ok) {
          throw new Error("Erro ao trocar code por token");
        }

        const data = await response.json();
        console.log("Tokens recebidos:", data);

        // Aqui você guarda os tokens para usar depois
        localStorage.setItem("mindbody_tokens", JSON.stringify(data));

        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };

    exchangeToken();
  }, [location.search]);

  if (loading) return <div>Processando login...</div>;
  if (error) return <div>Erro: {error}</div>;

  return <div>Login concluído com sucesso 🎉</div>;
};

export default OAuthCallback;
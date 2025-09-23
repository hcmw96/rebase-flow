import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const OAuthCallback = () => {
  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const code = searchParams.get("code");

    if (code) {
      fetch(
        "https://wdgyuxkqqmtxcltsfkel.supabase.co/functions/v1/getMindbodyToken",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Se a function exigir autenticação, inclua:
            "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkZ3l1eGtxcW10eGNsdHNma2VsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMjk4MjksImV4cCI6MjA2ODkwNTgyOX0.mmXnxGqS9lyviLYcQ-XPkpimRGypJQkDcqlMb5poHIo", // substitua pela sua chave segura
          },
          body: JSON.stringify({ code }),
        }
      )
      .then(res => res.json())
      .then(data => {
        console.log("Access token:", data.access_token);
        // Aqui você pode salvar o token no estado, localStorage ou contexto
      })
      .catch(err => console.error("Erro ao obter token:", err));
    }
  }, [location]);

  return <div>Loading...</div>;
};

export default OAuthCallback;
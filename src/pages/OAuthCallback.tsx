import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const OAuthCallback = () => {
  const location = useLocation();

  useEffect(() => {
    console.log("OAuthCallback carregado. Location:", location);

    // Pegar query string
    const searchParams = new URLSearchParams(location.search);
    const code = searchParams.get("code");
    console.log("Code extraído da URL:", code);

    if (!code) {
      console.error("Nenhum 'code' encontrado na URL. Verifique se o Mindbody redirecionou corretamente.");
      return;
    }

    // Requisição para função Supabase
    fetch("https://wdgyuxkqqmtxcltsfkel.supabase.co/functions/v1/getMindbodyToken", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkZ3l1eGtxcW10eGNsdHNma2VsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMjk4MjksImV4cCI6MjA2ODkwNTgyOX0.mmXnxGqS9lyviLYcQ-XPkpimRGypJQkDcqlMb5poHIo", 
      },
      body: JSON.stringify({ code }),
    })
      .then(async res => {
        console.log("Status da resposta:", res.status);
        const text = await res.text();
        console.log("Resposta bruta:", text);
        try {
          return JSON.parse(text);
        } catch (e) {
          throw new Error("Falha ao parsear JSON da resposta: " + e.message);
        }
      })
      .then(data => {
        console.log("Access token recebido:", data.access_token);
        // Aqui você pode salvar o token no estado, localStorage ou contexto
      })
      .catch(err => console.error("Erro ao obter token:", err));
  }, [location]);

  return <div>Loading OAuth callback...</div>;
};

export default OAuthCallback;
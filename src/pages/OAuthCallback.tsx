import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const OAuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const response = await fetch(
          "https://wdgyuxkqqmtxcltsfkel.supabase.co/functions/v1/getMindbodyToken",
          {
            method: "POST",
            headers: {
              "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkZ3l1eGtxcW10eGNsdHNma2VsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMjk4MjksImV4cCI6MjA2ODkwNTgyOX0.mmXnxGqS9lyviLYcQ-XPkpimRGypJQkDcqlMb5poHIo",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ name: "Functions" }),
          }
        );

        if (!response.ok) throw new Error(`Erro ${response.status}`);

        const data = await response.json();
        console.log("Token recebido:", data.access_token);

        // Redireciona para seu app passando o token (opcional)
        navigate(`/app?access_token=${data.access_token}`);
      } catch (err: any) {
        console.error("Erro ao obter token:", err.message);
      }
    };

    fetchToken();
  }, [navigate]);

  return <div>Carregando token do Mindbody...</div>;
};

export default OAuthCallback;
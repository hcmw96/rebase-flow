import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Callback = () => {
  const [status, setStatus] = useState("Processando login...");
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");

    if (!code) {
      setStatus("❌ Authorization code não encontrado.");
      console.error("Authorization code não encontrado.");
      return;
    }

    const fetchToken = async () => {
      try {
        setStatus("🔄 Validando com servidor...");

        const response = await fetch(
          `https://wdgyuxkqqmtxcltsfkel.supabase.co/functions/v1/mindbody-oauth`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              // Substitua pelo token anônimo ou de serviço válido
              Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkZ3l1eGtxcW10eGNsdHNma2VsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMjk4MjksImV4cCI6MjA2ODkwNTgyOX0.mmXnxGqS9lyviLYcQ-XPkpimRGypJQkDcqlMb5poHIo',
            },
            body: JSON.stringify({
              action: "callback",
              code,
              state,
            }),
          }
        );

        const data = await response.json();
        console.log("Callback Response:", data);

        if (response.ok && data.success) {
          // Salva tokens no localStorage
          if (data.connection) {
            localStorage.setItem("access_token", data.connection.access_token || "");
            localStorage.setItem("refresh_token", data.connection.refresh_token || "");
            localStorage.setItem("expires_at", data.connection.expires_at || "");
          }

          setStatus("✅ Login concluído! Redirecionando...");
          setTimeout(() => navigate("/services"), 1500);
        } else {
          console.error("Erro do servidor:", data);
          setStatus("❌ Erro no login com Mindbody");
        }
      } catch (err) {
        console.error("Erro ao processar callback:", err);
        setStatus("❌ Erro interno no callback");
      }
    };

    fetchToken();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-black text-white">
      <p>{status}</p>
    </div>
  );
};
export default Callback;
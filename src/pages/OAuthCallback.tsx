import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const OAuthCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.log("OAuthCallback carregado");

    // Captura o code da query string
    const params = new URLSearchParams(location.search);
    const code = params.get("code");

    if (!code) {
      console.warn("Nenhum code encontrado na URL");
      return;
    }

    console.log("Code recebido:", code);

    // Chamada para a Edge Function que troca code pelo token
    fetch("https://wdgyuxkqqmtxcltsfkel.supabase.co/functions/v1/getMindbodyToken", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code })
    })
      .then(async (res) => {
        console.log("Status da resposta:", res.status);
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Erro ${res.status}: ${text}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log("Resposta da API:", data);
        if (!data.access_token) {
          console.error("Nenhum access_token retornado");
          return;
        }
        console.log("Access token recebido:", data.access_token);

        // Aqui você pode salvar o token ou redirecionar
        localStorage.setItem("mindbody_token", data.access_token);
        navigate("/services"); // redireciona para a página de serviços
      })
      .catch((err) => {
        console.error("Erro ao obter token:", err);
      });
  }, [location, navigate]);

  return <div>Autenticando com Mindbody...</div>;
};

export default OAuthCallback;

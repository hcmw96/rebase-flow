import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const OAuthCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.log("OAuthCallback carregado");
    console.log("Location object:", location);

    const params = new URLSearchParams(location.search);
    const code = params.get("code");

    if (!code) {
      console.warn("Nenhum code encontrado na URL");
      return;
    }

    console.log("Received code:", code);

    fetch("https://wdgyuxkqqmtxcltsfkel.supabase.co/functions/v1/getMindbodyToken", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code })
    })
      .then(res => {
        console.log("Response status:", res.status);
        console.log("Response headers:", res.headers);
        if (!res.ok) throw new Error(`Erro ${res.status}`);
        return res.json();
      })
      .then(data => {
        console.log("Raw token data:", data);
        if (!data.access_token) {
          console.error("Nenhum access_token retornado");
          return;
        }
        console.log("Access token recebido:", data.access_token);
        navigate(`/app?access_token=${data.access_token}`);
      })
      .catch(err => console.error("Erro ao obter token:", err));
  }, [location, navigate]);

  return <div>Carregando token do Mindbody...</div>;
};

export default OAuthCallback;

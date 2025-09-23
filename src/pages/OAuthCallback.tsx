import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const OAuthCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get("code");
    
    if (!code) return; // nada para fazer se não tiver code
      console.log("Received code:", code); // ✅ verifica se o code está correto
    fetch("https://wdgyuxkqqmtxcltsfkel.supabase.co/functions/v1/getMindbodyToken", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }) // ✅ envia o code correto
    })
      .then(res => {
        if (!res.ok) throw new Error(`Erro ${res.status}`);
        return res.json();
      })
      .then(data => {
        console.log("Token:", data.access_token);
        // salvar token local ou redirecionar
        navigate(`/app?access_token=${data.access_token}`);
      })
      .catch(err => console.error("Erro ao obter token:", err));
  }, [location, navigate]);

  return <div>Carregando...</div>;
};

export default OAuthCallback;

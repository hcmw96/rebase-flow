import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const OAuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const code = searchParams.get("code");

    if (code) {
      // Chama a Edge Function para trocar code por token
      fetch("https://nazkkahmjbsuihkdbhdn.supabase.co/functions/v1/getMindbodyToken", {
        method: "POST",
          headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`, // use a variável de ambiente
            },
        body: JSON.stringify({
          code,
          redirectUri: "http://localhost:8080/services",
          subscriberId: "f660fd3e-a0d6-4f66-878c-871c9860e565",
          grant_type: "authorization_code",
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.access_token) {
            // Salva tokens no localStorage
            localStorage.setItem("access_token", data.access_token);
            if (data.refresh_token) {
              localStorage.setItem("refresh_token", data.refresh_token);
            }
            console.log("Access token salvo no localStorage:", data.access_token);
          } else {
            console.error("Erro ao obter token:", data);
          }
        })
        .finally(() => {
          // Redireciona de volta para a página principal
          navigate("/");
        });
    }
  }, [location, navigate]);

  return <div>Carregando...</div>;
};

export default OAuthCallback;

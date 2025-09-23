import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const OAuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const code = searchParams.get("code");
    const idToken = searchParams.get("id_token");

    if (code) {
      console.log("Code recebido:", code);
      // aqui você pode chamar outra Supabase Function para trocar o code por access_token
    }
  }, [location, navigate]);

  return <div>Processando login...</div>;
};

export default OAuthCallback;
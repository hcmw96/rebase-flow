import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById("root")!).render(<App />);

// Remove the pre-React boot loader (used on OAuth callback landing)
// once the app has had a tick to mount and AuthContext has consumed the hash.
requestAnimationFrame(() => {
  setTimeout(() => {
    const el = document.getElementById('boot-loader');
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }, 50);
});

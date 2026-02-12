import { useState, useEffect } from 'react';

export function useNative() {
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    setIsNative(navigator.userAgent.includes('despia'));
  }, []);

  return isNative;
}

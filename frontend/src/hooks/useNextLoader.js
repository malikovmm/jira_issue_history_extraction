import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function useNextLoader() {
  const [routerLoading, setRouterLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleStart = () => {
      setRouterLoading(true);
    };
    const handleComplete = () => {
      setRouterLoading(false);
    };

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
    };
  });
  return routerLoading;
}

import { useEffect, useState } from 'react';

export function useReadingTimer(open: boolean, nodeId: string | null): number {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!open || nodeId === null) {
      return undefined;
    }

    const startTime = Date.now();
    const interval = window.setInterval(() => {
      setSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => {
      window.clearInterval(interval);
      setSeconds(0);
    };
  }, [nodeId, open]);

  return seconds;
}

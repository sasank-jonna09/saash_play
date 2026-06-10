import { useState, useCallback, useRef } from 'react';

export function useFileHash() {
  const [hash, setHash] = useState(null);
  const [isHashing, setIsHashing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const workerRef = useRef(null);

  const computeHash = useCallback((file) => {
    if (!file) return;

    if (workerRef.current) {
      workerRef.current.terminate();
    }

    setIsHashing(true);
    setHash(null);
    setError(null);
    setProgress(0);

    const worker = new Worker(new URL('../workers/md5.worker.js', import.meta.url), { type: 'module' });
    workerRef.current = worker;

    worker.onmessage = (e) => {
      if (e.data.hash) {
        setHash(e.data.hash);
        setIsHashing(false);
        worker.terminate();
        workerRef.current = null;
      } else if (e.data.error) {
        setError(e.data.error);
        setIsHashing(false);
        worker.terminate();
        workerRef.current = null;
      }
    };

    worker.onerror = (err) => {
      setError(err.message || 'Worker error');
      setIsHashing(false);
      worker.terminate();
      workerRef.current = null;
    };

    worker.postMessage({ file });
  }, []);

  return { hash, isHashing, progress, error, computeHash };
}

import SparkMD5 from 'spark-md5';

self.addEventListener('message', (e) => {
  const file = e.data.file;
  if (!file) return;

  const chunkSize = 2097152; // 2MB
  const size = file.size;
  
  // Sample-based hashing: Start, Middle, End
  const chunks = [];
  chunks.push(file.slice(0, Math.min(chunkSize, size)));
  if (size > chunkSize * 2) {
    const mid = Math.floor(size / 2);
    chunks.push(file.slice(mid, mid + chunkSize));
  }
  if (size > chunkSize) {
    const endChunkStart = Math.max(size - chunkSize, 0);
    chunks.push(file.slice(endChunkStart, size));
  }
  
  const sampleBlob = new Blob(chunks);
  const spark = new SparkMD5.ArrayBuffer();
  const fileReader = new FileReader();

  fileReader.onload = (e) => {
    spark.append(e.target.result);
    // Include file size and name metadata
    const metadata = `${file.name}-${file.size}-${file.lastModified}`;
    spark.append(new TextEncoder().encode(metadata).buffer);
    self.postMessage({ hash: spark.end() });
  };

  fileReader.onerror = () => {
    self.postMessage({ error: 'File read error' });
  };

  fileReader.readAsArrayBuffer(sampleBlob);
});

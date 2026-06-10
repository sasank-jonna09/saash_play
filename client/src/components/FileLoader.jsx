import { useRef, useState, useEffect } from 'react';

export default function FileLoader({ onFileSelected, isHashing, hashError }) {
  const fileInputRef = useRef(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile('ontouchstart' in window);
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!isMobile) setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('video/')) {
        onFileSelected(file);
      }
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith('video/') || file.name.match(/\.(mp4|mkv|webm|avi|mov)$/i)) {
        onFileSelected(file);
      } else {
        alert("Please select a valid video file.");
      }
    }
  };

  if (isHashing) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-center bg-white/50 backdrop-blur-md rounded-3xl w-full max-w-md shadow-glass border border-white/40">
        <div className="w-12 h-12 border-4 border-sv-accent border-t-transparent rounded-full animate-spin mb-5"></div>
        <p className="text-sv-text font-bold text-lg">Verifying file...</p>
        <p className="text-sv-muted font-medium text-sm mt-2">Computing secure hash to ensure perfect sync.</p>
      </div>
    );
  }

  return (
    <div 
      className={`border-[3px] border-dashed rounded-3xl p-16 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 w-full max-w-2xl mx-4 ${isDragActive && !isMobile ? 'border-sv-accent bg-indigo-50/50 scale-105 shadow-float' : 'border-sv-border bg-white/60 backdrop-blur-sm hover:border-sv-accent hover:bg-white hover:shadow-glass'}`}
      onClick={() => fileInputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleChange} 
        className="hidden" 
      />
      <div className="w-20 h-20 bg-indigo-50 text-sv-accent rounded-full flex items-center justify-center mb-6 shadow-sm">
        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      </div>
      {isMobile ? (
        <h3 className="text-2xl font-bold text-sv-text mb-2 text-center">Tap to select your video</h3>
      ) : (
        <>
          <h3 className="text-2xl font-bold text-sv-text mb-2 text-center">Drop your video file here</h3>
          <p className="text-sv-muted font-medium">or click to browse from your computer</p>
        </>
      )}
      {hashError && <p className="text-red-500 mt-5 font-bold text-sm bg-red-50 px-4 py-2 rounded-lg">{hashError}</p>}
    </div>
  );
}

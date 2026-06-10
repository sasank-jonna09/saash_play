function log(level, ...args) {
  const now = new Date();
  const timeString = now.toLocaleTimeString('en-US', { hour12: false }); // HH:MM:SS format
  
  const prefix = `[${timeString}] [${level}]`;
  
  switch (level) {
    case 'INFO':
      console.log(prefix, ...args);
      break;
    case 'WARN':
      console.warn(prefix, ...args);
      break;
    case 'ERROR':
      console.error(prefix, ...args);
      break;
    default:
      console.log(prefix, ...args);
  }
}

module.exports = { log };

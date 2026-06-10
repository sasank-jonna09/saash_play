import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { RoomProvider } from './context/RoomContext';
import Landing from './pages/Landing';
import Room from './pages/Room';

function App() {
  return (
    <RoomProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/room/:roomCode" element={<Room />} />
        </Routes>
      </Router>
    </RoomProvider>
  );
}

export default App;

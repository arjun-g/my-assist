import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

import Chat from './pages/chat';
import Settings from './pages/settings';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/chat" element={<Chat />} />
        <Route path='/settings' element={<Settings />} />
      </Routes>
    </Router>
  );
}

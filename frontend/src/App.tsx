import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import Layout from './components/Layout';
import Home from './pages/Home';
import Files from './pages/Files';
import IdeaToVideo from './pages/IdeaToVideo';
import GettingStarted from './pages/help/GettingStarted';
import FAQs from './pages/help/FAQs';
import Contact from './pages/help/Contact';
import Settings from './pages/Settings';
import PlaceholderPage from './components/PlaceholderPage';
import ScriptToVideo from './pages/ScriptToVideo';
import IdeaToAudio from "./pages/IdeaToAudio";
import ScriptToAudio from "./pages/ScriptToAudio";
import VideoEditor from "./pages/VideoEditor";
import AudioEditor from "./pages/AudioEditor";
import AIModelTesting from './pages/AIModelTesting';

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/files" element={<Navigate to="/files/video" replace />} />
            <Route path="/files/video" element={<Files />} />
            <Route path="/files/audio" element={<Files />} />
            <Route path="/ai-model-testing" element={<AIModelTesting />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/video/from-idea" element={<IdeaToVideo />} />
            <Route path="/video/from-script" element={<ScriptToVideo />} />
            <Route path="/video/:id" element={<VideoEditor />} />
            <Route path="/audio/:id" element={<AudioEditor />} />
            
            {/* Help routes */}
            <Route path="/help/getting-started" element={<GettingStarted />} />
            <Route path="/help/faqs" element={<FAQs />} />
            <Route path="/help/contact" element={<Contact />} />
            
            {/* Video routes */}
            <Route path="video">
              <Route path="from-blog" element={<PlaceholderPage title="Blog to Video" />} />
              <Route path="from-presentation" element={<PlaceholderPage title="Presentation to Video" />} />
              <Route path="from-product" element={<PlaceholderPage title="Product to Video" />} />
              <Route path="from-recording" element={<PlaceholderPage title="Recording to Video" />} />
              <Route path="blank" element={<PlaceholderPage title="Start from Scratch" />} />
            </Route>
            
            {/* Audio routes */}
            <Route path="audio">
              <Route path="from-idea" element={<IdeaToAudio />} />
              <Route path="from-script" element={<ScriptToAudio />} />
              <Route path="from-blog" element={<PlaceholderPage title="Blog to Audio" />} />
              <Route path="blank" element={<PlaceholderPage title="Start from Scratch" />} />
            </Route>
            
            {/* Design routes */}
            <Route path="design">
              <Route path="thumbnail" element={<PlaceholderPage title="Create Thumbnail" />} />
              <Route path="social" element={<PlaceholderPage title="Social Posts" />} />
              <Route path="presentation" element={<PlaceholderPage title="Presentations" />} />
              <Route path="blank" element={<PlaceholderPage title="Start from Scratch" />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}

export default App; 
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Models from './pages/Models';
import ModelDetail from './pages/ModelDetail';
import Datasets from './pages/Datasets';
import DatasetDetail from './pages/DatasetDetail';
import Flows from './pages/Flows';
import FlowDetail from './pages/FlowDetail';
import Agents from './pages/Agents';
import AgentDetail from './pages/AgentDetail';
import Leaderboards from './pages/Leaderboards';
import LeaderboardDetail from './pages/LeaderboardDetail';
import APIs from './pages/APIs';
import MCPs from './pages/MCPs';
import { AuthProvider } from './contexts/AuthContext';
import './App.css';

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="models" element={<Models />} />
                <Route path="models/:id" element={<ModelDetail />} />
                <Route path="datasets" element={<Datasets />} />
                <Route path="datasets/:id" element={<DatasetDetail />} />
                <Route path="flows" element={<Flows />} />
                <Route path="flows/:id" element={<FlowDetail />} />
                <Route path="agents" element={<Agents />} />
                <Route path="agents/:id" element={<AgentDetail />} />
                <Route path="leaderboards" element={<Leaderboards />} />
                <Route path="leaderboards/:id" element={<LeaderboardDetail />} />
                <Route path="apis" element={<APIs />} />
                <Route path="mcps" element={<MCPs />} />
              </Route>
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;

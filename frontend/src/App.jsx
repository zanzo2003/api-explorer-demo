import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import ExplorerPage from "./pages/ExplorerPage";
import ApiDetailPage from "./pages/ApiDetailPage";
import UploadPage from "./pages/UploadPage";
import "./styles/global.css";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<ExplorerPage />} />
          <Route path="apis/:id" element={<ApiDetailPage />} />
          <Route path="upload" element={<UploadPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

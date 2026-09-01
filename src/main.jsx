// import { StrictMode } from 'react'
// import { createRoot } from 'react-dom/client'
// import './index.css'
// import App from './App.jsx'

// createRoot(document.getElementById('root')).render(
//   <StrictMode>
//     <App />
//   </StrictMode>,
// )

import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster as SonnerToaster } from "sonner";
import { Toaster as HotToastToaster } from "react-hot-toast";
import { router } from "./router";
import { queryClient } from "./lib/queryClient";
import "./i18n";
import { startDomTranslator } from "./i18nDomTranslator";
import "./styles/globals.css";

startDomTranslator();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <SonnerToaster position="top-center" richColors />
      <HotToastToaster position="top-right" />
    </QueryClientProvider>
  </React.StrictMode>,
);

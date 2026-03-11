import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { getCurrentWindow } from '@tauri-apps/api/window'; // <-- 1. Import this
import './index.css';

import { routeTree } from './routeTree.gen';

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

// <-- 2. Add this block to show the window after render
// We use a small timeout to ensure the DOM is painted
setTimeout(() => {
  getCurrentWindow().show();
}, 100);
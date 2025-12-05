import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from '@/App';
import '@/index.css';
import '@/i18n';
import { Loader2 } from 'lucide-react';

const FullPageLoader = () => (
  <div className="fixed inset-0 bg-gray-950 flex items-center justify-center z-[101]">
    <Loader2 className="w-16 h-16 animate-spin text-yellow-500" />
  </div>
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Suspense fallback={<FullPageLoader />}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Suspense>
  </React.StrictMode>
);
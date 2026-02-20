import { useState, useEffect } from 'react';
import './index.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [isEnabled, setIsEnabled] = useState<boolean>(true);

  useEffect(() => {
    checkLoginStatus();
    // Load initial toggle state
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(['lexifyEnabled'], (result) => {
        if (result.lexifyEnabled !== undefined && result.lexifyEnabled !== null) {
          setIsEnabled(!!result.lexifyEnabled);
        } else {
          // Default to true if not set
          chrome.storage.local.set({ lexifyEnabled: true });
        }
      });
    }
  }, []);

  const checkLoginStatus = () => {
    if (typeof chrome !== 'undefined' && chrome.identity) {
      chrome.identity.getAuthToken({ interactive: false }, function(token) {
        if (!chrome.runtime.lastError && token) {
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      });
    } else {
      setIsLoggedIn(false);
    }
  };

  const handleLogin = () => {
    chrome.runtime.sendMessage({ type: 'INITIATE_LOGIN' }, (response) => {
      if (response && response.status === 'success') {
        setIsLoggedIn(true);
      } else {
        alert("Login failed or was canceled. Please try again.");
      }
    });
  };

  const handleLogout = () => {
    chrome.runtime.sendMessage({ type: 'FORCE_LOGOUT' }, (response) => {
      if (response && response.status === 'success') {
        setIsLoggedIn(false);
      }
    });
  };

  const toggleExtensions = () => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ lexifyEnabled: newState });
    }
  };

  return (
    <div className="w-[320px] bg-slate-50 flex flex-col items-center justify-start p-6 text-slate-800 font-sans min-h-[440px]">
      
      {/* Header Section */}
      <div className="w-full flex items-center justify-between mb-8">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-cyan-400 shadow-md flex items-center justify-center">
              <span className="text-white text-xl font-bold">L</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">Lexify</h1>
         </div>
      </div>

      {/* Main Toggle Section */}
      <div className="w-full bg-white rounded-2xl p-5 shadow-sm border border-slate-200 mb-6 flex items-center justify-between">
         <div className="flex flex-col">
            <span className="font-semibold text-[15px] text-slate-800">Enable Lexify</span>
            <span className="text-[12px] text-slate-500 leading-tight mt-0.5">Toggle subtitle hovers</span>
         </div>
         <button 
            onClick={toggleExtensions}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none ${isEnabled ? 'bg-blue-500' : 'bg-slate-300'}`}
         >
            <span 
               className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-300 ease-in-out ${isEnabled ? 'translate-x-6' : 'translate-x-1'}`}
            />
         </button>
      </div>
      
      {/* Auth Section */}
      <div className="w-full h-[1px] bg-slate-200 mb-6"></div>

      <div className="w-full flex-grow flex flex-col justify-end">
        {isLoggedIn === null ? (
          <div className="flex justify-center py-4">
             <p className="text-slate-400 text-sm animate-pulse font-medium">Checking status...</p>
          </div>
        ) : isLoggedIn ? (
          <div className="flex flex-col items-center w-full bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="bg-green-50 text-green-700 px-3 py-1.5 rounded-full font-medium text-[13px] flex items-center gap-2 mb-3 border border-green-100/50 w-full justify-center">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              Cloud Sync Active
            </div>
            <p className="text-center text-slate-500 mb-5 text-[13px] leading-relaxed">
              Your words are actively syncing to your dashboard.
            </p>
            <button 
              onClick={handleLogout}
              className="w-full py-2.5 bg-slate-50 text-slate-600 font-semibold rounded-xl border border-slate-200 hover:bg-slate-100 hover:text-slate-800 transition-colors text-sm"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center w-full bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-3">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            </div>
            <p className="text-center text-slate-600 mb-5 text-[13px] leading-relaxed">
              Sign in to save and review your vocabulary on the web dashboard.
            </p>
            <button 
              onClick={handleLogin}
              className="w-full py-2.5 px-4 bg-slate-800 text-white font-semibold rounded-xl hover:bg-slate-700 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google logo" className="w-4 h-4" />
              Sign in with Google
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

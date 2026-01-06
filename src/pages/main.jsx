import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Header from './components/Header.jsx'   // Import Header
import Footer from './components/Footer.jsx'   // Import Footer

createRoot(document.getElementById('root')).render(
  <>
    <Header />
    <main className='wrapper'>
      <App />
    </main>
    <Footer />
  </>
)

// Where the backend lives. Uses the local API when the page is opened on localhost.
// After deploying the backend, put its Render URL below.
window.API_URL = ['localhost', '127.0.0.1'].includes(location.hostname)
  ? 'http://localhost:3000'
  : 'https://YOUR-BACKEND.onrender.com';

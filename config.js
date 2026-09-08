// ==== CONNECT TO YOUR GOOGLE APPS SCRIPT BACKEND ====
// This is the /exec URL you got after deploying Code.gs as a Web App.
const API_URL = 'https://script.google.com/macros/s/AKfycbylpc97llZvNRROjSIxGwcOCsSkB-MDghRAMFSnPSIFiL_fuCDvdPKd_bF3MuWMNLFx/exec';

// Calls the backend with an action name + data.
// Uses text/plain content-type on purpose — this avoids a CORS preflight
// request, which Apps Script web apps don't handle well.
async function api(action, data = {}) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, ...data })
  });
  return res.json();
}

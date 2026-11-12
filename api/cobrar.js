// Servidor que realiza el cobro en Culqi (Vercel / Netlify-compatible: Node 18+)
// La llave PRIVADA va en la variable de entorno CULQI_SECRET_KEY. Nunca en la página.
const PLANES = {
  inicio:      { nombre: 'Inicio',      monto: 4900 },   // céntimos: S/ 49.00
  profesional: { nombre: 'Profesional', monto: 9900 },   // S/ 99.00
  agencia:     { nombre: 'Agencia',     monto: 19900 }   // S/ 199.00
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  const { token, plan, email } = req.body || {};
  const p = PLANES[plan];                                // el monto sale del servidor, no del navegador
  if (!p || !token || !email) return res.status(400).json({ error: 'Datos incompletos' });
  try {
    const r = await fetch('https://api.culqi.com/v2/charges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + process.env.CULQI_SECRET_KEY },
      body: JSON.stringify({
        amount: p.monto,
        currency_code: 'PEN',
        email,
        source_id: token,
        description: 'Visita360 · Plan ' + p.nombre + ' (mensual)'
      })
    });
    const d = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: d.user_message || d.merchant_message || 'No se pudo procesar el pago' });
    return res.status(200).json({ ok: true, id: d.id });
  } catch (e) {
    return res.status(500).json({ error: 'Error de conexión con Culqi' });
  }
};

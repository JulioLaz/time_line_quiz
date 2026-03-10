// ════════════════════════════════════════════════════════════════
// CHRONOS QUIZ — Google Apps Script
// Recibe resultados del quiz y los envía a Telegram del profesor
// También los guarda en Google Sheets automáticamente
//
// INSTRUCCIONES:
// 1. Ir a https://script.google.com
// 2. Crear nuevo proyecto → pegar este código
// 3. Reemplazar TELEGRAM_TOKEN y CHAT_ID con tus valores
// 4. Ir a Implementar → Nueva implementación → Aplicación web
//    - Ejecutar como: Yo
//    - Quién tiene acceso: Cualquiera
// 5. Copiar la URL generada y pegarla en quiz_final.html
//    donde dice: const GAS_URL = 'REEMPLAZAR_CON_TU_URL_GAS'
// ════════════════════════════════════════════════════════════════

const TELEGRAM_TOKEN = '7850177780:AAG1rFjSYBch1hULRy2tE15xOQ9ApO87A3w';
const CHAT_ID        = '8107106288';

// Nombre de la hoja de cálculo donde se guardarán los registros
const SHEET_NAME = 'Resultados Quiz';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    // ── Enviar mensaje a Telegram ──
    enviarTelegram(data);
    
    // ── Guardar en Google Sheets ──
    guardarEnSheet(data);
    
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch(err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function enviarTelegram(d) {
  const aprobadoEmoji = d.aprobado ? '✅' : '❌';
  const aprobadoTexto = d.aprobado ? 'APROBADO' : 'NO APROBADO';
  
  const msg = 
`📊 *RESULTADO CHRONOS QUIZ*

👤 *Alumno:* ${d.nombre}
🏫 *Curso:* ${d.curso}
🎮 *Nivel:* ${d.nivel}

⚡ *Score:* ${d.score.toLocaleString()} pts
📈 *% Correctas:* ${d.pct_correctas}%
${aprobadoEmoji} *Aprobación:* ${d.pct_aprobacion}% → *${aprobadoTexto}*

📋 *Detalle:*
  ✅ Correctas: ${d.correctas}
  ❌ Incorrectas: ${d.incorrectas}
  ⏱ T. agotado: ${d.tiempo_agotado}
  🔥 Racha máx: ${d.racha_max}

🕐 ${d.fecha}`;

  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({
      chat_id:    CHAT_ID,
      text:       msg,
      parse_mode: 'Markdown'
    })
  });
}

function guardarEnSheet(d) {
  const ss  = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  // Crear hoja si no existe
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // Encabezados
    sheet.appendRow([
      'Fecha', 'Nombre', 'Curso', 'Nivel',
      'Score', '% Correctas', '% Aprobación', 'Aprobado',
      'Correctas', 'Incorrectas', 'T.Agotado', 'Racha Máx'
    ]);
    sheet.getRange(1, 1, 1, 12).setFontWeight('bold');
  }
  
  sheet.appendRow([
    d.fecha, d.nombre, d.curso, d.nivel,
    d.score, d.pct_correctas, d.pct_aprobacion,
    d.aprobado ? 'SÍ' : 'NO',
    d.correctas, d.incorrectas, d.tiempo_agotado, d.racha_max
  ]);
}

// Función de prueba — ejecutala manualmente para verificar que funciona
function testEnvio() {
  const datosPrueba = {
    nombre: 'Juan Pérez',
    curso: '6° B',
    nivel: 'FILÓSOFO',
    score: 1840,
    pct_correctas: 78,
    pct_aprobacion: 82,
    aprobado: true,
    correctas: 35,
    incorrectas: 7,
    tiempo_agotado: 3,
    racha_max: 5,
    fecha: new Date().toLocaleString('es-AR')
  };
  enviarTelegram(datosPrueba);
  Logger.log('Test enviado a Telegram ✓');
}

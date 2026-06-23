// 下載 PDF 共用工具
// 優先用 html2pdf 一鍵下載；若失敗（例如函式庫載入失敗、內容渲染問題），
// 自動改用瀏覽器原生列印（可在列印視窗選「另存為 PDF」），確保一定拿得到檔案。
export async function downloadPdf(element, filename) {
  if (!element) {
    window.print()
    return
  }
  try {
    const html2pdf = (await import('html2pdf.js')).default
    await html2pdf().set({
      margin: [15, 15, 15, 15],
      filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, allowTaint: false, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
    }).from(element).save()
  } catch (e) {
    console.error('html2pdf 下載失敗，改用瀏覽器列印:', e)
    alert('一鍵下載失敗，將改用瀏覽器列印。\n請在跳出的視窗把「目的地」選成「另存為 PDF」再按儲存即可。')
    window.print()
  }
}

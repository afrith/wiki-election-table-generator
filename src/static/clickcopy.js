const tooltip = new bootstrap.Tooltip(document.getElementById('copybutton'))

function copyTable () {
  const tableText = document.getElementById('wikitable').innerText
  navigator.clipboard.writeText(tableText)
  tooltip.show()
  setTimeout(function () { tooltip.hide() }, 1000)
}

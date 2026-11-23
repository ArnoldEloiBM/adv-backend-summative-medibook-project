const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

function renderLanguageLinks(language, languages, label) {
  const links = languages
    .map(({ code, name }) =>
      code === language
        ? `<strong>${escapeHtml(name)}</strong>`
        : `<a href="/feedback?lang=${code}" lang="${code}">${escapeHtml(name)}</a>`)
    .join(' · ');
  return `<nav aria-label="${escapeHtml(label)}">${escapeHtml(label)}: ${links}</nav>`;
}

function renderQuestions(strings) {
  return strings.questions
    .map((question, index) => {
      const id = `q${index + 1}`;
      return `
      <div class="question">
        <label for="${id}">${index + 1}. ${escapeHtml(question)}</label>
        <textarea id="${id}" name="${id}" rows="4" placeholder="${escapeHtml(strings.answerPlaceholder)}" required></textarea>
      </div>`;
    })
    .join('');
}

function renderPage({ language, strings, today, languages, submitted }) {
  const body = submitted
    ? `<p class="notice">${escapeHtml(strings.thankYou)}</p>
       <p><a href="/feedback?lang=${language}">${escapeHtml(strings.backToForm)}</a></p>`
    : `<p>${escapeHtml(strings.instructions)}</p>
       <form method="post" action="/feedback?lang=${language}">
         ${renderQuestions(strings)}
         <button type="submit">${escapeHtml(strings.submit)}</button>
       </form>`;

  return `<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(strings.title)}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 720px; margin: 2rem auto; padding: 0 1rem; line-height: 1.5; }
    .question { margin-bottom: 1.25rem; }
    label { display: block; font-weight: 600; margin-bottom: 0.4rem; }
    textarea { width: 100%; box-sizing: border-box; padding: 0.5rem; font: inherit; }
    button { padding: 0.6rem 1.2rem; font: inherit; cursor: pointer; }
    .meta { color: #555; }
    .notice { padding: 0.75rem 1rem; background: #e8f5e9; border-radius: 6px; }
  </style>
</head>
<body>
  ${renderLanguageLinks(language, languages, strings.languageLabel)}
  <h1>${escapeHtml(strings.title)}</h1>
  <p class="meta">${escapeHtml(strings.dateLabel)}: <time>${escapeHtml(today)}</time></p>
  ${body}
</body>
</html>`;
}

module.exports = { renderPage, escapeHtml };

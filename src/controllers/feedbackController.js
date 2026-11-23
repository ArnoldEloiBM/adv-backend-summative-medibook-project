const { resolveLanguage, getStrings, formatToday, availableLanguages } = require('../utils/i18n');
const { renderPage } = require('../views/feedback');

function render(req, res, submitted) {
  const language = resolveLanguage(req.query.lang);
  const html = renderPage({
    language,
    strings: getStrings(language),
    today: formatToday(language),
    languages: availableLanguages(),
    submitted,
  });
  res.type('html').send(html);
}

function showFeedbackForm(req, res) {
  render(req, res, false);
}

function submitFeedback(req, res) {
  render(req, res, true);
}

module.exports = { showFeedbackForm, submitFeedback };

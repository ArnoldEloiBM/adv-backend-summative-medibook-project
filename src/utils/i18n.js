const LOCALES = Object.freeze({
  en: require('../../locales/en.json'),
  fr: require('../../locales/fr.json'),
});
const DEFAULT_LANGUAGE = 'en';

function resolveLanguage(requested) {
  if (typeof requested !== 'string') return DEFAULT_LANGUAGE;
  const language = requested.trim().toLowerCase();
  return Object.hasOwn(LOCALES, language) ? language : DEFAULT_LANGUAGE;
}

function getStrings(language) {
  return LOCALES[resolveLanguage(language)];
}

function formatToday(language, today = new Date()) {
  const { intlLocale } = getStrings(language);
  return new Intl.DateTimeFormat(intlLocale, { dateStyle: 'full' }).format(today);
}

function availableLanguages() {
  return Object.entries(LOCALES).map(([code, strings]) => ({ code, name: strings.languageName }));
}

module.exports = { resolveLanguage, getStrings, formatToday, availableLanguages };

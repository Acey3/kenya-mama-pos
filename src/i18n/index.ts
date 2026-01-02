import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import sw from './locales/sw.json';
import ki from './locales/ki.json';
import luo from './locales/luo.json';
import kam from './locales/kam.json';
import kln from './locales/kln.json';

export const languages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili' },
  { code: 'ki', name: 'Kikuyu', nativeName: 'Gĩkũyũ' },
  { code: 'luo', name: 'Luo', nativeName: 'Dholuo' },
  { code: 'kam', name: 'Kamba', nativeName: 'Kĩkamba' },
  { code: 'kln', name: 'Kalenjin', nativeName: 'Kalenjin' },
];

const savedLanguage = localStorage.getItem('mama-duka-language') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      sw: { translation: sw },
      ki: { translation: ki },
      luo: { translation: luo },
      kam: { translation: kam },
      kln: { translation: kln },
    },
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export const changeLanguage = (langCode: string) => {
  localStorage.setItem('mama-duka-language', langCode);
  i18n.changeLanguage(langCode);
};

export default i18n;

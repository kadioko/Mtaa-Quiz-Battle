import { Category } from '../types';
import { CategoryColors } from '../theme/colors';
import { questions } from './questions';

export const categories: Category[] = [
  {
    id: 'bongo-fleva',
    name: 'Bongo Fleva',
    name_en: 'Bongo Fleva',
    emoji: '🎵',
    color: CategoryColors['Bongo Fleva'],
    description: 'Maswali kuhusu muziki wa Tanzania',
    description_en: 'Questions about Tanzanian music',
    questionCount: questions.filter((q) => q.category === 'Bongo Fleva').length,
  },
  {
    id: 'simba-yanga',
    name: 'Simba na Yanga',
    name_en: 'Simba & Yanga',
    emoji: '⚽',
    color: CategoryColors['Simba na Yanga'],
    description: 'Mpira wa miguu Tanzania',
    description_en: 'Tanzanian football',
    questionCount: questions.filter((q) => q.category === 'Simba na Yanga').length,
  },
  {
    id: 'mikoa',
    name: 'Mikoa ya Tanzania',
    name_en: 'Regions of Tanzania',
    emoji: '🗺️',
    color: CategoryColors['Mikoa ya Tanzania'],
    description: 'Jiografia ya Tanzania',
    description_en: 'Tanzania geography',
    questionCount: questions.filter((q) => q.category === 'Mikoa ya Tanzania').length,
  },
  {
    id: 'historia',
    name: 'Historia ya Tanzania',
    name_en: 'Tanzania History',
    emoji: '📜',
    color: CategoryColors['Historia ya Tanzania'],
    description: 'Historia na utamaduni',
    description_en: 'History and culture',
    questionCount: questions.filter((q) => q.category === 'Historia ya Tanzania').length,
  },
  {
    id: 'vyakula',
    name: 'Vyakula vya Bongo',
    name_en: 'Tanzanian Foods',
    emoji: '🍛',
    color: CategoryColors['Vyakula vya Bongo'],
    description: 'Chakula na mapishi ya Tanzania',
    description_en: 'Tanzanian food and cuisine',
    questionCount: questions.filter((q) => q.category === 'Vyakula vya Bongo').length,
  },
  {
    id: 'methali',
    name: 'Methali za Kiswahili',
    name_en: 'Swahili Proverbs',
    emoji: '💬',
    color: CategoryColors['Methali za Kiswahili'],
    description: 'Hekima ya Kiswahili',
    description_en: 'Swahili wisdom',
    questionCount: questions.filter((q) => q.category === 'Methali za Kiswahili').length,
  },
  {
    id: 'mitaa-dar',
    name: 'Mitaa ya Dar',
    name_en: 'Streets of Dar',
    emoji: '🏙️',
    color: CategoryColors['Mitaa ya Dar'],
    description: 'Miji na mitaa ya Dar es Salaam',
    description_en: 'Dar es Salaam neighborhoods',
    questionCount: questions.filter((q) => q.category === 'Mitaa ya Dar').length,
  },
  {
    id: 'wanyama',
    name: 'Wanyama na Hifadhi',
    name_en: 'Wildlife & Parks',
    emoji: '🦁',
    color: CategoryColors['Wanyama na Hifadhi'],
    description: 'Wanyama na hifadhi za Tanzania',
    description_en: 'Tanzania wildlife and parks',
    questionCount: questions.filter((q) => q.category === 'Wanyama na Hifadhi').length,
  },
  {
    id: 'biashara',
    name: 'Biashara na Hustle',
    name_en: 'Business & Hustle',
    emoji: '💰',
    color: CategoryColors['Biashara na Hustle'],
    description: 'Uchumi na biashara Tanzania',
    description_en: 'Tanzania economy and business',
    questionCount: questions.filter((q) => q.category === 'Biashara na Hustle').length,
  },
  {
    id: 'general',
    name: 'General Knowledge TZ',
    name_en: 'General Knowledge TZ',
    emoji: '🇹🇿',
    color: CategoryColors['General Knowledge TZ'],
    description: 'Ujuzi wa jumla wa Tanzania',
    description_en: 'General Tanzania knowledge',
    questionCount: questions.filter((q) => q.category === 'General Knowledge TZ').length,
  },
];

export const getCategoryById = (id: string): Category | undefined =>
  categories.find((c) => c.id === id);

export const getCategoryByName = (name: string): Category | undefined =>
  categories.find((c) => c.name === name || c.name_en === name);

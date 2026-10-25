import { POPULAR_QUERIES } from '@/lib/popular-queries';
import { getSearchResults } from '@/lib/smart-search';

const REGRESSION = [
  'диван', 'переезд', 'окна', 'iphone', 'пылесос', 'холодильник',
  'стиральная машина', 'газель', 'мебель', 'офисный переезд',
  'ремонт робота', 'кондиционер', 'ковёр', 'розетка',
];

function show(label: string, query: string) {
  const res = getSearchResults(query).slice(0, 4);
  console.log(`\n▶ ${label}  [${query}]`);
  if (res.length === 0) console.log('   !!! ПУСТО');
  for (const r of res) {
    console.log(`   ${Math.round(r.confidence * 100)}%  ${r.domain.brand} / ${r.category} / ${r.service}`);
  }
}

console.log('===== ЧИПЫ КАРУСЕЛИ =====');
for (const chip of POPULAR_QUERIES) show(chip.text, chip.query);

console.log('\n\n===== РЕГРЕССИЯ =====');
for (const q of REGRESSION) show(q, q);

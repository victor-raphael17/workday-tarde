const fs = require('fs');
const { PurgeCSS } = require('purgecss');

(async () => {
  const result = await new PurgeCSS().purge({
    content: ['./frontend/**/*.html', './frontend/**/*.js'],
    css: ['./frontend/assets/css/app.css'],
  });

  const original = fs.readFileSync('./frontend/assets/css/app.css', 'utf8');

  console.warn('Original:', original.length);
  console.warn('Purgado :', result[0].css.length);
})();

import {escapeHtml, escapeHtmlAttr} from './sanitize.js';

console.assert(escapeHtml('<img>') === '&lt;img&gt;', 'escapeHtml erro ao escapar imagem ');

console.assert(escapeHtml('<script>alert(1)</script>') === '&lt;script&gt;alert(1)&lt;/script&gt;',
 'escapeHtml erro ao escapar script');

console.assert(escapeHtmlAttr('"onerror="alert(1)"') === '&quot;onerror=&quot;alert(1)&quot;',
 'erro ao escapar atributo HTML');

 console.log('Todos os testes passaram!');



console.log(escapeHtml('<img>'));
console.log(escapeHtml('<script>alert(1)</script>'));

console.log(
    escapeHtmlAttr('" onclick="alert(1)')
);
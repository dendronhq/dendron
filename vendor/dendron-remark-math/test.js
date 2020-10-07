const test = require('tape')
const unified = require('unified')
const parse = require('remark-parse')
const remark2rehype = require('remark-rehype')
const rehypeStringify = require('rehype-stringify')
const stringify = require('remark-stringify')
const u = require('unist-builder')
const math = require('.')

test('remark-math', function (t) {
  const toHtml = unified()
    .use(parse)
    .use(math, {inlineMathDouble: true})
    .use(remark2rehype)
    .use(rehypeStringify)

  t.deepEqual(
    unified()
      .use(parse, {position: false})
      .use(math)
      .parse('Math $\\alpha$\n\n$$\n\\beta+\\gamma\n$$'),
    u('root', [
      u('paragraph', [
        u('text', 'Math '),
        u(
          'inlineMath',
          {
            data: {
              hName: 'span',
              hProperties: {className: ['math', 'math-inline']},
              hChildren: [u('text', '\\alpha')]
            }
          },
          '\\alpha'
        )
      ]),
      u(
        'math',
        {
          data: {
            hName: 'div',
            hProperties: {className: ['math', 'math-display']},
            hChildren: [u('text', '\\beta+\\gamma')]
          }
        },
        '\\beta+\\gamma'
      )
    ]),
    'should parse inline and block math'
  )

  t.deepEqual(
    unified().use(parse, {position: false}).use(math).parse('\\$\\alpha$'),
    u('root', [u('paragraph', [u('text', '$'), u('text', '\\alpha$')])]),
    'should ignore an escaped opening dollar sign'
  )

  t.deepEqual(
    unified().use(parse, {position: false}).use(math).parse('$\\alpha\\$'),
    u('root', [u('paragraph', [u('text', '$\\alpha'), u('text', '$')])]),
    'should ignore an escaped closing dollar sign'
  )

  t.deepEqual(
    unified().use(parse, {position: false}).use(math).parse('\\$\\alpha$'),
    u('root', [u('paragraph', [u('text', '$'), u('text', '\\alpha$')])]),
    'should ignore an escaped opening dollar sign'
  )
  t.deepEqual(
    unified().use(parse, {position: false}).use(math).parse('$\\alpha\\$'),
    u('root', [u('paragraph', [u('text', '$\\alpha'), u('text', '$')])]),
    'should ignore an escaped closing dollar sign'
  )

  t.deepEqual(
    unified().use(parse, {position: false}).use(math).parse('\\\\$\\alpha$'),
    u('root', [
      u('paragraph', [
        u('text', '\\'),
        u(
          'inlineMath',
          {
            data: {
              hName: 'span',
              hProperties: {className: ['math', 'math-inline']},
              hChildren: [u('text', '\\alpha')]
            }
          },
          '\\alpha'
        )
      ])
    ]),
    'should support a escaped escape before a dollar sign'
  )

  t.deepEqual(
    unified().use(parse, {position: false}).use(math).parse('`$`\\alpha$'),
    u('root', [u('paragraph', [u('inlineCode', '$'), u('text', '\\alpha$')])]),
    'should ignore dollar signs in inline code (#1)'
  )

  t.deepEqual(
    unified().use(parse, {position: false}).use(math).parse('$\\alpha`$`'),
    u('root', [
      u('paragraph', [
        u(
          'inlineMath',
          {
            data: {
              hName: 'span',
              hProperties: {className: ['math', 'math-inline']},
              hChildren: [u('text', '\\alpha`')]
            }
          },
          '\\alpha`'
        ),
        u('text', '`')
      ])
    ]),
    'should allow backticks in math'
  )

  t.deepEqual(
    unified().use(parse, {position: false}).use(math).parse('$`\\alpha`$'),
    u('root', [
      u('paragraph', [
        u(
          'inlineMath',
          {
            data: {
              hName: 'span',
              hProperties: {className: ['math', 'math-inline']},
              hChildren: [u('text', '`\\alpha`')]
            }
          },
          '`\\alpha`'
        )
      ])
    ]),
    'should support backticks in inline math'
  )

  t.deepEqual(
    unified().use(parse, {position: false}).use(math).parse('$\\alpha\\$$'),
    u('root', [
      u('paragraph', [
        u(
          'inlineMath',
          {
            data: {
              hName: 'span',
              hProperties: {className: ['math', 'math-inline']},
              hChildren: [u('text', '\\alpha\\$')]
            }
          },
          '\\alpha\\$'
        )
      ])
    ]),
    'should support a super factorial in inline math'
  )

  t.deepEqual(
    unified()
      .use(parse, {position: false})
      .use(math)
      .parse('$$\n\\alpha\\$\n$$'),
    u('root', [
      u(
        'math',
        {
          data: {
            hName: 'div',
            hProperties: {className: ['math', 'math-display']},
            hChildren: [u('text', '\\alpha\\$')]
          }
        },
        '\\alpha\\$'
      )
    ]),
    'should support a super factorial in block math'
  )

  t.deepEqual(
    unified()
      .use(parse, {position: false})
      .use(math)
      .parse('tango\n$$\n\\alpha\n$$'),
    u('root', [
      u('paragraph', [u('text', 'tango')]),
      u(
        'math',
        {
          data: {
            hName: 'div',
            hProperties: {className: ['math', 'math-display']},
            hChildren: [u('text', '\\alpha')]
          }
        },
        '\\alpha'
      )
    ]),
    'should support a math block right after a paragraph'
  )

  t.deepEqual(
    unified().use(parse, {position: false}).use(math).parse('$$\\alpha$$'),
    u('root', [
      u('paragraph', [
        u(
          'inlineMath',
          {
            data: {
              hName: 'span',
              hProperties: {className: ['math', 'math-inline']},
              hChildren: [u('text', '\\alpha')]
            }
          },
          '\\alpha'
        )
      ])
    ]),
    'should support inline math with double dollars'
  )

  t.deepEqual(
    unified()
      .use(parse, {position: false})
      .use(math)
      .parse('$$$\n\\alpha\n$$$'),
    u('root', [
      u(
        'math',
        {
          data: {
            hName: 'div',
            hProperties: {className: ['math', 'math-display']},
            hChildren: [u('text', '\\alpha')]
          }
        },
        '\\alpha'
      )
    ]),
    'should support block math with triple dollars'
  )

  t.deepEqual(
    unified()
      .use(parse, {position: false})
      .use(math)
      .parse('  $$\n    \\alpha\n  $$'),
    u('root', [
      u(
        'math',
        {
          data: {
            hName: 'div',
            hProperties: {className: ['math', 'math-display']},
            hChildren: [u('text', '  \\alpha')]
          }
        },
        '  \\alpha'
      )
    ]),
    'should support indented block math'
  )

  t.deepEqual(
    unified()
      .use(parse, {position: false})
      .use(stringify)
      .use(math)
      .processSync('Math $\\alpha$\n\n$$\n\\beta+\\gamma\n$$\n')
      .toString(),
    'Math $\\alpha$\n\n$$\n\\beta+\\gamma\n$$\n',
    'should stringify inline and block math'
  )

  t.deepEqual(
    unified()
      .use(parse, {position: false})
      .use(stringify)
      .use(math)
      .processSync('> $$\n> \\alpha\\beta\n> $$\n')
      .toString(),
    '> $$\n> \\alpha\\beta\n> $$\n',
    'should stringify math in a blockquote'
  )

  t.deepEqual(
    String(toHtml.processSync('$$just two dollars')),
    '<p>$$just two dollars</p>',
    'should not support an opening fence without newline'
  )
  t.deepEqual(
    String(toHtml.processSync('$$  must\n\\alpha\n$$')),
    '<div class="math math-display">must\n\\alpha</div>',
    'should include values after the opening fence (except for spacing #1)'
  )
  t.deepEqual(
    String(toHtml.processSync('$$  \n\\alpha\n$$')),
    '<div class="math math-display">\\alpha</div>',
    'should include values after the opening fence (except for spacing #2)'
  )
  t.deepEqual(
    String(toHtml.processSync('$$\n\\alpha\nmust  $$')),
    '<div class="math math-display">\\alpha\nmust</div>',
    'should include values before the closing fence (except for spacing #1)'
  )
  t.deepEqual(
    String(toHtml.processSync('$$\n\\alpha\n  $$')),
    '<div class="math math-display">\\alpha</div>',
    'should include values before the closing fence (except for spacing #2)'
  )
  t.deepEqual(
    String(toHtml.processSync('$$\n\\alpha$$  ')),
    '<div class="math math-display">\\alpha</div>',
    'should exclude spacing after the closing fence'
  )

  t.deepEqual(
    unified()
      .use(parse, {position: false})
      .use(math)
      .parse('$$\n\\alpha\n$$\n```\nbravo\n```\n'),
    u('root', [
      u(
        'math',
        {
          data: {
            hName: 'div',
            hProperties: {className: ['math', 'math-display']},
            hChildren: [u('text', '\\alpha')]
          }
        },
        '\\alpha'
      ),
      u('code', {lang: null, meta: null}, 'bravo')
    ]),
    'should not affect the next block'
  )

  t.deepEqual(
    unified()
      .use(parse, {position: false})
      .use(math, {inlineMathDouble: true})
      .parse('$$\\alpha$$'),
    u('root', [
      u('paragraph', [
        u(
          'inlineMath',
          {
            data: {
              hName: 'span',
              hProperties: {className: ['math', 'math-inline', 'math-display']},
              hChildren: [u('text', '\\alpha')]
            }
          },
          '\\alpha'
        )
      ])
    ]),
    'should add a `math-display` class to inline math with double dollars if `inlineMathDouble: true`'
  )

  t.deepEqual(
    unified()
      .use(stringify)
      .use(math)
      .stringify(
        u('root', [
          u('paragraph', [u('text', 'Math '), u('inlineMath', '\\alpha')]),
          u('math', '\\beta+\\gamma')
        ])
      )
      .toString(),
    'Math $\\alpha$\n\n$$\n\\beta+\\gamma\n$$\n',
    'should stringify a tree'
  )

  t.deepEqual(
    unified()
      .use(parse, {position: false})
      .use(stringify)
      .use(math)
      .processSync('$$\\alpha$$')
      .toString(),
    '$\\alpha$\n',
    'should stringify inline math with double dollars using one dollar by default'
  )

  t.deepEqual(
    unified()
      .use(parse, {position: false})
      .use(stringify)
      .use(math, {inlineMathDouble: true})
      .processSync('$$\\alpha$$')
      .toString(),
    '$$\\alpha$$\n',
    'should stringify inline math with double dollars using one dollar if `inlineMathDouble: true`'
  )

  t.deepEqual(
    String(toHtml.processSync('$1+1 = 2$')),
    '<p><span class="math math-inline">1+1 = 2</span></p>',
    'markdown-it-katex#01'
  )
  t.deepEqual(
    String(toHtml.processSync('$$1+1 = 2$$')),
    '<p><span class="math math-inline math-display">1+1 = 2</span></p>',
    'markdown-it-katex#02'
  )
  t.deepEqual(
    String(toHtml.processSync('foo$1+1 = 2$bar')),
    '<p>foo<span class="math math-inline">1+1 = 2</span>bar</p>',
    'markdown-it-katex#03: no whitespace before and after is fine'
  )
  t.deepEqual(
    String(toHtml.processSync('foo$-1+1 = 2$bar')),
    '<p>foo<span class="math math-inline">-1+1 = 2</span>bar</p>',
    'markdown-it-katex#04: even when it starts with a negative sign'
  )
  t.deepEqual(
    String(toHtml.processSync('aaa $$ bbb')),
    '<p>aaa $$ bbb</p>',
    'markdown-it-katex#05: shouldn’t render empty content'
  )
  t.deepEqual(
    String(toHtml.processSync('aaa $5.99 bbb')),
    '<p>aaa $5.99 bbb</p>',
    'markdown-it-katex#06: should require a closing delimiter'
  )
  t.deepEqual(
    String(toHtml.processSync('foo $1+1\n\n= 2$ bar')),
    '<p>foo $1+1</p>\n<p>= 2$ bar</p>',
    'markdown-it-katex#07: paragraph break in inline math is not allowed'
  )
  t.deepEqual(
    String(toHtml.processSync('foo $1 *i* 1$ bar')),
    '<p>foo <span class="math math-inline">1 *i* 1</span> bar</p>',
    'markdown-it-katex#08: inline math with apparent markup should not be processed'
  )
  t.deepEqual(
    String(toHtml.processSync('   $$\n   1+1 = 2\n   $$')),
    '<div class="math math-display">1+1 = 2</div>',
    'markdown-it-katex#09: block math can be indented up to 3 spaces'
  )
  t.deepEqual(
    String(toHtml.processSync('    $$\n    1+1 = 2\n    $$')),
    '<pre><code>$$\n1+1 = 2\n$$\n</code></pre>',
    'markdown-it-katex#10: …but 4 means a code block'
  )
  t.deepEqual(
    String(toHtml.processSync('foo $1 + 1\n= 2$ bar')),
    '<p>foo <span class="math math-inline">1 + 1\n= 2</span> bar</p>',
    'markdown-it-katex#11: multiline inline math'
  )
  t.deepEqual(
    String(toHtml.processSync('$$\n\n  1\n+ 1\n\n= 2\n\n$$')),
    '<div class="math math-display">\n  1\n+ 1\n\n= 2\n\n</div>',
    'markdown-it-katex#12: multiline display math'
  )
  t.deepEqual(
    String(toHtml.processSync('$n$-th order')),
    '<p><span class="math math-inline">n</span>-th order</p>',
    'markdown-it-katex#13: text can immediately follow inline math'
  )
  t.deepEqual(
    String(toHtml.processSync('$$\n1+1 = 2')),
    '<div class="math math-display">1+1 = 2</div>',
    'markdown-it-katex#14: display math self-closes at the end of document'
  )
  t.deepEqual(
    String(toHtml.processSync('* $1+1 = 2$\n* $$\n  1+1 = 2\n  $$')),
    '<ul>\n<li><span class="math math-inline">1+1 = 2</span></li>\n<li><div class="math math-display">1+1 = 2</div></li>\n</ul>',
    'markdown-it-katex#15: display and inline math can appear in lists'
  )
  t.deepEqual(
    String(toHtml.processSync('$$1+1 = 2$$')),
    '<p><span class="math math-inline math-display">1+1 = 2</span></p>',
    'markdown-it-katex#16: display math can be written in one line'
  )
  // To do: this is broken.
  t.deepEqual(
    String(toHtml.processSync('$$[\n[1, 2]\n[3, 4]\n]$$')),
    '<div class="math math-display">[\n[1, 2]\n[3, 4]\n]</div>',
    'markdown-it-katex#17: …or on multiple lines with expression starting and ending on delimited lines'
  )
  t.deepEqual(
    String(toHtml.processSync('Foo \\$1$ bar\n\\$\\$\n1\n\\$\\$')),
    '<p>Foo $1$ bar\n$$\n1\n$$</p>',
    'markdown-it-katex#18: escaped delimiters should not render math'
  )
  t.deepEqual(
    String(
      toHtml.processSync('Thus, $20,000 and USD$30,000 won’t parse as math.')
    ),
    '<p>Thus, $20,000 and USD$30,000 won’t parse as math.</p>',
    'markdown-it-katex#19: numbers can not follow closing inline math'
  )
  t.deepEqual(
    String(toHtml.processSync('It is 2$ for a can of soda, not 1$.')),
    '<p>It is 2$ for a can of soda, not 1$.</p>',
    'markdown-it-katex#20: require non whitespace to right of opening inline math'
  )
  t.deepEqual(
    String(
      toHtml.processSync('I’ll give $20 today, if you give me more $ tomorrow.')
    ),
    '<p>I’ll give $20 today, if you give me more $ tomorrow.</p>',
    'markdown-it-katex#21: require non whitespace to left of closing inline math'
  )
  // #22 “inline blockmath is not (currently) registered” <-- we do support it!
  t.deepEqual(
    String(toHtml.processSync('Money adds: $\\$X + \\$Y = \\$Z$.')),
    '<p>Money adds: <span class="math math-inline">\\$X + \\$Y = \\$Z</span>.</p>',
    'markdown-it-katex#23: escaped delimiters in math mode'
  )
  t.deepEqual(
    String(
      toHtml.processSync(
        'Weird-o: $\\displaystyle{\\begin{pmatrix} \\$ & 1\\\\\\$ \\end{pmatrix}}$.'
      )
    ),
    '<p>Weird-o: <span class="math math-inline">\\displaystyle{\\begin{pmatrix} \\$ &#x26; 1\\\\\\$ \\end{pmatrix}}</span>.</p>',
    'markdown-it-katex#24: multiple escaped delimiters in math module'
  )

  t.end()
})

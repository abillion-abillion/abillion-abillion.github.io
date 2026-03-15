import re
import os

def fix_all(content):
    # Fix remaining rgba old text colors
    content = content.replace('color: rgba(240,235,225,0.97)', 'color: var(--text-primary)')
    content = content.replace('color: rgba(240,235,225,0.92)', 'color: var(--text-primary)')
    content = content.replace('color: rgba(240,235,225,0.80)', 'color: var(--text-secondary)')
    content = content.replace('color: rgba(240,235,225,0.88)', 'color: var(--text-primary)')

    # Fix old variable references still in style blocks
    content = content.replace('var(--dark)', 'var(--bg)')
    content = content.replace('var(--dark-2)', 'var(--bg-section)')
    content = content.replace('var(--dark-3)', 'var(--surface)')
    content = content.replace('var(--white)', 'var(--text-primary)')
    content = content.replace('var(--light)', 'var(--text-primary)')
    content = content.replace('var(--gold)', 'var(--primary)')
    content = content.replace('var(--gold-light)', 'var(--primary-light)')
    content = content.replace('var(--gold-pale)', 'var(--bg-section)')
    content = content.replace('var(--text))', 'var(--text-primary))')
    content = content.replace('var(--text);', 'var(--text-primary);')
    content = content.replace('var(--text),', 'var(--text-primary),')
    content = content.replace('var(--text) ', 'var(--text-primary) ')
    content = content.replace("var(--text)'", "var(--text-primary)'")
    content = content.replace('var(--mid)', 'var(--text-muted)')

    # Fix btn color after var replacement (dark was replaced with bg, but btn should have white text)
    # Buttons with green background should have white text
    # After var(--dark) -> var(--bg), btn color: var(--bg) should be #ffffff
    content = content.replace(
        'background: var(--primary);\n    color: var(--bg);',
        'background: var(--primary);\n    color: #ffffff;'
    )
    content = content.replace(
        'background: var(--primary);\n      color: var(--bg);',
        'background: var(--primary);\n      color: #ffffff;'
    )
    content = content.replace(
        'background: var(--primary); color: var(--bg);',
        'background: var(--primary); color: #ffffff;'
    )
    # Also fix multi-line variants in compact CSS
    content = content.replace(
        'background: var(--primary); color: var(--bg)\n',
        'background: var(--primary); color: #ffffff\n'
    )

    # Fix remaining border rgba -> var(--border)
    content = content.replace(
        'border: 1px solid rgba(92,122,62,0.1)',
        'border: 1px solid var(--border)'
    )
    content = content.replace(
        'border: 1px solid rgba(92,122,62,0.15)',
        'border: 1px solid var(--border)'
    )
    content = content.replace(
        'border: 1px solid rgba(92,122,62,0.2)',
        'border: 1px solid var(--border)'
    )
    content = content.replace(
        'border: 1px solid rgba(92,122,62,0.25)',
        'border: 1px solid var(--border)'
    )
    content = content.replace(
        'border: 1px solid rgba(92,122,62,0.3)',
        'border: 1px solid var(--border)'
    )
    content = content.replace(
        'border: 1px solid rgba(92,122,62,0.35)',
        'border: 1px solid var(--border)'
    )
    content = content.replace(
        'border: 1px solid rgba(92,122,62,0.4)',
        'border: 1px solid var(--border)'
    )
    content = content.replace(
        'border-bottom: 1px solid rgba(92,122,62,0.1)',
        'border-bottom: 1px solid var(--border)'
    )
    content = content.replace(
        'border-bottom: 1px solid rgba(92,122,62,0.15)',
        'border-bottom: 1px solid var(--border)'
    )
    content = content.replace(
        'border-top: 1px solid rgba(92,122,62,0.1)',
        'border-top: 1px solid var(--border)'
    )
    content = content.replace(
        'border-top: 1px solid rgba(92,122,62,0.15)',
        'border-top: 1px solid var(--border)'
    )
    content = content.replace(
        'border-left: 2px solid var(--primary)',
        'border-left: 2px solid var(--primary)'
    )
    content = content.replace(
        'border-left: 3px solid var(--primary)',
        'border-left: 3px solid var(--primary)'
    )
    # border for inputs
    content = content.replace(
        'border: 1px solid rgba(92,122,62,0.2)',
        'border: 1px solid var(--border)'
    )

    # Fix rgba backgrounds that were not covered
    content = content.replace(
        'background: rgba(250,248,244,0)',
        'background: rgba(250,248,244,0)'
    )

    # Fix body font-weight if still 300
    content = re.sub(
        r'(font-family:\s*\'Noto Sans KR\'[^;]*;[^}]*?)font-weight:\s*300;',
        r'\1font-weight: 500;',
        content
    )

    # Fix section-title font-family to add Noto Serif KR
    content = content.replace(
        "font-family: 'Cormorant Garamond', serif;\n    font-size: clamp(34px, 5vw, 54px);\n    font-weight: 300;\n    line-height: 1.15;\n    color: var(--text-primary);\n    margin-bottom: 60px;",
        "font-family: 'Noto Serif KR', 'Cormorant Garamond', serif;\n    font-size: clamp(34px, 5vw, 54px);\n    font-weight: 700;\n    line-height: 1.15;\n    color: var(--text-primary);\n    margin-bottom: 60px;"
    )

    # Fix about-text paragraph color
    content = content.replace(
        '    color: rgba(240,235,225,0.97);\n    margin-bottom: 24px;',
        '    color: var(--text-primary);\n    margin-bottom: 24px;'
    )

    # Fix service-desc color
    content = content.replace(
        '    color: rgba(240,235,225,0.80);\n    margin-bottom: 56px;',
        '    color: var(--text-secondary);\n    margin-bottom: 56px;'
    )

    # Fix quote-text color
    content = content.replace(
        '    color: rgba(240,235,225,0.92);\n    margin-bottom: 32px;',
        '    color: var(--text-primary);\n    margin-bottom: 32px;'
    )

    # Fix hero-desc color
    content = content.replace(
        '    color: rgba(240,235,225,0.97);\n    max-width: 440px;',
        '    color: var(--text-primary);\n    max-width: 440px;'
    )

    # Fix author-name and author-desc colors
    content = content.replace(
        "  .author-name { font-size: 13px; color: var(--text-primary); font-weight: 400; }",
        "  .author-name { font-size: 13px; color: var(--text-primary); font-weight: 500; }"
    )

    # Fix author-avatar color
    content = content.replace(
        '    color: var(--bg);',
        '    color: #ffffff;'
    )

    # Fix career-info h4 color
    content = content.replace(
        "    color: var(--text-primary);\n    margin-bottom: 6px;",
        "    color: var(--text-primary);\n    margin-bottom: 6px;"
    )

    # Fix cta-title
    content = content.replace(
        "  .cta-title {\n    font-family: 'Cormorant Garamond', serif;\n    font-size: clamp(36px, 6vw, 64px);\n    font-weight: 300;\n    color: var(--text-primary);",
        "  .cta-title {\n    font-family: 'Noto Serif KR', 'Cormorant Garamond', serif;\n    font-size: clamp(36px, 6vw, 64px);\n    font-weight: 700;\n    color: var(--text-primary);"
    )

    # Fix cta background -> use bg-section
    content = content.replace(
        '  .cta {\n    background: var(--surface);',
        '  .cta {\n    background: var(--bg-section);'
    )

    # Fix footer
    content = content.replace(
        '  footer {\n    background: var(--bg);',
        '  footer {\n    background: var(--bg-section);'
    )

    # Fix footer border
    content = content.replace(
        '    border-top: 1px solid rgba(92,122,62,0.1);',
        '    border-top: 1px solid var(--border);'
    )

    # Fix remaining nav toggle span color - should use text-primary for dark on light bg
    # They already use var(--text-primary) which is correct (dark on light nav)

    # Fix mobile menu colors
    content = content.replace(
        '    background: rgba(250,248,244,0.97);',
        '    background: rgba(250,248,244,0.98);'
    )
    content = content.replace(
        '  .mobile-menu a {\n    color: var(--primary-light);',
        '  .mobile-menu a {\n    color: var(--primary);'
    )
    content = content.replace(
        "  .mobile-menu a:hover { color: var(--text-primary); }",
        "  .mobile-menu a:hover { color: var(--primary-dark); }"
    )

    # Fix mobile-link colors in mobile menus that were #c9a96e (already replaced to primary in first pass, but may still have old)
    content = content.replace(
        "    color: var(--primary-light); text-decoration: none;",
        "    color: var(--primary); text-decoration: none;"
    )

    # Fix inline styles in HTML
    content = content.replace('color:var(--gold)', 'color:var(--primary)')
    content = content.replace('color:var(--gold-light)', 'color:var(--primary)')
    content = content.replace('background:var(--gold)', 'background:var(--primary)')

    # Fix services grid / testimonials grid background (gap separator)
    content = content.replace(
        'background: rgba(92,122,62,0.1);\n  }\n  /* ★ 서비스',
        'background: var(--border);\n  }\n  /* ★ 서비스'
    )
    content = content.replace(
        'background: rgba(92,122,62,0.1);\n  }\n  /* ★ 섹션',
        'background: var(--border);\n  }\n  /* ★ 섹션'
    )
    content = content.replace(
        'background: rgba(92,122,62,0.1);\n  }\n  .testimonial-card',
        'background: var(--border);\n  }\n  .testimonial-card'
    )

    # Fix testimonial-card background
    content = content.replace(
        '  .testimonial-card { background: var(--bg-section); padding: 48px 40px; }',
        '  .testimonial-card { background: var(--surface); border: 1px solid var(--border); padding: 48px 40px; }'
    )

    # Fix remaining dark background - mobile menu
    content = content.replace(
        '    background: var(--bg);\n    z-index: 99;',
        '    background: rgba(250,248,244,0.98);\n    z-index: 99;'
    )

    # Fix ebook section cover (keep its specific gradient but that is decorative, leave it)

    # Fix stat-num color
    content = content.replace(
        '    color: var(--primary-light);\n    line-height: 1;\n  }\n  .stat-label',
        '    color: var(--primary);\n    line-height: 1;\n  }\n  .stat-label'
    )

    # Fix nav-links hover color in index.html (was already set to primary)

    # Fix footer-logo and footer-nav
    content = content.replace(
        '    color: var(--primary-light);\n    letter-spacing: 0.1em;',
        '    color: var(--primary);\n    letter-spacing: 0.1em;'
    )
    content = content.replace(
        '  .footer-nav a:hover { color: var(--primary-light); }',
        '  .footer-nav a:hover { color: var(--primary); }'
    )

    # about-text strong
    content = content.replace(
        '  .about-text p strong { color: var(--primary-light); font-weight: 400; }',
        '  .about-text p strong { color: var(--primary); font-weight: 600; }'
    )

    # Fix career-item border
    content = content.replace(
        '    border-bottom: 1px solid rgba(92,122,62,0.1);\n    display: grid;',
        '    border-bottom: 1px solid var(--border);\n    display: grid;'
    )

    return content

files = [
    'index.html',
    'services.html',
    'reviews.html',
    'tips.html',
    'consult.html',
    'freebie.html',
    'diagnosis.html',
    'column.html',
]

for fname in files:
    if not os.path.exists(fname):
        print(f"Not found: {fname}")
        continue
    with open(fname, 'r', encoding='utf-8') as f:
        content = f.read()
    content = fix_all(content)
    with open(fname, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Done: {fname}")

print("All done")

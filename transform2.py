import re
import os

NEW_ROOT = """:root {
    --primary: #5C7A3E;
    --primary-light: #7A9E58;
    --primary-dark: #3F5B28;
    --accent: #A8B89A;
    --bg: #FAF8F4;
    --bg-section: #F2EFE8;
    --surface: #FFFFFF;
    --text-primary: #2C2C2C;
    --text-secondary: #5A5A5A;
    --text-muted: #8A8A8A;
    --border: #DDD9D0;
  }"""

NEW_FONTS = """<link rel="preconnect" href="https://fonts.googleapis.com" />
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;600;700&family=Noto+Sans+KR:wght@400;500;700;900&family=Cormorant+Garamond:wght@400;500;600&display=swap" rel="stylesheet" />"""

def replace_root(content):
    # Replace any :root { ... } block with new variables
    # Pattern to match :root { ... }
    result = re.sub(r':root\s*\{[^}]+\}', NEW_ROOT, content, count=1)
    return result

def replace_fonts(content):
    # Replace Google Fonts link tags
    # Match single link or preconnect+link combo
    # First remove existing preconnect if present
    content = re.sub(
        r'<link\s+rel="preconnect"\s+href="https://fonts\.googleapis\.com"\s*/>\s*\n?',
        '',
        content
    )
    # Now replace any remaining fonts.googleapis link
    content = re.sub(
        r'<link\s+href="https://fonts\.googleapis\.com[^"]*"\s+rel="stylesheet"\s*/?>',
        NEW_FONTS,
        content
    )
    # Also handle non-preconnect form
    content = re.sub(
        r'<link\s+rel="stylesheet"\s+href="https://fonts\.googleapis\.com[^"]*"\s*/?>',
        NEW_FONTS,
        content
    )
    return content

def replace_old_vars(content):
    """Replace old CSS variable references with new ones"""
    replacements = [
        # Dark backgrounds
        ('var(--dark)', 'var(--bg)'),
        ('var(--dark-2)', 'var(--bg-section)'),
        ('var(--dark-3)', 'var(--surface)'),
        # Gold colors
        ('var(--gold)', 'var(--primary)'),
        ('var(--gold-light)', 'var(--primary-light)'),
        ('var(--gold-pale)', 'var(--bg-section)'),
        # Text colors
        ('var(--white)', 'var(--text-primary)'),
        ('var(--light)', 'var(--text-primary)'),
        ('var(--text)', 'var(--text-primary)'),
        ('var(--mid)', 'var(--text-muted)'),
    ]
    for old, new in replacements:
        content = content.replace(old, new)
    return content

def fix_buttons(content):
    """Fix button color: var(--bg) -> #ffffff for buttons with --primary background"""
    # After replacing var(--dark) -> var(--bg), buttons that had color: var(--dark)
    # now have color: var(--bg) -- we need color: #ffffff
    # Look for button/btn rules with background primary and fix color
    # This is tricky to do with regex alone, let's do targeted replacements

    # btn-gold pattern: background: var(--primary); color: var(--bg);
    content = content.replace(
        'background: var(--primary);\n    color: var(--bg);',
        'background: var(--primary);\n    color: #ffffff;'
    )
    content = content.replace(
        'background: var(--primary);\n      color: var(--bg);',
        'background: var(--primary);\n      color: #ffffff;'
    )
    # Inline compact versions
    content = content.replace(
        'background: var(--primary); color: var(--bg);',
        'background: var(--primary); color: #ffffff;'
    )
    # Also fix hover to use primary-dark
    content = content.replace(
        'background: var(--primary-light); transform: translateY(-2px);',
        'background: var(--primary-dark); transform: translateY(-2px);'
    )
    content = content.replace(
        'background: var(--primary-light); transform: translateY(-1px);',
        'background: var(--primary-dark); transform: translateY(-1px);'
    )
    content = content.replace(
        'background: var(--primary-light); gap: 20px;',
        'background: var(--primary-dark); gap: 20px;'
    )
    # btn-ebook hover etc
    content = content.replace(
        '.btn-ebook:hover { background: var(--primary-light);',
        '.btn-ebook:hover { background: var(--primary-dark);'
    )
    content = content.replace(
        '.btn-subscribe:hover { background: var(--primary-light);',
        '.btn-subscribe:hover { background: var(--primary-dark);'
    )
    content = content.replace(
        '.btn-start:hover { background: var(--primary-light);',
        '.btn-start:hover { background: var(--primary-dark);'
    )
    content = content.replace(
        '.btn-submit:hover { background: var(--primary-light);',
        '.btn-submit:hover { background: var(--primary-dark);'
    )
    content = content.replace(
        '.btn-gold:hover { background: var(--primary-light);',
        '.btn-gold:hover { background: var(--primary-dark);'
    )
    return content

def fix_nav(content):
    """Fix nav backgrounds"""
    # Replace old dark nav backgrounds with light
    content = re.sub(
        r'background:\s*rgba\(14,14,14,0\.9[25]\);(\s*backdrop-filter)',
        r'background: rgba(250,248,244,0.95);\1',
        content
    )
    content = re.sub(
        r'background:\s*rgba\(14,14,14,0\.9[25]\);\s*backdrop-filter',
        r'background: rgba(250,248,244,0.95); backdrop-filter',
        content
    )
    # Also handle the consult.html nav
    content = content.replace(
        'background: rgba(250,248,244,0.95);\n    border-bottom: 1px solid var(--border);\n    backdrop-filter: blur(12px);',
        'background: rgba(250,248,244,0.95);\n    backdrop-filter: blur(12px);\n    border-bottom: 1px solid var(--border);'
    )
    return content

def fix_mobile_menu_links(content):
    """Fix mobile menu link colors"""
    content = content.replace(
        "color: #c9a96e; text-decoration: none;",
        "color: var(--primary); text-decoration: none;"
    )
    content = content.replace(
        ".mobile-link:hover { color: #fff; }",
        ".mobile-link:hover { color: var(--primary-dark); }"
    )
    content = content.replace(
        ".mobile-link:hover { color: var(--text-primary); }",
        ".mobile-link:hover { color: var(--primary-dark); }"
    )
    return content

def fix_card_borders(content):
    """Fix card borders and shadows"""
    # Border rgba gold -> use var(--border)
    content = content.replace(
        'border: 1px solid rgba(92,122,62,0.15)',
        'border: 1px solid var(--border)'
    )
    content = content.replace(
        'border: 1px solid rgba(92,122,62,0.25)',
        'border: 1px solid var(--border)'
    )
    content = content.replace(
        'border: 1px solid rgba(92,122,62,0.35)',
        'border: 1px solid var(--border)'
    )
    return content

def fix_body(content):
    """Fix body styles"""
    content = re.sub(
        r'body\s*\{[^}]*font-family:\s*\'Noto Sans KR\'[^}]*\}',
        lambda m: re.sub(r'font-weight:\s*3\d\d;', 'font-weight: 500;', m.group()),
        content
    )
    # Fix color: var(--text-primary) on body (it may have been var(--text) -> var(--text-primary) already)
    return content

def fix_filter_btn(content):
    """Fix filter button hover backgrounds"""
    content = content.replace(
        'background: rgba(92,122,62,0.06)',
        'background: rgba(92,122,62,0.08)'
    )
    return content

def fix_nav_link_active(content):
    """Make nav active links use --primary"""
    content = content.replace(
        '.nav-links a:hover, .nav-links a.active { color: var(--primary); }',
        '.nav-links a:hover, .nav-links a.active { color: var(--primary); }'
    )
    # Services.html and others had color: var(--gold) -> color: var(--primary) already handled
    return content

def fix_h1_h2_headings(content):
    """Add Noto Serif KR font to headings in style blocks"""
    # Replace Playfair Display with Noto Serif KR for main headings
    # Keep Playfair Display but add Noto Serif KR as primary
    content = content.replace(
        "font-family: 'Playfair Display', serif;",
        "font-family: 'Noto Serif KR', 'Cormorant Garamond', serif;"
    )
    return content

def fix_ebook_cover(content):
    """Fix ebook cover backgrounds"""
    # ebook cover has a specific dark blue gradient, keep it but it won't affect main theme
    return content

def fix_section_divider(content):
    """Fix section dividers"""
    content = content.replace(
        'background: var(--border)',
        'background: var(--border)'
    )
    return content

def fix_remaining_dark_colors(content):
    """Fix remaining dark color references"""
    # color: #ccc -> text-secondary
    content = content.replace('color: #ccc', 'color: var(--text-secondary)')
    content = content.replace('color: #d0ccc6', 'color: var(--text-secondary)')
    content = content.replace('color: #d0cac0', 'color: var(--text-secondary)')
    content = content.replace('color: #c0bab0', 'color: var(--text-secondary)')
    content = content.replace('color: #bbb', 'color: var(--text-secondary)')
    content = content.replace('color: #555', 'color: var(--text-muted)')
    content = content.replace('color: #888;', 'color: var(--text-muted);')
    # Fix remaining white color references in the bg-section for nav toggle span
    content = content.replace(
        'background: var(--text-primary);\n    transition: all 0.3s;',
        'background: var(--text-primary);\n    transition: all 0.3s;'
    )
    return content

def fix_footer(content):
    """Fix footer"""
    content = content.replace(
        'border-top: 1px solid rgba(92,122,62,0.1)',
        'border-top: 1px solid var(--border)'
    )
    content = content.replace(
        'border-top: 1px solid rgba(92,122,62,0.15)',
        'border-top: 1px solid var(--border)'
    )
    return content

def fix_inline_html_styles(content):
    """Fix inline styles in HTML that reference old variables"""
    content = content.replace("color:var(--gold)", "color:var(--primary)")
    content = content.replace("color: var(--gold)", "color: var(--primary)")
    content = content.replace("background:var(--gold)", "background:var(--primary)")
    content = content.replace("color:var(--gold-light)", "color:var(--primary)")
    content = content.replace("color:var(--gold-pale)", "color:var(--bg-section)")
    return content

def process_file(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()

    # Step 1: Replace :root block
    content = replace_root(content)

    # Step 2: Replace fonts
    content = replace_fonts(content)

    # Now work only on the style block for remaining transforms
    start = content.find('<style>')
    end_style_tag = content.find('</style>', start)
    if start == -1 or end_style_tag == -1:
        print(f"  Warning: no style block in {filename}")
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(content)
        return

    end = end_style_tag + len('</style>')
    style = content[start:end]
    before = content[:start]
    after = content[end:]

    # Step 3: Replace old variable names
    style = replace_old_vars(style)

    # Step 4: Fix buttons
    style = fix_buttons(style)

    # Step 5: Fix nav
    style = fix_nav(style)

    # Step 6: Fix mobile menu
    style = fix_mobile_menu_links(style)

    # Step 7: Fix card borders
    style = fix_card_borders(style)

    # Step 8: Fix remaining dark colors
    style = fix_remaining_dark_colors(style)

    # Step 9: Fix footer
    style = fix_footer(style)

    # Step 10: Fix h1/h2 headings
    style = fix_h1_h2_headings(style)

    # Fix filter btn
    style = fix_filter_btn(style)

    # Reassemble
    new_content = before + style + after

    # Fix inline HTML styles
    new_content = fix_inline_html_styles(new_content)

    with open(filename, 'w', encoding='utf-8') as f:
        f.write(new_content)

    print(f"Done: {filename}")


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

for f in files:
    if os.path.exists(f):
        process_file(f)
    else:
        print(f"File not found: {f}")

print("All done")

import re
import os

def transform_style(style):
    # Replace rgba gold/dark colors with green/light equivalents
    style = style.replace('rgba(201,169,110,', 'rgba(92,122,62,')
    style = style.replace('rgba(184,151,58,', 'rgba(92,122,62,')

    # Replace hex gold colors
    for old, new in [
        ('#B8973A', 'var(--primary)'),
        ('#b8973a', 'var(--primary)'),
        ('#D4AF5A', 'var(--primary-light)'),
        ('#d4af5a', 'var(--primary-light)'),
        ('#F5EDD6', 'var(--bg-section)'),
        ('#f5edd6', 'var(--bg-section)'),
        ('#c9a96e', 'var(--primary)'),
        ('#C9A96E', 'var(--primary)'),
        ('#e8d5b0', 'var(--primary-light)'),
        ('#E8D5B0', 'var(--primary-light)'),
    ]:
        style = style.replace(old, new)

    # Replace old dark hex backgrounds
    for old, new in [
        ('background: #0e0e0e', 'background: var(--bg)'),
        ('background: #0E0E0E', 'background: var(--bg)'),
        ('background: #111111', 'background: var(--bg)'),
        ('background: #111', 'background: var(--bg)'),
        ('background: #161616', 'background: var(--bg-section)'),
        ('background: #1a1a1a', 'background: var(--bg-section)'),
        ('background: #1A1A1A', 'background: var(--bg-section)'),
        ('background: #1f1f1f', 'background: var(--surface)'),
        ('background: #252525', 'background: var(--surface)'),
        ('background: #2a2a2a', 'background: var(--surface)'),
        ('background-color: #0e0e0e', 'background-color: var(--bg)'),
        ('background-color: #111', 'background-color: var(--bg)'),
    ]:
        style = style.replace(old, new)

    # Replace text colors
    for old, new in [
        ('color: #e8e4dc', 'color: var(--text-primary)'),
        ('color: #E8E4DC', 'color: var(--text-primary)'),
        ('color: #9a9a9a', 'color: var(--text-muted)'),
        ('color: #888', 'color: var(--text-muted)'),
        ('color: #6B6B6B', 'color: var(--text-secondary)'),
        ('color: #e2e2e2', 'color: var(--text-secondary)'),
        ('color: #aaa', 'color: var(--text-muted)'),
    ]:
        style = style.replace(old, new)

    # rgba dark mobile menu backgrounds
    for old, new in [
        ('background: rgba(14,14,14,.97)', 'background: rgba(250,248,244,0.98)'),
        ('background: rgba(14,14,14,0.97)', 'background: rgba(250,248,244,0.98)'),
        ('background: rgba(14,14,14,0.95)', 'background: rgba(250,248,244,0.95)'),
        ('background: rgba(14,14,14,0.92)', 'background: rgba(250,248,244,0.92)'),
    ]:
        style = style.replace(old, new)

    return style


def process_file(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find and transform the style block only
    start = content.find('<style>')
    end = content.find('</style>') + len('</style>')
    if start == -1:
        print(f"No style block in {filename}")
        return

    style = content[start:end]
    before = content[:start]
    after = content[end:]

    style = transform_style(style)

    with open(filename, 'w', encoding='utf-8') as f:
        f.write(before + style + after)

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

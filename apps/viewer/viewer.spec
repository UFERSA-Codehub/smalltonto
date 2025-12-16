# -*- mode: python ; coding: utf-8 -*-

import os

block_cipher = None

# Get the directory where this spec file is located
spec_dir = os.path.dirname(os.path.abspath(SPEC))

a = Analysis(
    [os.path.join(spec_dir, 'app.py')],
    pathex=[
        spec_dir,
        os.path.join(spec_dir, '..', 'core'),  # Include core for lexer/parser
    ],
    binaries=[],
    datas=[
        # Include the frontend dist folder
        (os.path.join(spec_dir, 'frontend', 'dist'), os.path.join('frontend', 'dist')),
    ],
    hiddenimports=[
        # pywebview backends
        'webview.platforms.winforms',
        'webview.platforms.edgechromium',
        'clr',
        # Core lexer/parser/semantic
        'lexer',
        'lexer.MyLexer',
        'lexer.Tokenizer',
        'lexer.TokenType',
        'lexer.Utils',
        'parser',
        'parser.MyParser',
        'parser.Parser',
        'parser.ParserSemantic',
        'parser.SemanticVisualizer',
        'ply',
        'ply.lex',
        'ply.yacc',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        # Exclude Qt since we're using WinForms/Chromium
        'PyQt5',
        'PyQt6',
        'qtpy',
    ],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='TontoViewer',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,  # Set to True if you want to see console output for debugging
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=None,  # Add path to .ico file if you have one
)

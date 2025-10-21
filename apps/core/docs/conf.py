# Configuration file for the Sphinx documentation builder.
import os
import sys

# Add the parent directory to Python path so autodoc can import the lexer modules
sys.path.insert(0, os.path.abspath('..'))

# -- Project information -----------------------------------------------------
project = 'smallTONTO'
copyright = '2025, Matheus Henrique, Yan Balbino'
author = 'Matheus Henrique, Yan Balbino'
release = '1.0.0'

# -- General configuration ---------------------------------------------------
extensions = [
    'sphinx.ext.autodoc',      # Auto-generate docs from docstrings
    'sphinx.ext.viewcode',     # Add source code links
    'sphinx.ext.napoleon',     # Support Google/NumPy style docstrings
    'sphinx.ext.intersphinx',  # Link to other documentation
    'sphinx.ext.autosummary',  # Generate summary tables
]

templates_path = ['_templates']
exclude_patterns = ['_build', 'Thumbs.db', '.DS_Store']
language = 'pt-BR'

# -- Autodoc configuration --------------------------------------------------
autodoc_default_options = {
    'members': True,
    'member-order': 'bysource',
    'special-members': '__init__',
    'undoc-members': True,
    'exclude-members': '__weakref__'
}

# -- Napoleon settings -------------------------------------------------------
napoleon_google_docstring = True
napoleon_numpy_docstring = True
napoleon_include_init_with_doc = False
napoleon_include_private_with_doc = False

# -- Options for HTML output -------------------------------------------------
html_theme = 'sphinx_rtd_theme'
html_static_path = ['_static']

# -- HTML theme options ------------------------------------------------------
html_theme_options = {
    'collapse_navigation': False,
    'sticky_navigation': True,
    'navigation_depth': 4,
    'includehidden': True,
    'titles_only': False
}

# -- GitHub Pages configuration ----------------------------------------------
html_baseurl = 'https://ufersa-codehub.github.io/smalltonto/'

# Create .nojekyll file for GitHub Pages
def create_nojekyll(app, docname, source):
    if app.builder.name == 'html':
        nojekyll_path = os.path.join(app.outdir, '.nojekyll')
        with open(nojekyll_path, 'w') as f:
            pass

def setup(app):
    app.connect('source-read', create_nojekyll)

# -- Intersphinx mapping -----------------------------------------------------
intersphinx_mapping = {
    'python': ('https://docs.python.org/3', None),
    'ply': ('https://ply.readthedocs.io/en/latest/', None),
}

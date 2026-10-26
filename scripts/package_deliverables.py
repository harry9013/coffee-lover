"""Build a source-only ZIP and a functional, self-contained offline HTML preview.
Run npm run build first. Screenshots stay internal and are excluded from delivery.
"""
import pathlib
import re
import subprocess
import sys
import zipfile

root = pathlib.Path(__file__).resolve().parents[1]
out = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else '/workspace/scratch/coffee-lover-handover')
out.mkdir(parents=True, exist_ok=True)
commit = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=root, text=True).strip()
short = commit[:7]
files = subprocess.check_output(['git', 'ls-files', '-z'], cwd=root).decode().split('\0')
archive = out / f'Coffee-Lover-Source-{short}.zip'
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as z:
    for name in files:
        if not name or name.startswith('docs/screenshots/'):
            continue
        path = root / name
        if path.is_symlink() or not path.is_file():
            raise ValueError(f'Unexpected source entry: {name}')
        if any(part in {'.git', 'node_modules', 'dist', 'test-results', '.aws', '.codex'} for part in path.relative_to(root).parts) or path.name.startswith('.env'):
            raise ValueError(f'Forbidden delivery path: {name}')
        z.write(path, f'coffee-lover/{name}')
    z.writestr('coffee-lover/SOURCE_COMMIT.txt', commit+'\n')
    z.writestr('coffee-lover/DELIVERY.txt', 'Screenshots are internal QA artifacts and intentionally excluded. Run npm ci and npm run dev. See README.md.\n')

html = (root/'dist/index.html').read_text()
def script(match):
    js = (root/'dist'/match.group(1).lstrip('/')).read_text().replace('</script', '<\\/script')
    return '<script type="module">'+js+'</script>'
def style(match):
    css = (root/'dist'/match.group(1).lstrip('/')).read_text()
    return '<style>'+css+'</style>'
html = re.sub(r'<script[^>]*src="([^"]+\.js)"[^>]*></script>', script, html)
html = re.sub(r'<link[^>]*href="([^"]+\.css)"[^>]*>', style, html)
html = html.replace('<head>', f'<head><!-- Coffee Lover offline preview. Source commit: {commit}. Browser-local prototype; no sync/authentication. -->', 1)
if re.search(r'<(?:script|link)[^>]*(?:src|href)="/?assets/', html):
    raise ValueError('Preview still refers to external build assets')
preview = out/f'Coffee-Lover-Offline-Preview-{short}.html'
preview.write_text(html)
with zipfile.ZipFile(out/f'Coffee-Lover-Offline-Preview-{short}.zip','w',zipfile.ZIP_DEFLATED) as z:
    z.write(preview,'Coffee-Lover.html')
    z.writestr('READ-ME.txt',f'''Coffee Lover functional offline preview\nSource commit: {commit}\n\nUnzip and open Coffee-Lover.html in a modern desktop browser. This is the running app, not screenshots. Select Editorial / Studio / Atlas on the shelf. All four modules work. Records are stored in this browser; file-based storage behavior may differ by browser. Use JSON export to keep a backup. If your browser restricts file URLs, serve this folder with python3 -m http.server --bind 127.0.0.1 8000 and open http://127.0.0.1:8000/Coffee-Lover.html. The standalone app was verified through a loopback-only server; direct file opening was blocked by cloud browser policy and is untested. The source project is the supported development route. No authentication, cross-device sync, public hosting or native app is included. The page loads no external assets. Research links open external sites only when selected.\n''')
for source,target in [('README.md','Coffee-Lover-Setup-and-Architecture.md'),('docs/VERIFICATION.md','Coffee-Lover-Verification.md'),('docs/COFFEE_RESEARCH.md','Coffee-Lover-Research.md'),('docs/REVIEW.md','Coffee-Lover-Independent-Review.md')]:
    path=root/source
    if path.exists():
        (out/target).write_bytes(path.read_bytes())
print('Source commit:',commit)
for path in sorted(out.iterdir()):
    print(path.name, path.stat().st_size)

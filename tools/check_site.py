"""Validate the static site's local links, fragment targets, and basic structure."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import sys

SITE = Path(__file__).resolve().parents[1] / "site"


class Page(HTMLParser):
    def __init__(self, path):
        super().__init__(convert_charrefs=True)
        self.path, self.ids, self.links = path, set(), []
        self.h1s = self.mains = 0
        self.errors = []
        self.feed(path.read_text())

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if "id" in a:
            if a["id"] in self.ids:
                self.errors.append(f'duplicate id: {a["id"]}')
            self.ids.add(a["id"])
        self.h1s += tag == "h1"
        self.mains += tag == "main"
        if tag == "img" and "alt" not in a:
            self.errors.append("image missing alt attribute")
        for key in ("href", "src"):
            if key in a:
                self.links.append(a[key])


pages = {path.resolve(): Page(path) for path in SITE.rglob("*.html")}
errors = []
links = 0
for path, page in pages.items():
    if page.h1s != 1 or page.mains != 1:
        page.errors.append("expected exactly one h1 and one main")
    for value in page.links:
        u = urlsplit(value)
        if u.scheme or u.netloc:
            continue
        links += 1
        target = (SITE / unquote(u.path.lstrip("/")) if u.path.startswith("/")
                  else path.parent / unquote(u.path)) if u.path else path
        target = target.resolve()
        if not target.is_relative_to(SITE):
            page.errors.append(f"link escapes site root: {value}")
            continue
        if target.is_dir():
            target /= "index.html"
        if not target.is_file():
            page.errors.append(f"missing local target: {value}")
        elif u.fragment and target in pages and unquote(u.fragment) not in pages[target].ids:
            page.errors.append(f"missing fragment: {value}")
    errors.extend(f"{path.relative_to(SITE)}: {error}" for error in page.errors)

if errors:
    print("\n".join(errors))
    sys.exit(1)
print(f"PASS: {len(pages)} HTML pages; {links} local links/assets/fragments; unique landmarks and IDs; image alt attributes.")

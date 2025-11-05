# Bill-Divide

```
Bill-Divide/
├── .gitignore
├── README.md
├── application/
│   ├── bill_divide/                 # project settings/urls
│   ├── manage.py
│   ├── core/                        # main app
│   │   ├── templates/
│   │   │   ├── _partials/           # reusable bits (partials)
│   │   │   │   ├── _head.html
│   │   │   │   ├── _header.html
│   │   │   │   ├── _footer.html
│   │   │   │   ├── _nav.html
│   │   │   │   └── _flash_messages.html
│   │   │   ├── base.html            # master layout (extends/includes partials)
│   │   │   ├── home.html            # example page (extends base)
│   │   │   └── blog/                # section-specific templates (optional)
│   │   ├── static/
│   │   │   ├── css/
│   │   │   │   ├── base.css
│   │   │   │   └── components/      # buttons, forms, cards, utilities
│   │   │   ├── js/
│   │   │   │   ├── main.js
│   │   │   │   └── modules/         # per-feature scripts
│   │   │   └── img/
│   │   └── ... (views, urls, models)
│   └── assets/                      # optional: raw/uncompiled assets (scss, ts)
└── docs/                            # design notes, wireframes, decisions
```
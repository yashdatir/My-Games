# Devayan — The Ten Drops of Amrita

An open-source, zero-dependency 3D browser action-exploration game powered by **Three.js** and the **Web Audio API**.

## Features
- **Expansive 3D Open World (`1000 × 1000`):** Explore the mythical land of Jambudweep, cross river valleys, swim in coastal waters, and travel between 10 Sacred Sanctums.
- **Seamless Ground-to-Orbit Flight:** Free the Garuda Vimana Sanctum on foot, board your sky-chariot (`E`), and soar seamlessly from the lower cloud layer into outer space (*Antariksha*).
- **Celestial Astra Combat:** Unlock and switch (`1`, `2`, `3`) between *Agneyastra*, *Varunastra*, and *Pashupatastra* to battle Svarbhanu's Chhaya-Sena and the Grahan-Durg eclipse fortress.
- **Zero-Asset Web Audio Synthesizer:** Real-time procedural Tanpura drone, Bansuri flute melodies (`N`), temple chimes, and combat sound effects.
- **Zero Build Tools Required:** Runs natively via browser ES Modules with local pinned Three.js builds (`libs/`).

## Quick Start (Local Development or Static Hosting)

Because browsers require HTTP/HTTPS to load ES Modules (`type="module"`), serve the root directory with any static web server:

```bash
# Python 3 (Ubuntu / macOS / Windows)
python3 -m http.server 8000

# Or Node / npx
npx serve .
```

Open `http://localhost:8000` in your browser. Ready for instant deployment on **GitHub Pages**, **Cloudflare Pages**, **Vercel**, or **Netlify**.

## Customizing Donation Links
Open `index.html` and update the URLs or UPI ID inside the `.support-corner` popover in the `#home-screen` (`GitHub Sponsors`, `Buy Me a Coffee`, and `data-upi`).

## Disclaimer
*Devayan is an original work of mythological-inspired fantasy fiction. All kingdoms, characters, sanctums, and events are fictional and crafted with deep respect for classical Indian cultural heritage.*

## License
Released under the [MIT License](./LICENSE).

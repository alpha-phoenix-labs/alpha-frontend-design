# Lizenzen der Sounddateien

Alle Dateien in diesem Ordner wurden für das Projekt selbst erzeugt, und zwar synthetisch mit ffmpeg (Sinustöne mit Hüllkurve). Sie enthalten kein Material Dritter. Die Pixabay-URLs aus der Referenz `spatial-core-reference.html` werden bewusst nicht verwendet: Das Projekt lädt keine Assets von fremden CDNs, und die Pixabay-Lizenz untersagt die Weitergabe der Originaldateien als eigenständige Dateien, zum Beispiel in einem Repository.

| Datei | Zweck (Referenz) | Länge | Herkunft | Lizenz |
|---|---|---|---|---|
| `ui-click.mp3` | Interaktionsklick (`#ui-sound`) | etwa 0,1 s (0,06 s Ton, Rest ist MP3-Encoder-Padding) | selbst erzeugt, 1800-Hz-Sinus, Tiefpass 4 kHz, 3 ms Einblendung, 50 ms Ausblendung | CC0 1.0 (gemeinfrei) |
| `ambient-chime.mp3` | Ambient-Hinweis (`#ambient-sound`) | etwa 0,73 s (0,7 s Ton plus Encoder-Padding) | selbst erzeugt, 880 Hz und 1318,5 Hz (Quinte), zweiter Ton um 120 ms versetzt, ausklingend | CC0 1.0 (gemeinfrei) |

Beide Dateien sind Mono, 44,1 kHz, MP3 mit 64 kbit/s. Die Referenz spielt sie mit Lautstärke 0.1 ab.

Befehle zur Reproduktion:

```sh
ffmpeg -f lavfi -i "sine=frequency=1800:duration=0.06" -af "volume=0.8,afade=t=in:d=0.003,afade=t=out:st=0.01:d=0.05,lowpass=f=4000" -ac 1 -ar 44100 -c:a libmp3lame -b:a 64k ui-click.mp3
ffmpeg -f lavfi -i "sine=frequency=880:duration=0.7" -f lavfi -i "sine=frequency=1318.5:duration=0.7" -filter_complex "[0]afade=t=out:st=0.05:d=0.6[a];[1]adelay=120,afade=t=in:st=0.12:d=0.01,afade=t=out:st=0.15:d=0.55[b];[a][b]amix=inputs=2:normalize=0,volume=0.5,atrim=0:0.7" -ac 1 -ar 44100 -c:a libmp3lame -b:a 64k ambient-chime.mp3
```

Schriften (`@fontsource/inter`, `@fontsource/jetbrains-mono`) stehen unter der SIL Open Font License 1.1 und werden als npm-Pakete gebündelt.

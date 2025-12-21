# Hello Tauri Example

<!-- LLM:OVERVIEW -->
VibeGame running as a native desktop application with Tauri. Demonstrates WebGL rendering, physics simulation, and XML entity creation in a cross-platform native window with full GPU acceleration.
<!-- /LLM:OVERVIEW -->

## Layout

```
hello-tauri/
├── context.md           # This file
├── src/main.ts          # Entry point
├── src-tauri/           # Tauri Rust backend
│   ├── src/main.rs      # Rust entry point
│   ├── Cargo.toml       # Rust dependencies (Tauri v2)
│   ├── tauri.conf.json  # Window config
│   └── icons/           # App icons
├── .cargo/config.toml   # Cross-compilation config
├── windows-build/       # Windows .exe output
├── index.html           # HTML with XML entities
├── package.json         # Tauri CLI v2
└── vite.config.ts       # Vite config (strictPort)
```

## Scope

- **In-scope**: Native desktop packaging, cross-platform builds, Windows cross-compilation from WSL
- **Out-of-scope**: Tauri native APIs, mobile targets

## Prerequisites

- **Rust**: [rustup.rs](https://rustup.rs/)
- **VibeGame**: Built in parent directory (`bun run build` from repo root)
- **Linux**: `libwebkit2gtk-4.1-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev`
- **Windows cross-compile**: `mingw-w64` (WSL)

## Running

```bash
# From repo root
bun run build
cd examples/hello-tauri
bun install

# Linux/macOS dev mode
bun run tauri:dev

# Linux/macOS production build
bun run tauri:build

# Windows cross-compile from WSL
bun run tauri build -- --target x86_64-pc-windows-gnu
# Output: windows-build/vibegame-hello.exe (requires WebView2)
```

## Architecture

- **Frontend**: Vite bundles TypeScript + VibeGame, serves to webview
- **Backend**: Tauri v2 creates native window (1280x720, resizable)
- **WebView**: Platform-native (WebView2 on Windows, WebKit on Linux/macOS)
- **Cross-compile**: mingw-w64 toolchain for Windows builds from WSL

<!-- LLM:EXAMPLES -->
## Examples

### Cross-Compile for Windows from WSL

```bash
# Install prerequisites (one-time)
rustup target add x86_64-pc-windows-gnu
apt-get install mingw-w64

# Build
cd examples/hello-tauri
bun run tauri build -- --target x86_64-pc-windows-gnu

# Output
ls windows-build/
# vibegame-hello.exe
# WebView2Loader.dll
```

Run `vibegame-hello.exe` on Windows 10/11 (WebView2 required).
<!-- /LLM:EXAMPLES -->

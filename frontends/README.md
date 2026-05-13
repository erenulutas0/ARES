
  # Earthquake Resilience Dashboard

  This is a code bundle for Earthquake Resilience Dashboard. The original project is available at https://www.figma.com/design/W8tqzqHCIHzsRQ5b4X7i2Y/Earthquake-Resilience-Dashboard.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## A-RES Demo Routes

  This app is used as a single frontend for the three-laptop demo:

  - `/edge-hub` for the edge laptop display
  - `/central` for the central coordination dashboard
  - `/authority` for the AFAD-like authority terminal

  Start it on the central laptop:

  ```bash
  npm run dev -- --host 0.0.0.0 --port 5173
  ```

  The app reads the backend from `http://<frontend-host>:8000` by default. Override this with `VITE_ARES_API_URL` when needed.

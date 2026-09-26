import io
import json
import os
import urllib.request
import urllib.error
import zipfile
from http.server import BaseHTTPRequestHandler

APP_REPO = "Origenix/Panipuristore-App"
ARTIFACT_NAME = "panipuristore-production-apk"

def github_request(url):
    token = os.environ.get("GITHUB_TOKEN")
    if not token:
        raise RuntimeError("GITHUB_TOKEN is not configured on Vercel.")
    req = urllib.request.Request(
        url,
        headers={
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {token}",
            "X-GitHub-Api-Version": "2026-03-10",
            "User-Agent": "PanipuriStore-Website",
        },
    )
    return urllib.request.urlopen(req, timeout=25)

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            artifacts_url = (
                f"https://api.github.com/repos/{APP_REPO}/actions/artifacts"
                f"?name={ARTIFACT_NAME}&per_page=10"
            )

            with github_request(artifacts_url) as response:
                payload = json.loads(response.read().decode("utf-8"))

            artifacts = [
                item for item in payload.get("artifacts", [])
                if not item.get("expired", False)
            ]

            if not artifacts:
                self.send_error(404, "No active PanipuriStore APK artifact was found.")
                return

            artifacts.sort(key=lambda item: item.get("created_at", ""), reverse=True)
            artifact = artifacts[0]

            with github_request(artifact["archive_download_url"]) as response:
                archive = response.read()

            with zipfile.ZipFile(io.BytesIO(archive)) as apk_zip:
                apk_name = "app-release.apk"
                if apk_name not in apk_zip.namelist():
                    candidates = [n for n in apk_zip.namelist() if n.lower().endswith(".apk")]
                    if not candidates:
                        self.send_error(404, "The latest artifact does not contain an APK.")
                        return
                    apk_name = candidates[0]
                apk_bytes = apk_zip.read(apk_name)

            self.send_response(200)
            self.send_header("Content-Type", "application/vnd.android.package-archive")
            self.send_header("Content-Disposition", 'attachment; filename="PanipuriStore-latest.apk"')
            self.send_header("Content-Length", str(len(apk_bytes)))
            self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
            self.send_header("Pragma", "no-cache")
            self.end_headers()
            self.wfile.write(apk_bytes)

        except urllib.error.HTTPError as exc:
            self.send_error(exc.code, "Unable to access the latest PanipuriStore APK.")
        except Exception as exc:
            print(f"APK download error: {exc}")
            self.send_error(500, "Unable to prepare the latest PanipuriStore APK.")

# Petit serveur web local pour tester le jeu (http://localhost:8123).
# Pas indispensable pour jouer : un double-clic sur index.html suffit.
# Il sert surtout à tester ce qui exige une vraie adresse web (installation sur téléphone, mode hors ligne).
param([int]$Port = 8123)
$racine = Split-Path -Parent $PSScriptRoot
$types = @{ ".html" = "text/html; charset=utf-8"; ".js" = "text/javascript; charset=utf-8"; ".css" = "text/css; charset=utf-8";
            ".json" = "application/json"; ".webmanifest" = "application/manifest+json"; ".png" = "image/png"; ".svg" = "image/svg+xml"; ".md" = "text/plain; charset=utf-8" }
$ecoute = New-Object System.Net.HttpListener
$ecoute.Prefixes.Add("http://localhost:$Port/")
$ecoute.Start()
Write-Host "Jeu disponible sur http://localhost:$Port/ (Ctrl+C pour arrêter)"
while ($ecoute.IsListening) {
  $ctx = $ecoute.GetContext()
  $chemin = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath.TrimStart("/"))
  if ($chemin -eq "") { $chemin = "index.html" }
  $fichier = [IO.Path]::GetFullPath((Join-Path $racine $chemin))
  if ($fichier.StartsWith($racine) -and (Test-Path $fichier -PathType Leaf)) {
    $octets = [IO.File]::ReadAllBytes($fichier)
    $ext = [IO.Path]::GetExtension($fichier).ToLower()
    $ctx.Response.ContentType = $(if ($types[$ext]) { $types[$ext] } else { "application/octet-stream" })
    $ctx.Response.Headers.Add("Cache-Control", "no-store")
    $ctx.Response.OutputStream.Write($octets, 0, $octets.Length)
  } else {
    $ctx.Response.StatusCode = 404
  }
  $ctx.Response.Close()
}

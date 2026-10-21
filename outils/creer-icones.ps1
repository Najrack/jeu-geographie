# Fabrique les icônes de l'application (dossier icones/) : un globe sur fond bleu.
# Le globe tient dans le cercle central (80 %) pour que l'icône puisse être découpée en rond par le téléphone.
# Usage : clic droit → « Exécuter avec PowerShell » (aucune installation nécessaire).
Add-Type -AssemblyName System.Drawing
$racine = Split-Path -Parent $PSScriptRoot
$dossier = Join-Path $racine "icones"
New-Item -ItemType Directory -Force $dossier | Out-Null

function Couleur($hex) { [System.Drawing.ColorTranslator]::FromHtml($hex) }

foreach ($taille in 180, 192, 512) {
  $img = New-Object System.Drawing.Bitmap $taille, $taille
  $g = [System.Drawing.Graphics]::FromImage($img)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.Clear((Couleur "#1f4e79"))

  $c = $taille / 2
  $r = $taille * 0.34
  $g.FillEllipse((New-Object System.Drawing.SolidBrush (Couleur "#d4e4ee")), $c - $r, $c - $r, 2 * $r, 2 * $r)

  # Méridiens et parallèles
  $trait = New-Object System.Drawing.Pen (Couleur "#1f4e79"), ([Math]::Max(2, $taille * 0.018))
  foreach ($f in 0.35, 0.75) { $g.DrawEllipse($trait, $c - $r * $f, $c - $r, 2 * $r * $f, 2 * $r) }
  $g.DrawLine($trait, $c, $c - $r, $c, $c + $r)
  $g.DrawLine($trait, $c - $r, $c, $c + $r, $c)
  foreach ($y in -0.5, 0.5) {
    $demi = $r * [Math]::Sqrt(1 - $y * $y)
    $g.DrawLine($trait, $c - $demi, $c + $y * $r, $c + $demi, $c + $y * $r)
  }
  $bord = New-Object System.Drawing.Pen (Couleur "#ffffff"), ([Math]::Max(2, $taille * 0.025))
  $g.DrawEllipse($bord, $c - $r, $c - $r, 2 * $r, 2 * $r)

  # Repère orange (comme un pays choisi dans le jeu)
  $p = $taille * 0.075
  $x = $c + $r * 0.38; $y = $c - $r * 0.42
  $g.FillEllipse((New-Object System.Drawing.SolidBrush (Couleur "#e69f00")), $x - $p, $y - $p, 2 * $p, 2 * $p)
  $g.DrawEllipse((New-Object System.Drawing.Pen (Couleur "#5a3d00"), ([Math]::Max(1.5, $taille * 0.012))), $x - $p, $y - $p, 2 * $p, 2 * $p)

  $img.Save((Join-Path $dossier "icone-$taille.png"), [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $img.Dispose()
}
Write-Host "Icônes créées dans $dossier"

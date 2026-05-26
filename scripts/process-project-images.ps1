param(
  [Parameter(Mandatory = $true)]
  [string]$InputDir,

  [string]$OutputDir = ".\portfolio",

  [Parameter(Mandatory = $true)]
  [string]$ProjectType,

  [Parameter(Mandatory = $true)]
  [string]$Location,

  [Parameter(Mandatory = $true)]
  [string]$BoardType,

  [Parameter(Mandatory = $true)]
  [string]$Industry,

  [string]$Description = "",

  [string]$ProjectTitle = "",

  [int]$MaxWidth = 1600,

  [int]$MaxHeight = 1600,

  [ValidateRange(1, 100)]
  [int]$Quality = 82,

  [string]$PublicPath = "/portfolio",

  [string]$CsvPath = ".\portfolio_upload.csv"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Convert-ToSlug {
  param([string]$Text)
  $slug = $Text.ToLowerInvariant()
  $slug = $slug -replace "&", " and "
  $slug = $slug -replace "[^a-z0-9]+", "-"
  $slug = $slug.Trim("-")
  if ([string]::IsNullOrWhiteSpace($slug)) { return "project" }
  return $slug
}

function Escape-Csv {
  param([object]$Value)
  $s = [string]$Value
  return '"' + ($s -replace '"', '""') + '"'
}

function Get-JpegCodec {
  [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
    Where-Object { $_.MimeType -eq "image/jpeg" } |
    Select-Object -First 1
}

function Resize-AndSaveJpeg {
  param(
    [string]$SourcePath,
    [string]$DestinationPath,
    [int]$MaxW,
    [int]$MaxH,
    [int]$JpegQuality
  )

  $source = [System.Drawing.Image]::FromFile($SourcePath)
  try {
    $ratio = [Math]::Min($MaxW / $source.Width, $MaxH / $source.Height)
    if ($ratio -gt 1) { $ratio = 1 }

    $newW = [Math]::Max(1, [int][Math]::Round($source.Width * $ratio))
    $newH = [Math]::Max(1, [int][Math]::Round($source.Height * $ratio))

    $bitmap = New-Object System.Drawing.Bitmap($newW, $newH, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
    try {
      $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
      try {
        $graphics.Clear([System.Drawing.Color]::White)
        $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $graphics.DrawImage($source, 0, 0, $newW, $newH)
      }
      finally {
        $graphics.Dispose()
      }

      $codec = Get-JpegCodec
      $encoder = [System.Drawing.Imaging.Encoder]::Quality
      $encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
      $encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter($encoder, [long]$JpegQuality)
      $bitmap.Save($DestinationPath, $codec, $encoderParams)
    }
    finally {
      if ($bitmap) { $bitmap.Dispose() }
    }

    return @{
      OriginalWidth = $source.Width
      OriginalHeight = $source.Height
      OutputWidth = $newW
      OutputHeight = $newH
    }
  }
  finally {
    $source.Dispose()
  }
}

$resolvedInput = Resolve-Path -LiteralPath $InputDir
if (!(Test-Path -LiteralPath $OutputDir)) {
  New-Item -ItemType Directory -Path $OutputDir | Out-Null
}
$resolvedOutput = Resolve-Path -LiteralPath $OutputDir
$publicPathClean = "/" + $PublicPath.Trim("/")

Add-Type -AssemblyName System.Drawing

$allowed = @(".jpg", ".jpeg", ".png", ".bmp")
$images = Get-ChildItem -LiteralPath $resolvedInput -File |
  Where-Object { $allowed -contains $_.Extension.ToLowerInvariant() } |
  Sort-Object Name

if ($images.Count -eq 0) {
  throw "No supported images found in $resolvedInput. Supported: jpg, jpeg, png, bmp."
}

$projectSlug = Convert-ToSlug $ProjectType
$locationSlug = Convert-ToSlug $Location
$boardSlug = Convert-ToSlug $BoardType
$industrySlug = Convert-ToSlug $Industry
$titleBase = if ([string]::IsNullOrWhiteSpace($ProjectTitle)) {
  "$BoardType for $Industry in $Location"
} else {
  $ProjectTitle
}

$rows = New-Object System.Collections.Generic.List[object]
$counter = 1

foreach ($image in $images) {
  $number = "{0:D2}" -f $counter
  $fileName = "$projectSlug-$locationSlug-$boardSlug-$number.jpg"
  $dest = Join-Path $resolvedOutput $fileName

  $sizes = Resize-AndSaveJpeg `
    -SourcePath $image.FullName `
    -DestinationPath $dest `
    -MaxW $MaxWidth `
    -MaxH $MaxHeight `
    -JpegQuality $Quality

  $generated = Get-Item -LiteralPath $dest
  $sourceIsJpeg = @(".jpg", ".jpeg") -contains $image.Extension.ToLowerInvariant()
  $wasResized = ($sizes.OutputWidth -ne $sizes.OriginalWidth) -or ($sizes.OutputHeight -ne $sizes.OriginalHeight)
  if ($sourceIsJpeg -and !$wasResized -and $generated.Length -gt $image.Length) {
    Copy-Item -LiteralPath $image.FullName -Destination $dest -Force
  }

  $relativePath = "$publicPathClean/$fileName"
  $altText = "$BoardType for $Industry in $Location - $ProjectType sign board project by Signs and Arts"
  $imageTitle = "$titleBase - Photo $counter"
  $finalDescription = if ([string]::IsNullOrWhiteSpace($Description)) {
    "$ProjectType sign board project for $Industry in $Location."
  } else {
    $Description
  }

  $rows.Add([pscustomobject]@{
    title = $imageTitle
    category = (Convert-ToSlug $ProjectType)
    location = $Location
    boardType = $BoardType
    industry = $Industry
    description = $finalDescription
    image = $relativePath
    altText = $altText
    originalFile = $image.Name
    outputFile = $fileName
    originalBytes = $image.Length
    outputBytes = (Get-Item -LiteralPath $dest).Length
    originalWidth = $sizes.OriginalWidth
    originalHeight = $sizes.OriginalHeight
    outputWidth = $sizes.OutputWidth
    outputHeight = $sizes.OutputHeight
  }) | Out-Null

  $counter++
}

$headers = @(
  "title",
  "category",
  "location",
  "boardType",
  "industry",
  "description",
  "image",
  "altText",
  "originalFile",
  "outputFile",
  "originalBytes",
  "outputBytes",
  "originalWidth",
  "originalHeight",
  "outputWidth",
  "outputHeight"
)

$csvLines = New-Object System.Collections.Generic.List[string]
$csvLines.Add(($headers -join ",")) | Out-Null
foreach ($row in $rows) {
  $csvLines.Add((($headers | ForEach-Object { Escape-Csv $row.$_ }) -join ",")) | Out-Null
}
[System.IO.File]::WriteAllLines((Join-Path (Get-Location) $CsvPath), $csvLines, [System.Text.UTF8Encoding]::new($false))

$originalTotal = ($rows | Measure-Object originalBytes -Sum).Sum
$outputTotal = ($rows | Measure-Object outputBytes -Sum).Sum
$saved = $originalTotal - $outputTotal

Write-Host "Processed $($rows.Count) image(s)"
Write-Host "Output folder: $resolvedOutput"
Write-Host "CSV: $CsvPath"
Write-Host ("Original total: {0:N0} bytes" -f $originalTotal)
Write-Host ("Output total:   {0:N0} bytes" -f $outputTotal)
Write-Host ("Saved:          {0:N0} bytes" -f $saved)

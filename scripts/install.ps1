param(
    [string]$Version = "latest"
)

$Repo = "yoonjaekoo-edu/PSCode"
$InstallDir = "$env:LOCALAPPDATA\PSCode"

if ($Version -eq "latest") {
    $api = Invoke-RestMethod "https://api.github.com/repos/$Repo/releases/latest"
    $Version = $api.tag_name
}

$exeUrl = "https://github.com/$Repo/releases/download/$Version/PSCode_Setup.exe"
$outFile = "$env:TEMP\PSCode_Setup.exe"

Write-Host "Downloading PSCode $Version ..." -ForegroundColor Cyan
Invoke-WebRequest -Uri $exeUrl -OutFile $outFile

Write-Host "Installing..." -ForegroundColor Cyan
Start-Process -FilePath $outFile -Wait

Write-Host "PSCode $Version installed successfully!" -ForegroundColor Green

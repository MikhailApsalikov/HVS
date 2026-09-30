$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path $PSScriptRoot -Parent
$taskTools = Join-Path $taskRoot '.android-tools'
$taskDownloads = Join-Path $taskTools 'downloads'
New-Item -ItemType Directory -Force $taskDownloads | Out-Null
$taskJdk = Join-Path $taskDownloads 'jdk17.zip'
if (!(Test-Path (Join-Path $taskTools 'java'))) {
    if (!(Test-Path $taskJdk)) {
        Invoke-WebRequest 'https://api.adoptium.net/v3/binary/latest/17/ga/windows/x64/jdk/hotspot/normal/eclipse' -OutFile $taskJdk
    }
    Expand-Archive -LiteralPath $taskJdk -DestinationPath (Join-Path $taskTools 'java') -Force
}
$env:JAVA_HOME = (Get-ChildItem (Join-Path $taskTools 'java') -Directory | Select-Object -First 1).FullName
$env:PATH = (Join-Path $env:JAVA_HOME 'bin') + [IO.Path]::PathSeparator + $env:PATH
$taskArchive = Join-Path $taskDownloads 'commandlinetools.zip'
if (!(Test-Path $taskArchive)) {
    Invoke-WebRequest 'https://dl.google.com/android/repository/commandlinetools-win-15859902_latest.zip' -OutFile $taskArchive
}
if ((Get-FileHash $taskArchive -Algorithm SHA256).Hash.ToLowerInvariant() -ne '90ae805d20434428bffcb699c290860f19bb5f66a67e6b330067e3de801fb04a') { throw 'Android command-line tools checksum mismatch.' }
$taskExtract = Join-Path $taskTools 'sdk-tools'
if (!(Test-Path (Join-Path $taskExtract 'cmdline-tools/bin/sdkmanager.bat'))) {
    Expand-Archive -LiteralPath $taskArchive -DestinationPath $taskExtract -Force
}
$env:ANDROID_HOME = Join-Path $taskTools 'sdk'
New-Item -ItemType Directory -Force $env:ANDROID_HOME | Out-Null
$taskManager = Join-Path $taskExtract 'cmdline-tools/bin/sdkmanager.bat'
# Interactive license review is intentionally available when this script is run by the owner.
& $taskManager "--sdk_root=$env:ANDROID_HOME" --licenses
if ($LASTEXITCODE -ne 0) { throw 'SDK license setup failed' }
& $taskManager "--sdk_root=$env:ANDROID_HOME" 'platform-tools' 'platforms;android-36' 'build-tools;36.0.0' 'ndk;27.1.12297006' 'cmake;3.22.1'
if ($LASTEXITCODE -ne 0) { throw 'Android SDK package installation failed' }
Write-Output 'Local Android toolchain is ready. Run pnpm mobile:apk.'

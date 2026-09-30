param([ValidateSet('preview', 'release')][string]$Variant = 'preview')
$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path $PSScriptRoot -Parent
$taskJava = Get-ChildItem -LiteralPath (Join-Path $taskRoot '.android-tools/java') -Directory -ErrorAction SilentlyContinue | Select-Object -First 1
if ($taskJava) { $env:JAVA_HOME = $taskJava.FullName }
$taskSdk = Join-Path $taskRoot '.android-tools/sdk'
if (Test-Path -LiteralPath $taskSdk) { $env:ANDROID_HOME = $taskSdk }
if (!$env:JAVA_HOME -or !$env:ANDROID_HOME) { throw 'Set JAVA_HOME and ANDROID_HOME, or run scripts/android-setup.ps1 first.' }
$env:GRADLE_USER_HOME = Join-Path $taskRoot '.android-tools/gradle-cache'
$env:PATH = (Join-Path $env:JAVA_HOME 'bin') + [IO.Path]::PathSeparator + $env:PATH
if ($Variant -eq 'release') {
    foreach ($taskName in @('HVS_KEYSTORE', 'HVS_STORE_PASSWORD', 'HVS_KEY_ALIAS', 'HVS_KEY_PASSWORD')) {
        if (![Environment]::GetEnvironmentVariable($taskName)) { throw "Missing release signing setting: $taskName" }
    }
}
$taskAndroid = Join-Path $taskRoot 'apps/mobile/android'
$taskDebugKey = Join-Path $taskAndroid 'app/debug.keystore'
if (!(Test-Path -LiteralPath $taskDebugKey)) {
    & keytool -genkeypair -keystore $taskDebugKey -storepass android -keypass android -alias androiddebugkey -dname 'CN=Android Debug,O=Android,C=US' -keyalg RSA -keysize 2048 -validity 10000
    if ($LASTEXITCODE -ne 0) { throw 'Unable to generate local preview signing key' }
}
& node (Join-Path $PSScriptRoot 'mobile-assets.mjs')
if ($LASTEXITCODE -ne 0) { throw 'Asset generation failed' }
Push-Location $taskAndroid
try {
    $taskBuild = if ($Variant -eq 'release') { ':app:bundleRelease' } else { ':app:assemblePreview' }
    & .\gradlew.bat $taskBuild --console=plain --no-daemon
    if ($LASTEXITCODE -ne 0) { throw 'Android build failed' }
} finally { Pop-Location }

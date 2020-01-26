$current = (Get-Location).Path;
# Write-Output $current

Get-ChildItem $PSScriptRoot -Directory | ForEach-Object {
    if (-NOT $_.FullName.EndsWith("tsconfig")) {
        # Write-Output $_.FullName
        Set-Location $_.FullName;
        npm-check-updates -u;
    }
}

Set-Location $current;

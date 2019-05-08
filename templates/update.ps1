$current = (Get-Location).Path;
# Write-Output $current

Get-ChildItem $PSScriptRoot -Directory | ForEach-Object {
    if (-NOT $_.FullName.EndsWith("tsconfig")) {
        # Write-Output $_.FullName
        Set-Location $_.FullName;
        # https://www.npmjs.com/package/npm-check-updates
        # version 3.1.9
        ncu -u -x "@types/bootstrap";
    }
}

Set-Location $current;

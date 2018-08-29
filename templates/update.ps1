$current = (Get-Location).Path;
# Write-Output $current

Get-ChildItem $PSScriptRoot -Directory | ForEach-Object {
    if (-NOT $_.FullName.EndsWith("tsconfig")) {
        # Write-Output $_.FullName
        Set-Location $_.FullName;
        # https://www.npmjs.com/package/npm-check-updates
        ncu -a -x "@types/bootstrap, mobx";
    }
}

Set-Location $current;

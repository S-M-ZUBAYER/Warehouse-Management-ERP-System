$ErrorActionPreference = 'Stop'
$serverRoot = 'D:\Warehouse ERP Update zip\EasyParcel\ERP_ServerSite_Test_EasyParcel_ManualOrder_Patched'
$files = @('modules/skuMapping/skuMapping.service.js', 'tests/workflow-permissions.test.cjs')
foreach ($relativeFile in $files) {
    $snapshot = Join-Path (Join-Path $PSScriptRoot 'applied') (Split-Path $relativeFile -Leaf)
    $target = Join-Path $serverRoot $relativeFile
    if ((Get-FileHash -LiteralPath $target).Hash -ne (Get-FileHash -LiteralPath $snapshot).Hash) {
        throw "File changed since the first update: $relativeFile"
    }
}
foreach ($relativeFile in $files) {
    Copy-Item -LiteralPath (Join-Path (Join-Path $PSScriptRoot 'server') $relativeFile) -Destination (Join-Path $serverRoot $relativeFile)
    Write-Output "Applied $relativeFile"
}

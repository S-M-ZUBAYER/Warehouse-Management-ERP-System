$ErrorActionPreference = 'Stop'
$serverRoot = [IO.Path]::GetFullPath('D:\Warehouse ERP Update zip\EasyParcel\ERP_ServerSite_Test_EasyParcel_ManualOrder_Patched')
$files = @(
    'utils/workflowPermissions.js',
    'modules/stock/stock.service.js',
    'modules/warehouses/warehouses.service.js',
    'modules/skuMapping/skuMapping.service.js',
    'modules/merchantSkus/merchantSkus.service.js',
    'modules/inventory/inventory.service.js',
    'modules/inbound/inbound.service.js',
    'modules/outbound/outbound.service.js',
    'modules/inbound/inbound.routes.js',
    'modules/outbound/outbound.routes.js',
    'tests/workflow-permissions.test.cjs',
    'routes/index.js'
)

# Check every original before applying any file, so concurrent edits are preserved.
foreach ($relativeFile in $files) {
    $target = [IO.Path]::GetFullPath((Join-Path $serverRoot $relativeFile))
    if (-not $target.StartsWith($serverRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
        throw "Target is outside the server folder: $relativeFile"
    }
    $original = Join-Path (Join-Path $PSScriptRoot 'original') $relativeFile
    $proposed = Join-Path (Join-Path $PSScriptRoot 'server') $relativeFile
    if (-not (Test-Path -LiteralPath $proposed)) { throw "Missing prepared file: $relativeFile" }
    if (Test-Path -LiteralPath $original) {
        if ((Get-FileHash -LiteralPath $target).Hash -ne (Get-FileHash -LiteralPath $original).Hash) {
            throw "Server file changed since review: $relativeFile"
        }
    } elseif (Test-Path -LiteralPath $target) {
        throw "New target already exists: $relativeFile"
    }
}

foreach ($relativeFile in $files) {
    $target = Join-Path $serverRoot $relativeFile
    Copy-Item -LiteralPath (Join-Path (Join-Path $PSScriptRoot 'server') $relativeFile) -Destination $target
    Write-Output "Applied $relativeFile"
}

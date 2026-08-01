param(
    [Parameter(Mandatory = $true)][string]$Original,
    [Parameter(Mandatory = $true)][string]$Revised,
    [string]$OutFile
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem

function Get-XlsxStructure([string]$Path) {
    $archive = [System.IO.Compression.ZipFile]::OpenRead((Resolve-Path -LiteralPath $Path))
    try {
        $entries = @{}
        foreach ($entry in $archive.Entries) { $entries[$entry.FullName] = $entry }

        function Read-XmlEntry([string]$Name) {
            $entry = $entries[$Name]
            if ($null -eq $entry) { return $null }
            $reader = [System.IO.StreamReader]::new($entry.Open())
            try { return [xml]$reader.ReadToEnd() } finally { $reader.Dispose() }
        }

        $workbook = Read-XmlEntry 'xl/workbook.xml'
        $styles = Read-XmlEntry 'xl/styles.xml'
        $sheetResults = @()
        foreach ($name in ($entries.Keys | Where-Object { $_ -match '^xl/worksheets/sheet\d+\.xml$' } | Sort-Object)) {
            $xml = Read-XmlEntry $name
            $sheetResults += [ordered]@{
                part = $name
                formulas = @($xml.SelectNodes('//*[local-name()="f"]')).Count
                validations = @($xml.SelectNodes('//*[local-name()="dataValidation"]')).Count
                filters = @($xml.SelectNodes('//*[local-name()="autoFilter"]')).Count
                tableParts = @($xml.SelectNodes('//*[local-name()="tablePart"]')).Count
                merges = @($xml.SelectNodes('//*[local-name()="mergeCell"]')).Count
                hyperlinks = @($xml.SelectNodes('//*[local-name()="hyperlink"]')).Count
            }
        }

        return [ordered]@{
            sheets = @($workbook.SelectNodes('//*[local-name()="sheet"]') | ForEach-Object {
                [ordered]@{ name = $_.name; state = if ($_.state) { $_.state } else { 'visible' } }
            })
            definedNames = @($workbook.SelectNodes('//*[local-name()="definedName"]')).Count
            formulas = ($sheetResults.formulas | Measure-Object -Sum).Sum
            validations = ($sheetResults.validations | Measure-Object -Sum).Sum
            filters = ($sheetResults.filters | Measure-Object -Sum).Sum
            tableParts = ($sheetResults.tableParts | Measure-Object -Sum).Sum
            merges = ($sheetResults.merges | Measure-Object -Sum).Sum
            hyperlinks = ($sheetResults.hyperlinks | Measure-Object -Sum).Sum
            fonts = [int]$styles.styleSheet.fonts.count
            fills = [int]$styles.styleSheet.fills.count
            borders = [int]$styles.styleSheet.borders.count
            cellFormats = [int]$styles.styleSheet.cellXfs.count
            sheetDetails = $sheetResults
        }
    }
    finally {
        $archive.Dispose()
    }
}

$originalStructure = Get-XlsxStructure $Original
$revisedStructure = Get-XlsxStructure $Revised
$criticalKeys = @('sheets', 'definedNames', 'formulas', 'validations', 'filters', 'tableParts', 'merges')
$differences = @()
foreach ($key in $criticalKeys) {
    $left = $originalStructure[$key] | ConvertTo-Json -Compress -Depth 20
    $right = $revisedStructure[$key] | ConvertTo-Json -Compress -Depth 20
    if ($left -ne $right) { $differences += $key }
}

$result = [ordered]@{
    original = $originalStructure
    revised = $revisedStructure
    criticalDifferences = $differences
    passed = $differences.Count -eq 0
}
$json = $result | ConvertTo-Json -Depth 20
if ($OutFile) {
    $resolvedOutFile = [System.IO.Path]::GetFullPath((Join-Path (Get-Location) $OutFile))
    [System.IO.Directory]::CreateDirectory([System.IO.Path]::GetDirectoryName($resolvedOutFile)) | Out-Null
    [System.IO.File]::WriteAllText($resolvedOutFile, $json, [System.Text.UTF8Encoding]::new($false))
}
$json
if (-not $result.passed) { exit 1 }

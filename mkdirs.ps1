$base = 'D:\545454545\New Dog food'
$dirs = @(
  'backend\src\config',
  'backend\src\models',
  'backend\src\routes',
  'backend\src\controllers',
  'backend\src\services',
  'backend\src\middleware',
  'backend\src\utils',
  'backend\seed',
  'backend\tests\unit',
  'backend\tests\integration',
  'backend\tests\acceptance',
  'frontend\src\api',
  'frontend\src\components',
  'frontend\src\pages',
  'frontend\src\hooks',
  'frontend\src\types',
  'frontend\src\layouts',
  'frontend\public',
  'acceptance',
  'docs'
)
foreach ($d in $dirs) {
  New-Item -ItemType Directory -Force -Path "$base\$d" | Out-Null
}
Write-Host 'All directories created successfully'

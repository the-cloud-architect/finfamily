# Navigate to your project root
cd C:\Users\wesley\cloudarchitect\finfamily

# First, let's verify what's in the nested finfamily folder
Write-Host "Contents of nested finfamily folder:" -ForegroundColor Yellow
Get-ChildItem -Path ".\finfamily" -Recurse | Select-Object FullName

# Prompt for confirmation
$confirmation = Read-Host "Do you want to delete the nested 'finfamily' folder? (yes/no)"

if ($confirmation -eq 'yes') {
    # Remove the nested finfamily folder
    Remove-Item -Path ".\finfamily" -Recurse -Force
    Write-Host "Nested finfamily folder has been removed successfully!" -ForegroundColor Green
} else {
    Write-Host "Operation cancelled." -ForegroundColor Red
}

# Show the cleaned up structure
Write-Host "`nCurrent directory structure:" -ForegroundColor Cyan
tree /F /A
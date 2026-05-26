# Project Image Processing

Use `process-project-images.ps1` to rename project photos, compress them for web, generate alt text, and create a CSV for portfolio/upload work.

Example:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\process-project-images.ps1 `
  -InputDir "D:\OneDrive\Desktop\project photos\clinic-kukatpally" `
  -OutputDir ".\portfolio" `
  -ProjectType "clinic" `
  -Location "Kukatpally Hyderabad" `
  -BoardType "Acrylic LED Sign Board" `
  -Industry "Clinic" `
  -Description "Custom acrylic LED storefront sign board installed for a clinic in Kukatpally, Hyderabad." `
  -ProjectTitle "Clinic Acrylic LED Board in Kukatpally" `
  -PublicPath "/portfolio" `
  -CsvPath ".\portfolio_upload.csv"
```

Output:

- Optimized JPG files in `portfolio/`
- A CSV with `title`, `category`, `location`, `boardType`, `industry`, `description`, `image`, and `altText`
- Size comparison columns so you can see compression savings

Recommended categories:

- `medical`
- `clinic`
- `salon`
- `restaurant`
- `tattoo`
- `retail`
- `hyderabad`

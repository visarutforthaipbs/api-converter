# API Converter Tool

A web application that helps users convert data from any API into user-friendly formats like CSV, Excel, or JSON for easier manipulation and analysis.

## Features

- Simple, user-friendly interface
- Paste any API URL to fetch data
- Preview fetched data in a table format
- Export data to multiple formats:
  - CSV (for spreadsheet applications)
  - Excel (.xlsx)
  - JSON (for developers)
- Automatic data formatting and handling
- Responsive design for desktop and mobile devices
- Built-in CORS proxy support for accessing APIs with CORS restrictions
- Robust error handling with helpful suggestions

## Getting Started

### Prerequisites

- Node.js (version 14.0 or above)
- npm or yarn

### Installation

1. Clone this repository

```bash
git clone https://github.com/yourusername/api-converter.git
cd api-converter
```

2. Install dependencies

```bash
npm install
```

3. Start the development server

```bash
npm start
```

4. Open your browser and navigate to http://localhost:3000

## How to Use

1. Enter the API URL in the input field (a default example is provided)
2. Optionally, enter a custom filename for your exported data
3. Click "Fetch Data" to retrieve the data from the API
4. Preview the data in the table that appears below
5. Click any of the export buttons (CSV, Excel, JSON) to download the data in your preferred format

## CORS Issues and Solutions

This application handles CORS (Cross-Origin Resource Sharing) restrictions that commonly occur when accessing APIs from different domains in several ways:

1. **Multiple CORS Proxies**: The application tries several CORS proxy services in sequence:

   - corsproxy.io
   - cors-anywhere.herokuapp.com
   - api.allorigins.win

2. **Development Proxy Configuration**: For local development, the application includes a proxy configuration in package.json.

3. **Local CORS Proxy**: You can run a local CORS proxy server with:

```bash
# Run the local proxy server
npm run proxy

# In a separate terminal, start the application
npm start
```

If you encounter API fetch errors, the application will provide helpful instructions and a convenient button to use the local proxy.

### Troubleshooting Large Datasets

If you're trying to fetch a very large dataset (like the example with 50,000 records), you might encounter timeout errors. Try these solutions:

1. Reduce the limit parameter in the URL (e.g., change `limit=50000` to `limit=1000`)
2. Run the local proxy server which may have better performance for large datasets
3. If the API supports pagination, use it to fetch data in smaller chunks

## Use Case Example

This tool was developed specifically to help with data from health APIs like:

```
https://epid-odpc2.ddc.moph.go.th/haze-r2/api/patient-group-location?limit=50000
```

Instead of manually copying and pasting data, users can now easily convert API responses to more manageable formats.

## Technologies Used

- React
- TypeScript
- Axios (for API requests)
- Papa Parse (for CSV conversion)
- SheetJS (for Excel conversion)
- FileSaver.js (for file downloading)
- Multiple CORS proxies for reliable cross-origin requests

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

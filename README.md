# PMRU GIS Dashboard

A comprehensive Geographic Information System (GIS) dashboard for the Performance Management & Reforms Unit (PMRU) of Khyber Pakhtunkhwa Government.

## 🚀 Features

- **Interactive Maps**: Google Maps integration with custom markers and clustering
- **State Land Management**: Visualization and management of state land data
- **Office Locations**: Track and display state office locations
- **Real-time Data**: Dynamic data visualization with charts and statistics
- **Responsive Design**: Mobile-first approach with modern UI components
- **Performance Monitoring**: Built-in performance tracking and optimization

## 🛠️ Tech Stack

- **Framework**: Next.js 15.2.4 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI primitives
- **Maps**: Google Maps API with MarkerClusterer
- **State Management**: Zustand
- **Charts**: Recharts
- **Icons**: Lucide React

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Muhammad-Waleed-Khalil/PMRU_GIS.git
cd PMRU_GIS
```

### 2. Install dependencies

```bash
npm install
# or
yarn install
```

### 3. Run the development server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📁 Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx          # Home page
├── components/           # React components
│   ├── pages/            # Page components
│   ├── ui/               # Reusable UI components
│   └── icons/            # Custom icons
├── context/              # React context providers
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions
├── public/               # Static assets
│   ├── data/            # GeoJSON data files
│   ├── images/          # Image assets
│   └── icons/           # Icon assets
└── types/               # TypeScript type definitions
```

## 🗺️ Data Sources

- **Boundaries**: Khyber Pakhtunkhwa administrative boundaries
- **State Land**: GeoJSON data for state land parcels
- **Office Locations**: Coordinates and details of state offices
- **Documents**: Supporting documents and images

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy automatically on every push

### Netlify

1. Push your code to GitHub
2. Connect your repository to Netlify
3. Deploy automatically on every push

### Manual Deployment

```bash
# Build the project
npm run build

# Start production server
npm start
```

## 🔧 Configuration

### Performance Optimization

The project includes several performance optimizations:

- Image optimization with Next.js Image component
- Code splitting and lazy loading
- Bundle analysis and optimization
- Performance monitoring utilities

## 📊 Features Overview

### Map Components
- **GoogleMap**: Main map component with Google Maps integration
- **StateLandLayer**: Displays state land parcels
- **StateOfficeLayer**: Shows office locations
- **MapControls**: Interactive map controls

### UI Components
- **Sidebar**: Navigation and controls
- **StatsPanel**: Statistics and metrics display
- **Header**: Application header with branding

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Development**: Muhammad Waleed Khalil
- **Organization**: Performance Management & Reforms Unit (PMRU)
- **Government**: Khyber Pakhtunkhwa, Pakistan

## 📞 Support

For support and questions, please contact the development team or create an issue in the repository.

## 🔄 Version History

- **v0.1.0**: Initial release with basic GIS functionality
- **v0.2.0**: Added state land management features
- **v0.3.0**: Enhanced UI/UX and performance optimizations

---

**Built with ❤️ for the people of Khyber Pakhtunkhwa**

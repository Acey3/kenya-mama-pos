# Mama Duka POS - Point of Sale System for Small Shops

A complete POS and inventory management system designed for small shops in Kenya. Track sales, manage stock, and grow your business with ease.

## Features

- Point of Sale interface
- Inventory management
- Sales tracking and reporting
- M-Pesa payment integration
- Offline support
- Multi-language support (English, Swahili, Kikuyu, Kalenjin, Luo)
- PWA (Progressive Web App) capabilities

## Technologies Used

- **Frontend**: React, TypeScript, Vite
- **UI Library**: shadcn/ui, Tailwind CSS
- **Backend**: Supabase
- **Database**: PostgreSQL
- **Payment Integration**: M-Pesa STK Push
- **Offline Storage**: IndexedDB

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory and add your Supabase credentials and other necessary environment variables.

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:8080`.

## Building for Production

```bash
npm run build
```

## Deployment

This application can be deployed to any static hosting service like Vercel, Netlify, or GitHub Pages.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

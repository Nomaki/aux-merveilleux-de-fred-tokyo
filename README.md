# 🎂 Birthday Cake Reservation System

A modern React application for birthday cake reservations with Japanese/English language support and integrated payment processing.

## Features

- **Multi-language Support**: Japanese (default) and English
- **Complete Reservation Flow**: 
  - Form with validation for customer details
  - Date/time picker with 48h minimum advance booking
  - Cake type selection with visual cards
  - Confirmation page with edit capability
  - Payment processing (Card & PayPay)
  - Success page with unique reservation code
- **Modern UI**: Built with Mantine components and custom theming
- **Responsive Design**: Works on desktop and mobile devices
- **Form Validation**: Comprehensive validation for all form fields
- **Error Handling**: Graceful error handling with user feedback
- **Email Confirmation**: Simulated confirmation email service

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **UI Library**: Mantine v8
- **Routing**: React Router v7
- **Forms**: Mantine Form + React Hook Form
- **Internationalization**: react-i18next
- **Date Handling**: date-fns
- **Payment**: Stripe (mock implementation)
- **Build Tool**: Vite
- **Deployment**: GitHub Pages

## Getting Started

### Prerequisites

- Node.js 20.19+ or 22.12+
- npm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/birthday-reservation-fred.git
   cd birthday-reservation-fred
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:5173](http://localhost:5173) in your browser

### Building for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Deployment

### GitHub Pages

The app is configured for automatic deployment to GitHub Pages:

1. Push to the `main` branch
2. GitHub Actions will automatically build and deploy
3. The app will be available at `https://yourusername.github.io/birthday-reservation-fred/`

### Manual Deployment

```bash
npm run build
npm run deploy
```

## Configuration

### Stripe Integration

To use real Stripe payments:

1. Replace the mock implementation in `src/services/stripe.ts`
2. Add your Stripe publishable key
3. Set up your backend payment processing

### Email Service

To enable real email confirmations:

1. Replace the mock email service in `src/pages/SuccessPage.tsx`
2. Integrate with your preferred email service (SendGrid, Mailgun, etc.)

## Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Page components
├── i18n/               # Internationalization
├── services/           # External service integrations
├── types/              # TypeScript type definitions
├── assets/             # Static assets
└── theme.ts            # Mantine theme configuration
```

## Customization

### Colors

The app uses a custom color scheme defined in `src/theme.ts`:
- Primary: `#F0D891` (golden yellow)
- Background: `#FEFFFF` (off-white)
- Footer: `#000000` (black)

### Languages

Add new languages by:
1. Creating a new locale file in `src/i18n/locales/`
2. Updating the i18n configuration in `src/i18n/index.ts`
3. Adding language options to the `LanguageToggle` component

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details
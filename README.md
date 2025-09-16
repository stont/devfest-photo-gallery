# DevFest Photo Gallery

A real-time, open-source photo sharing platform for #DevFest events worldwide. This web app allows organizers to create unique event communities and generate QR codes for attendees to instantly upload and share their photos.

## Features

- **Real-time Gallery:** Photos appear instantly without needing a page refresh.
- **Community Creation:** Organizers can create unique pages for their local DevFest events.
- **QR Code & Link Generation:** Instantly generate a unique QR code and URL for each event, making it easy for attendees to access the upload page.
- **Mobile-First Design:** A responsive and intuitive design that works beautifully on all devices.
- **In-App Camera:** Attendees can take photos directly within the app, with support for front and rear cameras.
- **Lazy Loading:** Galleries are optimized for performance, with images loading on demand as you scroll.
- **Live Demo:** The project is deployed and accessible at [https://devfest25photo.web.app](https://devfest25photo.web.app).

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/stont/devfest-photo-gallery.git
    ```

2.  **Open the project** in your favorite editor (VS Code is recommended).

3.  **Install dependencies:**
    ```bash
    npm install
    ```

4.  **Set up your Firebase project:**
    - Create a new project in the [Firebase Console](https://console.firebase.google.com/).
    - In the project's settings, create a new Web App.
    - Copy the `firebaseConfig` object.

5.  **Configure environment variables:**
    - Create a new file named `.env.local` in the root of the project.
    - Add your Firebase project's configuration to this file, like so:
      ```
      VITE_FIREBASE_API_KEY="YOUR_API_KEY"
      VITE_FIREBASE_AUTH_DOMAIN="YOUR_AUTH_DOMAIN"
      VITE_FIREBASE_PROJECT_ID="YOUR_PROJECT_ID"
      # ...and so on for the rest of the keys.
      ```

6.  **Run the development server:**
    ```bash
    npm run dev
    ```

### 2025
- [Olorunfemi Davis](https://github.com/olorunfemidavis) (GDG Ado-Ekiti Mentor)


## Contributing

Want to improve the app? Clone the project, add your features, and create a PR so we can review and merge your changes!

## Live Demo

Find the app at: [https://devfest25photo.web.app](https://devfest25photo.web.app)

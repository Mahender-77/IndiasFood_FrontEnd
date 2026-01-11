# India's Sweet Delivery App

This is a full-stack e-commerce application for sweet delivery, built with React, TypeScript, and Vite for the frontend, and Node.js, Express, and MongoDB for the backend.

## Features

- User authentication (register, login, profile)
- Product catalog with category filtering and search
- Shopping cart and wishlist functionality
- Order creation and history
- Admin panel for managing orders, products, customers, categories, and data exports
- Delivery person panel for managing assigned orders
- Cloudinary integration for product image uploads
- Responsive design with Tailwind CSS and Shadcn UI

## Project Structure

- `frontend/`: React + TypeScript frontend (Vite)
- `backend/`: Node.js + Express + TypeScript backend
- `backend/delivery-app/`: Separate React + TypeScript frontend for delivery persons

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- MongoDB Atlas account (or local MongoDB instance)
- Cloudinary account (for image uploads)

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/indias-sweet-delivery.git
    cd indias-sweet-delivery
    ```

2.  **Backend Setup:**

    ```bash
    cd backend
    npm install # or yarn install
    ```

    Create a `.env` file in the `backend/` directory with the following content:

    ```
    MONGO_URI=your_mongodb_connection_string
    JWT_SECRET=your_jwt_secret
    CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
    CLOUDINARY_API_KEY=your_cloudinary_api_key
    CLOUDINARY_API_SECRET=your_cloudinary_api_secret
    ```

3.  **Frontend Setup:**

    ```bash
    cd frontend
    npm install # or yarn install
    ```

    Create a `.env` file in the `frontend/` directory with the following content:

    ```
    VITE_API_BASE_URL=http://localhost:5000/api
    ```

4.  **Delivery App Frontend Setup:**

    ```bash
    cd backend/delivery-app
    npm install # or yarn install
    ```

    Create a `.env` file in the `backend/delivery-app/` directory with the following content:

    ```
    VITE_API_BASE_URL=http://localhost:5000/api
    ```

### Running the Application

1.  **Start the Backend Server:**

    ```bash
    cd backend
    npm run dev # or yarn dev
    ```

2.  **Start the Main Frontend:**

    ```bash
    cd frontend
    npm run dev # or yarn dev
    ```

3.  **Start the Delivery App Frontend (in a separate terminal):**

    ```bash
    cd backend/delivery-app
    npm run dev # or yarn dev
    ```

## Seed Data

To populate your database with initial data (admins, customers, delivery persons, categories, products, and sample orders), run the seed script:

```bash
cd backend
npm run seed # or yarn seed
```

To destroy all seeded data:

```bash
cd backend
npm run destroy # or yarn destroy
```

## Test Accounts

After running the seed script, you can log in with the following accounts:

**Admin Accounts:**
- **Username:** `admin1`
  **Email:** `admin1@example.com`
  **Password:** `password123`

- **Username:** `admin2`
  **Email:** `admin2@example.com`
  **Password:** `password123`

**Customer Accounts:**
- **Username:** `customer1`
  **Email:** `customer1@example.com`
  **Password:** `password123`

- **Username:** `customer2`
  **Email:** `customer2@example.com`
  **Password:** `password123`

- **Username:** `customer3`
  **Email:** `customer3@example.com`
  **Password:** `password123`

- **Username:** `customer4`
  **Email:** `customer4@example.com`
  **Password:** `password123`

- **Username:** `customer5`
  **Email:** `customer5@example.com`
  **Password:** `password123`

**Delivery Person Accounts:**
- **Username:** `delivery1`
  **Email:** `delivery1@example.com`
  **Password:** `password123`

- **Username:** `delivery2`
  **Email:** `delivery2@example.com`
  **Password:** `password123`

- **Username:** `delivery3`
  **Email:** `delivery3@example.com`
  **Password:** `password123`

## Technologies Used

**Frontend (Main & Delivery App):**
- React
- TypeScript
- Vite
- Tailwind CSS
- Shadcn UI
- React Router DOM
- Axios
- React Query
- PapaParse (for CSV exports)

**Backend:**
- Node.js
- Express
- TypeScript
- MongoDB / Mongoose
- JWT (JSON Web Tokens)
- Bcryptjs (password hashing)
- Joi (data validation)
- Multer (file uploads)
- Cloudinary (image storage)
- Dotenv (environment variables)

## Contributing

Contributions are welcome! Please feel free to open issues or submit pull requests.

## License

This project is licensed under the MIT License.
# IndiasFood_FrontEnd

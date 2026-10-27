# IMovies - Movie Ticket Booking (MERN)
Browse movies, pick a showtime, select seats, and book tickets with real-time seat availability.

## Tech
React (Vite) + Bootstrap, Node.js, Express.js, MongoDB (Mongoose), JWT, bcrypt, Axios.

## Features
- Register / Login (JWT auth)
- Browse movies and showtimes
- Seat selection with booked seats disabled
- My Bookings + cancel booking
- Admin: add movies (role: admin)

## Roles
- User: browse, book, cancel own bookings
- Admin: add movies

## Setup
1. `cd server`, copy `.env.example` to `.env` and fill in MONGO_URI
2. `npm install` then `npm run seed` then `npm run dev`
3. `cd client`, `npm install` then `npm run dev`
4. Open http://localhost:5173

## ER Diagram
User(name, email, password, role) 1--* Booking
Movie(title, description, poster, duration, genre) 1--* Show
Show(movie, date, time, price, bookedSeats) 1--* Booking
Booking(user, show, seats, totalPrice)

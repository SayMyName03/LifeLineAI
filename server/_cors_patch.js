// Enable CORS for frontend requests with credentials
import cors from "cors";

// ...existing code...

app.use(cors({
  origin: "http://localhost:8080",
  credentials: true
}));

// ...existing code...

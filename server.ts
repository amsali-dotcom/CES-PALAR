import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { STUDENTS } from "./mockData";

import { User, PushNotification, Student } from "./types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory "database"
const db = {
  users: [] as User[],
  notifications: [] as PushNotification[],
  grades: [] as unknown[],
  courses: [] as unknown[],
  students: [...STUDENTS] as Student[],
  messages: [] as Message[],
};

async function startServer() {
  console.log("Checking environment variables...");
  console.log("GEMINI_API_KEY present:", !!process.env.GEMINI_API_KEY);
  
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    path: "/api/socket.io/",
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000,
    connectTimeout: 45000,
    transports: ['websocket', 'polling'],
    addTrailingSlash: false
  });

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Extreme Cache Busting
  app.use((req, res, next) => {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    res.set("Surrogate-Control", "no-store");
    res.set("X-Build-Timestamp", new Date().getTime().toString());
    next();
  });

  // --- API Routes ---
  const apiRouter = express.Router();

  // Middleware to log all API requests
  apiRouter.use((req, res, next) => {
    console.log(`[API] ${req.method} ${req.url}`);
    next();
  });

  // Health check
  apiRouter.get("/health", (req, res) => {
    res.set("X-App-Version", "2.6.1");
    res.json({ status: "ok", version: "2.6.1", timestamp: new Date().toISOString() });
  });

  apiRouter.get("/ping", (req, res) => {
    res.send("pong");
  });

  // Users
  apiRouter.get("/users", (req, res) => {
    res.json(db.users);
  });

  apiRouter.delete("/users/:id", (req, res) => {
    const { id } = req.params;
    db.users = db.users.filter(u => u.id !== id);
    res.json({ status: "ok" });
  });

  // Config
  let schoolConfig = {
    absenceAlertThreshold: 5,
    pensionsByLevel: { '2nde': 450000, '1ère': 500000, 'Term': 550000 },
    examPeriods: [{ name: 'Trimestre 3', startDate: '2024-06-15' }]
  };

  apiRouter.get("/config", (req, res) => {
    res.json(schoolConfig);
  });

  apiRouter.post("/config", (req, res) => {
    schoolConfig = req.body;
    res.json(schoolConfig);
  });

  // Students
  apiRouter.get("/students", (req, res) => {
    res.json(db.students);
  });

  apiRouter.post("/students/update", (req, res) => {
    const updatedStudents = req.body;
    db.students = updatedStudents;
    io.emit("students_updated", db.students);
    res.json({ status: "ok" });
  });

  // Auth
  apiRouter.post("/auth/register", (req, res) => {
    const user = req.body;
    const normalizedId = user.uniqueId.trim().toUpperCase();
    const exists = db.users.find(u => u.uniqueId.toUpperCase() === normalizedId && u.role === user.role);
    if (exists) return res.status(400).json({ error: "User already exists" });
    
    const newUser = { ...user, uniqueId: normalizedId, id: Math.random().toString(36).substr(2, 9) };
    db.users.push(newUser);
    res.json(newUser);
  });

  apiRouter.post("/auth/login", (req, res) => {
    const { uniqueId, password, role } = req.body;
    const normalizedId = uniqueId.trim().toUpperCase();
    const user = db.users.find(u => u.uniqueId.toUpperCase() === normalizedId && u.password === password && u.role === role);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    res.json(user);
  });

  // Notifications
  apiRouter.get("/notifications/all", (req, res) => {
    res.json(db.notifications);
  });

  apiRouter.get("/notifications/:userId", (req, res) => {
    const { userId } = req.params;
    const userNotifs = db.notifications.filter(n => n.recipientId === userId);
    res.json(userNotifs);
  });

  apiRouter.patch("/notifications/:id", (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const index = db.notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      db.notifications[index] = { ...db.notifications[index], ...updates };
      res.json(db.notifications[index]);
    } else {
      res.status(404).json({ error: "Notification not found" });
    }
  });

  apiRouter.post("/notifications", (req, res) => {
    const notif = { 
      ...req.body, 
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now()
    };
    db.notifications.push(notif);
    io.emit("notification", notif);
    res.json(notif);
  });

  apiRouter.post("/reset", (req, res) => {
    db.users = [];
    db.notifications = [];
    db.students = [...STUDENTS];
    db.messages = [];
    io.emit("students_updated", db.students);
    res.json({ status: "ok" });
  });

  apiRouter.get("/messages/:userId", (req, res) => {
    const { userId } = req.params;
    const userMessages = db.messages.filter(m => m.senderId === userId || m.recipientId === userId);
    res.json(userMessages);
  });

  apiRouter.post("/messages", (req, res) => {
    const msg = {
      ...req.body,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now()
    };
    db.messages.push(msg);
    io.to(msg.recipientId).emit("new_message", msg);
    res.json(msg);
  });

  app.use("/api", apiRouter);

  console.log(`[Server] NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`[Server] Serving static files from: ${path.join(__dirname, "dist")}`);

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== "production") {
    console.log("Initializing Vite in middleware mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite middleware attached.");
    
    // SPA fallback for development
    app.use(async (req, res, next) => {
      const url = req.originalUrl;
      try {
        const fs = await import('fs');
        let template = fs.readFileSync(path.resolve(__dirname, "index.html"), "utf-8");
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    console.log("Running in production mode.");
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  // --- Socket.io Logic ---
  io.on("connection", (socket) => {
    console.log(`[Socket] New connection: ${socket.id}`);
    
    socket.on("join", (userId) => {
      socket.join(userId);
      console.log(`[Socket] User ${userId} joined room ${userId}`);
    });

    socket.on("send_notification", (notifData) => {
      console.log(`[Socket] Fallback notification received: ${notifData.title}`);
      const notif = { 
        ...notifData, 
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now()
      };
      db.notifications.push(notif);
      io.emit("notification", notif);
    });

    socket.on("disconnect", (reason) => {
      console.log(`[Socket] Client disconnected: ${socket.id} (Reason: ${reason})`);
    });

    socket.on("error", (error) => {
      console.error(`[Socket] Error for ${socket.id}:`, error);
    });
  });

  const PORT = 3000;
  httpServer.on('error', (e: Error & { code?: string }) => {
    if (e.code === 'EADDRINUSE') {
      console.error(`!!! Port ${PORT} is already in use. This usually happens during a quick restart.`);
      process.exit(1);
    }
  });

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`>>> Server is listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("!!! Failed to start server:", err);
});
